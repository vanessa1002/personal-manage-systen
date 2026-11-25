# personal-manage-systen
個人行程與任務管理系統

## Firebase 登入與個人資料

網站使用 Firebase Authentication 的 Google provider，並將每個帳號的行程、任務和分類存入 Cloud Firestore：`users/{Firebase Auth UID}/dayflow/main`。前端只讀寫目前登入 UID 對應的文件，`firestore.rules` 也要求登入者 UID 必須與文件路徑中的 UID 相同。

第一次登入的帳號會在自己的文件中建立一份獨立的範例行程和任務；之後修改內容會自動儲存在該帳號下。既有瀏覽器 `localStorage` 中的資料不會自動匯入，避免把共用裝置上的資料錯誤歸到第一個登入者名下。

### Firebase Console 設定

1. 在 Firebase Console 啟用 Authentication 的 Google 登入方式，並將部署網域（例如 `vanessa1002.github.io`）加入 Authorized domains。
2. 在同一 Firebase 專案建立 Cloud Firestore 資料庫。
3. 確認 `firebase-config.js` 使用該專案的 Web app 設定。
4. 從專案根目錄執行 `firebase deploy --only firestore:rules` 發布本專案的 `firestore.rules`（需要已安裝 Firebase CLI，並先執行 `firebase login` 及 `firebase use <project-id>`）。也可以在 Firebase Console 的 Firestore Rules 頁面貼上 `firestore.rules` 內容並發布。
5. 推送變更，等待 GitHub Pages 部署完成。

Firebase Web app 設定中的 API key 是公開識別資訊；請勿在前端放置服務帳戶金鑰或其他私密憑證。資料存取由 Firestore Security Rules 保護；修改前端程式碼不能繞過這些伺服器端規則。
