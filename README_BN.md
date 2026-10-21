# Breaking Bad AI — বাংলা সেটআপ ও Admin Panel

## কী আছে
- মোবাইল-ফ্রেন্ডলি dark green/black AI chat UI
- AI API-এর জন্য server-side backend
- Browser localStorage chat history
- `/admin.html`-এ password-protected admin dashboard
- মোট unique browser ID, মোট AI request, আজকের visitor/request এবং recent request list

## লোকালি চালানো
1. Node.js 18+ ইনস্টল করো।
2. project folder-এ Terminal/Termux খুলে `npm install` চালাও।
3. `.env.example` কপি করে `.env` নাম দাও।
4. `.env`-এ `OPENAI_API_KEY`, `ADMIN_PASSWORD`, এবং `ADMIN_TOKEN_SECRET`-এর আসল মান বসাও।
5. `npm start` চালাও।
6. Chat: `http://localhost:3000`
7. Admin panel: `http://localhost:3000/admin.html`

## ফ্রিতে অনলাইনে প্রকাশ (Render)
1. ZIP extract করো।
2. GitHub-এ `breaking-bad-ai` নামে repository তৈরি করো এবং extracted folder-এর ফাইলগুলো upload করো। `.env` বা API key upload করবে না।
3. Render.com-এ GitHub দিয়ে login করে New → Web Service বেছে repository connect করো।
4. Build Command: `npm install`; Start Command: `npm start`; Free instance থাকলে নির্বাচন করো।
5. Render service-এর Environment Variables-এ `OPENAI_API_KEY`, `OPENAI_MODEL`, `ADMIN_PASSWORD`, `ADMIN_TOKEN_SECRET` যোগ করো।
6. Deploy শেষ হলে Render-এর URL খুলে chat দেখো। Admin: তোমার URL-এর শেষে `/admin.html` যোগ করো।
7. Admin password কাউকে দিও না। API key কখনো frontend বা public repository-তে রাখবে না।

## গুরুত্বপূর্ণ সীমাবদ্ধতা
- Admin panel-এর “users” আসলে unique browser ID, নিশ্চিত বাস্তব/নিবন্ধিত মানুষের সংখ্যা নয়। একজন ব্যক্তি অন্য browser/device ব্যবহার করলে আলাদা হিসেবে গণনা হতে পারে।
- এই starter-এ login/signup dialog এখনো demo; বাস্তব account system-এর জন্য Firebase Authentication বা অন্য auth provider যোগ করতে হবে।
- metrics.json local file-এ লেখা হয়। Render-এর ephemeral filesystem-এ restart/redeploy হলে metrics হারাতে পারে। স্থায়ী analytics-এর জন্য database/persistent storage যোগ করতে হবে।
- API usage/cost limit থাকতে পারে; unlimited service নিশ্চিত নয়।
- AI code generate করতে পারে, কিন্তু এই starter নিজে Android APK compile বা publish করে না।
- Public launch-এর আগে rate limiting, proper auth, database, backups, and abuse protection যোগ করো।
