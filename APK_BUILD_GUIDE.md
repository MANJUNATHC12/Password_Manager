# 📱 Build Android APK — Password Manager

## Overview

This guide converts the React frontend into a native Android APK using **Capacitor**.
The APK connects to your hosted backend (Oracle Cloud / any VPS).

---

## Prerequisites

Install these on your Windows PC:

| Tool | Download |
|------|----------|
| Android Studio | https://developer.android.com/studio |
| JDK 17+ | Included with Android Studio |
| Node.js 18+ | https://nodejs.org |

> After installing Android Studio, open it once and let it download the Android SDK.

---

## Step 1 — Install Capacitor in the frontend

```powershell
cd D:\Projects\Password_manager\frontend

npm install @capacitor/core @capacitor/cli @capacitor/android
```

---

## Step 2 — Set your backend server URL

Before building, update the API URL to point to your hosted server.

Edit `frontend/src/services/api.ts`, change:
```ts
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'
```
to your Oracle/VPS server IP:
```ts
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://YOUR_SERVER_IP:8000/api/v1'
```

Or create a `.env.production` file in `frontend/`:
```env
VITE_API_URL=http://YOUR_SERVER_IP:8000/api/v1
```

---

## Step 3 — Build the React app

```powershell
cd D:\Projects\Password_manager\frontend
npm run build
```

This creates the `dist/` folder.

---

## Step 4 — Initialize Capacitor

```powershell
npx cap init "Password Manager" "com.yourname.passwordmanager" --web-dir dist
```

---

## Step 5 — Add Android platform

```powershell
npx cap add android
```

---

## Step 6 — Sync web code to Android

```powershell
npx cap sync android
```

---

## Step 7 — Open in Android Studio and build APK

```powershell
npx cap open android
```

Android Studio will open. Then:
1. Wait for Gradle sync to finish (may take 5–10 minutes first time)
2. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. APK will be saved at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

## Step 8 — Install APK on Android

**Method A — USB:**
1. Connect phone via USB
2. Enable **USB Debugging** on phone (Settings → Developer Options)
3. In Android Studio: **Run → Run 'app'** → select your phone

**Method B — File transfer:**
1. Copy `app-debug.apk` to your phone
2. Open it on the phone
3. Allow "Install from unknown sources" if prompted

---

## After Every Code Change

```powershell
npm run build          # rebuild React app
npx cap sync android   # sync to Android project
# Then rebuild APK in Android Studio
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| API not working in APK | Make sure backend URL is set correctly in `.env.production` |
| CORS error | Add your server IP to allowed origins in `docker-compose.yml` |
| HTTP not allowed | Add `android:usesCleartextTraffic="true"` in `AndroidManifest.xml` (for HTTP, not HTTPS) |
| App crashes on open | Check Logcat in Android Studio for error details |

---

## Security: Use HTTPS (Recommended)

For a password manager, use HTTPS instead of HTTP:
1. Get a free domain from https://duckdns.org
2. Point it to your server IP
3. Install SSL: `certbot --nginx -d yourdomain.duckdns.org`
4. Update `VITE_API_URL=https://yourdomain.duckdns.org/api/v1`
