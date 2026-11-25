import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  doc,
  getFirestore,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const gate = document.getElementById("authGate");
const status = document.getElementById("authStatus");
const signInButton = document.getElementById("googleSignIn");
const signOutButton = document.getElementById("googleSignOut");
const email = document.getElementById("authEmail");
let activeUid = null;
let saveQueue = Promise.resolve();
let authRevision = 0;
let db;

function showSignedOut() {
  activeUid = null;
  document.body.classList.remove("authenticated");
  gate.hidden = false;
}

function dataRef(uid) {
  return doc(db, "users", uid, "dayflow", "main");
}

if (!isFirebaseConfigured) {
  status.textContent = "尚未設定 Firebase。請先填入 firebase-config.js 的專案設定。";
} else {
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    db = getFirestore(app);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    signInButton.disabled = false;
    status.textContent = "正在讀取登入狀態…";

    onAuthStateChanged(auth, async (user) => {
      const revision = ++authRevision;
      if (!user) {
        showSignedOut();
        status.textContent = "";
        email.textContent = "";
        return;
      }

      activeUid = null;
      document.body.classList.remove("authenticated");
      gate.hidden = false;
      status.textContent = "正在載入你的個人資料…";
      try {
        const ref = dataRef(user.uid);
        const snapshot = await getDoc(ref);
        if (revision !== authRevision) return;
        if (!window.dayflow) throw new Error("日序資料介面尚未初始化，請重新整理頁面。");
        if (snapshot.exists()) {
          window.dayflow.load(snapshot.data());
        } else {
          // Each new account gets its own copy of the starter examples.
          await setDoc(ref, window.dayflow.snapshot());
        }
        if (revision !== authRevision) return;
        activeUid = user.uid;
        email.textContent = user.displayName || user.email || "已登入";
        status.textContent = "";
        document.body.classList.add("authenticated");
        gate.hidden = true;
      } catch (error) {
        if (revision !== authRevision) return;
        showSignedOut();
        status.textContent = `個人資料載入失敗：${error.message}。請確認已啟用 Cloud Firestore 並發布 firestore.rules。`;
      }
    }, (error) => {
      showSignedOut();
      status.textContent = `登入狀態讀取失敗：${error.message}`;
    });

    window.addEventListener("dayflow-save", (event) => {
      const uid = activeUid;
      if (!uid) return;
      const data = event.detail;
      saveQueue = saveQueue.then(() => {
        if (activeUid === uid) return setDoc(dataRef(uid), data);
      }).catch((error) => {
        const toast = document.getElementById("toast");
        toast.textContent = `資料儲存失敗：${error.message}`;
        toast.classList.add("show");
      });
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
      signOutButton.disabled = true;
      try {
        await saveQueue;
        await signOut(auth);
      } catch (error) {
        status.textContent = `登出失敗：${error.message}`;
      } finally {
        signOutButton.disabled = false;
      }
    });
  } catch (error) {
    status.textContent = `Firebase 初始化失敗：${error.message}`;
  }
}
