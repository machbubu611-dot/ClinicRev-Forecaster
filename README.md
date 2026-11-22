# 分院年度營收推算器

純靜態網站（HTML + JS），放在 GitHub Pages；報表資料與參數存在 Firebase Firestore，所有人開啟網址看到的都是管理者最近一次上傳的資料。

## 檔案
- `index.html`：頁面與樣式
- `app.js`：計算、報表解析、管理功能
- `firebase-config.js`：Firebase 連線設定（要自己填）
- `firestore.rules`：Firestore 安全規則（要貼到 Firebase）

## 一、設定 Firebase（約 5 分鐘）
1. 到 Firebase 主控台建立專案（不需要 Google Analytics）。
2. 左側「建立」>「Firestore Database」>「建立資料庫」，選正式版模式，地點選 `asia-east1`（台灣）。
3. 進入 Firestore 的「規則」分頁，把 `firestore.rules` 的內容整份貼上，按「發布」。
4. 專案設定（齒輪）>「您的應用程式」>「</>」網頁，註冊應用程式後，把畫面上的 `firebaseConfig` 內容貼進 `firebase-config.js`，取代裡面的 YOUR_… 文字。

## 二、上架到 GitHub Pages
1. 建立新的 GitHub repository，把本資料夾的檔案上傳到根目錄。
2. Settings > Pages > Source 選 `Deploy from a branch`，Branch 選 `main`、資料夾選 `/ (root)`，儲存。
3. 幾分鐘後會得到網址：`https://<帳號>.github.io/<repo 名稱>/`，把網址給各分院主管即可。

## 三、使用方式
- 管理者：開啟網址 > 右上角「管理」> 輸入密碼 `8888` > 選擇報表檔案（.xls / .xlsx）> 確認「資料截至日期」（預設為檔案日期）> 按「發布給所有人」。
- 同一個視窗可修改各分院的「人次推估係數」與「到店率」，按「儲存參數」後所有人即時套用。
- 一般使用者：選分院、調整指標、查看推算結果，不需要密碼；調整只在自己的瀏覽器，不會改到雲端資料。

## 四、需要定期維護的地方
- **換密碼**：`firestore.rules` 裡有兩處 `8888`，一起改掉後重新發布規則。密碼不在網頁程式碼裡。
- **春節公休日**：`app.js` 最上方的 `CLOSED`，每年更新（目前為 2026/2/16–2/20）。
- **預設係數與到店率**：`app.js` 的 `DEFAULT_PARAMS`，只是雲端還沒有設定時的預設值。

## 五、運作規則
- 日平均預估：排除週日與 `CLOSED` 的公休日，用營業日數計算。
- 平均每月預約數：預約數 ÷ 資料截至日經過的月數（例如 11/21 為 10.7 個月）。
- 到店服務人次 = 到店來客數 ÷ 係數；預約數 = 到店服務人次 ÷ 到店率。

## 六、安全性說明
- 管理密碼由 Firebase 規則在雲端驗證（密碼只存在規則裡，不在前端程式碼），但它是 4 位數密碼，屬於基本防護。
- 資料庫對所有人開放讀取，任何知道網址的人都看得到報表資料。若報表屬於敏感資料，建議之後改用登入機制（Firebase Authentication）。
