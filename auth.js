import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const gate = document.getElementById("authGate");
const status = document.getElementById("authStatus");
const signInButton = document.getElementById("googleSignIn");
const signOutButton = document.getElementById("googleSignOut");
const email = document.getElementById("authEmail");

function setSignedIn(user) {
  document.body.classList.toggle("authenticated", Boolean(user));
  gate.hidden = Boolean(user);
  email.textContent = user?.displayName || user?.email || "已登入";
}

if (!isFirebaseConfigured) {
  status.textContent = "尚未設定 Firebase。請先填入 firebase-config.js 的專案設定。";
} else {
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    signInButton.disabled = false;
    status.textContent = "";

    onAuthStateChanged(auth, (user) => setSignedIn(user), (error) => {
      setSignedIn(null);
      status.textContent = `登入狀態讀取失敗：${error.message}`;
    });

    signInButton.addEventListener("click", async () => {
      signInButton.disabled = true;
      status.textContent = "正在開啟 Google 登入…";
      try {
        await signInWithPopup(auth, provider);
      } catch (error) {
        status.textContent = error.code === "auth/popup-closed-by-user"
          ? "登入視窗已關閉，請再試一次。"
          : `登入失敗：${error.message}`;
      } finally {
        signInButton.disabled = false;
      }
    });

    signOutButton.addEventListener("click", async () => {
      try {
        await signOut(auth);
      } catch (error) {
        status.textContent = `登出失敗：${error.message}`;
      }
    });
  } catch (error) {
    status.textContent = `Firebase 初始化失敗：${error.message}`;
  }
}
