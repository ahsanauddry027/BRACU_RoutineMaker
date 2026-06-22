# 📦 Build a shareable Android APK (no Android Studio)

This builds a real `.apk` in the cloud with **GitHub Actions**. You download it,
copy it to your phone, install, and use it. The app UI is bundled inside the APK;
it talks to your hosted backend over the internet.

> Prerequisite: the backend must be deployed first (see [DEPLOY.md](DEPLOY.md)) so
> the app has an API to talk to. You'll need that backend URL below.

---

## Step 1 — Deploy the backend
Follow [DEPLOY.md](DEPLOY.md) to get a live URL like
`https://bracu-routine.onrender.com`. Open `https://<that-url>/api/health` in a
browser — you should see `{"status":"ok",...}`.

## Step 2 — Push this project to GitHub
```bash
git add .
git commit -m "Add Capacitor APK build"
git push
```

## Step 3 — Add the backend URL as a secret
In your GitHub repo: **Settings → Secrets and variables → Actions →
New repository secret**
- **Name:** `VITE_API_URL`
- **Value:** your backend URL (e.g. `https://bracu-routine.onrender.com`) — no trailing slash

This is what the APK will call for data.

## Step 4 — Run the build
- Go to the **Actions** tab → **Build Android APK** → **Run workflow**.
- Wait ~3–5 minutes for it to finish (green check).

## Step 5 — Download & install the APK
1. Open the finished run → **Artifacts** → download **`bracu-routine-apk`**.
2. Unzip it to get `app-debug.apk`.
3. Send the APK to your phone (Google Drive, email, USB, etc.).
4. On the phone, tap the APK → allow **“Install unknown apps”** for that source →
   **Install**.
5. Open **BRACU Routine** from your app drawer. Done — it's a normal app. 🎉

---

### Notes
- It's a **debug-signed APK** — perfect for personal use and sharing with friends.
  (Publishing to the Play Store would need a release/signed build + the $25 account.)
- The app needs internet to reach your backend. If the backend is on Render's free
  tier, the first request after it's been idle takes ~30–50s while it wakes up.
- To update the app later: `git push` → re-run the workflow → install the new APK.
- CORS is already open on the server, so the app is allowed to call your API.
- The native `client/android/` project is generated fresh by CI each run, so it's
  intentionally not committed.
