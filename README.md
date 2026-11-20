# personal-manage-systen
個人行程與任務管理系統

## Google 登入（Firebase）

網站使用 Firebase Authentication 的 Google provider。部署前請先：

1. 在 Firebase Console 建立或選擇專案，新增 Web app，並在 Authentication 的 Sign-in method 啟用 Google。
2. 將 `firebase-config.js` 中的範例值換成 Firebase 專案的 Web app 設定。
3. 在 Authentication 的 Authorized domains 加入 `vanessa1002.github.io`。
4. 推送變更，等待 GitHub Pages 部署完成。

Firebase Web app 設定中的 API key 是公開識別資訊；請勿在前端放置服務帳戶金鑰或其他私密憑證。這個靜態登入畫面只控制一般瀏覽器的頁面顯示，不能保護公開 GitHub Pages 上的 HTML、原始碼或資料。若要限制未登入者讀取資料，需將資料放在有伺服器端驗證的服務（例如 Firestore Security Rules），並避免把私人資料編入公開頁面。
