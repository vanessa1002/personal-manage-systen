import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  GoogleAuthProvider,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
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
let loadingUid = null;
let redirectResultPending = false;
let redirectResultPromise = null;
let db;
const REDIRECT_PENDING_KEY = "dayflow-google-redirect-pending";

function hasPendingRedirect() {
  try {
    return sessionStorage.getItem(REDIRECT_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

function setPendingRedirect(pending) {
  try {
    if (pending) sessionStorage.setItem(REDIRECT_PENDING_KEY, "1");
    else sessionStorage.removeItem(REDIRECT_PENDING_KEY);
  } catch {
    // Firebase's redirect result can still be processed if session storage is unavailable.
  }
}

function showSignedOut() {
  activeUid = null;
  document.body.classList.remove("authenticated");
  gate.hidden = false;
  signInButton.disabled = false;
}

function dataRef(uid) {
  return doc(db, "users", uid, "dayflow", "main");
}

function withTimeout(promise, milliseconds, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), milliseconds);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function loadUserData(user) {
  if (!user) return;
  if (activeUid === user.uid && document.body.classList.contains("authenticated")) return;
  if (loadingUid === user.uid) return;

  const revision = ++authRevision;
  loadingUid = user.uid;
  activeUid = null;
  document.body.classList.remove("authenticated");
  gate.hidden = false;
  status.textContent = "正在載入你的個人資料…";

  try {
    if (!window.dayflow) throw new Error("日序資料介面尚未載入。");
    status.textContent = "正在準備日序資料…";
    await withTimeout(window.dayflow.ready, 10000, "日序資料介面初始化逾時");

    status.textContent = "正在連線讀取 Firestore…";
    const ref = dataRef(user.uid);
    const snapshot = await withTimeout(getDoc(ref), 15000, "Firestore 讀取逾時");
    if (revision !== authRevision) return;
    if (snapshot.exists()) {
      window.dayflow.load(snapshot.data());
    } else {
      status.textContent = "正在建立你的個人資料…";
      await withTimeout(setDoc(ref, window.dayflow.snapshot()), 15000, "Firestore 寫入逾時");
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
    status.textContent = `個人資料載入失敗：${error.message}`;
    signInButton.disabled = false;
  } finally {
    if (loadingUid === user.uid) loadingUid = null;
  }
}

function completeRedirectSignIn(auth) {
  if (redirectResultPromise) return redirectResultPromise;
  if (!hasPendingRedirect()) return Promise.resolve(null);

  redirectResultPending = true;
  redirectResultPromise = (async () => {
    status.textContent = "正在讀取 Google 登入結果…";
    try {
      const result = await withTimeout(
        getRedirectResult(auth),
        15000,
        "Google 登入結果讀取逾時"
      );
      const user = result?.user || auth.currentUser;
      setPendingRedirect(false);
      if (user) {
        await loadUserData(user);
        redirectResultPending = false;
      } else {
        redirectResultPending = false;
        authRevision++;
        loadingUid = null;
        showSignedOut();
        status.textContent = "Google 登入未完成，請再試一次。";
      }
      return user || null;
    } catch (error) {
      setPendingRedirect(false);
      redirectResultPending = false;
      showSignedOut();
      status.textContent = `Google 登入結果讀取失敗：${error.message}`;
      return null;
    } finally {
      redirectResultPromise = null;
    }
  })();
  return redirectResultPromise;
}

if (!isFirebaseConfigured) {
  status.textContent = "尚未設定 Firebase。請先填入 firebase-config.js 的專案設定。";
} else {
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    db = getFirestore(app);
    redirectResultPending = hasPendingRedirect();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    signInButton.disabled = false;
    status.textContent = "正在讀取登入狀態…";

    onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (redirectResultPending) return;
        authRevision++;
        loadingUid = null;
        showSignedOut();
        status.textContent = "";
        email.textContent = "";
        return;
      }
      void loadUserData(user);
    }, (error) => {
      setPendingRedirect(false);
      redirectResultPending = false;
      showSignedOut();
      status.textContent = `登入狀態讀取失敗：${error.message}`;
    });

    if (redirectResultPending) {
      signInButton.disabled = true;
      void completeRedirectSignIn(auth);
    }

    window.addEventListener("pageshow", (event) => {
      if (event.persisted && hasPendingRedirect()) {
        signInButton.disabled = true;
        void completeRedirectSignIn(auth);
      }
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
      status.textContent = "正在前往 Google 登入…";
      setPendingRedirect(true);
      redirectResultPending = true;
      try {
        await signInWithRedirect(auth, provider);
        if (hasPendingRedirect()) void completeRedirectSignIn(auth);
      } catch (error) {
        setPendingRedirect(false);
        redirectResultPending = false;
        status.textContent = `登入失敗：${error.message}`;
        signInButton.disabled = false;
      }
    });

    signOutButton.addEventListener("click", async () => {
      signOutButton.disabled = true;
      try {
        await saveQueue;
        setPendingRedirect(false);
        redirectResultPending = false;
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
