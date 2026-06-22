# 📲 Deploy & Install on Your Phone (Free)

This hosts the whole app (API + installable PWA) as **one service** on a free
HTTPS URL. Once deployed, you install it on your phone and it works even with
your PC off.

The Express server serves the built React app, so there's a single origin and
one thing to deploy.

---

## Step 1 — MongoDB Atlas (free database)

1. Sign up at <https://www.mongodb.com/atlas> and create a **free M0 cluster**.
2. **Database Access** → add a database user (note the username + password).
3. **Network Access** → Add IP → **Allow access from anywhere** (`0.0.0.0/0`)
   so the host can connect.
4. **Connect → Drivers** → copy the connection string, e.g.:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/routinemaker
   ```
   Replace `<user>`/`<password>` and keep `/routinemaker` as the db name.

## Step 2 — Push the code to GitHub

From the project root:
```bash
git add .
git commit -m "Add PWA + single-origin server for deploy"
git push            # push to a GitHub repo (create one if needed)
```
> `server/.env`, `node_modules`, and `dist/` are git-ignored — that's correct.
> Your Mongo URI goes in the host's env vars (Step 3), never in the repo.

## Step 3 — Render (free web service)

1. Sign up at <https://render.com> and click **New → Web Service**.
2. Connect your GitHub repo.
3. Configure:
   - **Root Directory:** *(leave blank — repo root)*
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. **Environment → Add Environment Variable:**
   - `MONGODB_URI` = your Atlas connection string from Step 1
   - *(PORT is provided by Render automatically — no need to set it.)*
5. **Create Web Service** and wait for the build to finish. You'll get a URL like
   `https://bracu-routine.onrender.com`.

## Step 4 — Install on your phone 🎉

1. Open the Render URL in **Chrome on Android** (or Safari on iPhone).
2. Android: tap **⋮ menu → Install app** (or the in-app **Install** banner).
   iPhone: tap **Share → Add to Home Screen**.
3. The app lands on your home screen with the BRACU icon and opens full-screen.

---

### Notes
- **Free Render sleeps when idle** — the first load after a while takes ~30–50s,
  then it's fast. (Paid tiers stay always-on.)
- It's still a **single shared routine** (no login). If others use your URL they
  see/edit the same schedule. Add user accounts before sharing widely.
- To update the app later: `git push` → Render auto-rebuilds → the installed PWA
  updates itself on next open (auto-update service worker).
- Local development is unchanged: run `server` and `client` separately as before.
