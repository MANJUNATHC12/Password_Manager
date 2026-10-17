# 🚀 Complete Deployment Guide: Render (Backend) + Vercel (Frontend)

This guide walks you through deploying the **FastAPI Backend + PostgreSQL** to **Render** and the **React + Vite Frontend** to **Vercel**.

---

## 📋 Architecture Overview

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│         Vercel (Frontend)       │           │         Render (Backend)        │
│  React + Vite SPA               │  HTTPS    │  FastAPI Web Service (Docker)   │
│  https://your-app.vercel.app    ├──────────►│  https://your-api.onrender.com  │
└─────────────────────────────────┘           └──────────────┬──────────────────┘
                                                             │ Internal
                                              ┌──────────────▼──────────────────┐
                                              │     Render PostgreSQL DB        │
                                              │     password-manager-db         │
                                              └─────────────────────────────────┘
```

---

## Part 1: Deploy Backend to Render

You can deploy the backend to Render in **one of two ways**:
- **Option A (Fastest - 1-Click Blueprint)**: Render reads `render.yaml` and creates both the database and the backend automatically.
- **Option B (Manual Web Service)**: Manually configure the database and service in the Render dashboard.

---

### Option A: Deploy via Render Blueprint (Recommended)

1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** (top right) ➔ Select **Blueprint**.
3. Connect your GitHub account and select repository:
   `MANJUNATHC12/Password_Manager`
4. Render will detect `render.yaml` and configure:
   - **Database**: `password-manager-db` (PostgreSQL)
   - **Web Service**: `password-manager-api` (Docker container)
5. Click **Apply**.
6. Render will build the Docker container and create the database.
7. Once finished, copy your service's public URL:
   `https://password-manager-api-xxxx.onrender.com`
8. Verify it works by opening in browser:
   `https://password-manager-api-xxxx.onrender.com/api/v1/health`
   You should see: `{"status": "healthy", ...}`

---

### Option B: Deploy Manually on Render Dashboard

If you prefer to configure manually or use an external database (e.g. Supabase / Neon):

#### Step 1: Create PostgreSQL Database
1. Go to [dashboard.render.com](https://dashboard.render.com) ➔ Click **New +** ➔ **PostgreSQL**.
2. **Name**: `password-manager-db`
3. **Database**: `password_manager`
4. **User**: `password_manager`
5. **Plan**: Free
6. Click **Create Database**.
7. Once created, copy the **Internal Database URL** (or External Database URL).

#### Step 2: Create Web Service
1. Click **New +** ➔ **Web Service**.
2. Select your repository `MANJUNATHC12/Password_Manager`.
3. Configure the service:
   - **Name**: `password-manager-api`
   - **Language**: `Docker`
   - **Branch**: `main`
   - **Root Directory**: `backend` *(or leave blank and specify Dockerfile path below)*
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Docker Context**: `./backend`
   - **Instance Type**: Free
4. Add **Environment Variables**:
   | Key | Value | Notes |
   |---|---|---|
   | `DATABASE_URL` | *(paste the database connection string)* | Render Postgres URL |
   | `SECRET_KEY` | *(enter 32+ character random string)* | E.g. openssl rand -hex 32 |
   | `ALGORITHM` | `HS256` | JWT Algorithm |
   | `ENVIRONMENT` | `production` | Production mode |
   | `DEBUG` | `false` | Disable debug logs |
   | `CORS_ORIGINS` | `*` | Or your Vercel URL |
5. Click **Create Web Service**.

---

## Part 2: Deploy Frontend to Vercel

1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New...** ➔ **Project**.
3. Import your GitHub repository:
   `MANJUNATHC12/Password_Manager`
4. In the **Configure Project** screen:
   - **Framework Preset**: `Vite` (auto-detected)
   - **Root Directory**: ⚠️ **Click "Edit" and choose `frontend`** (Crucial step!)
5. Expand **Environment Variables**:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://<your-render-service-name>.onrender.com/api/v1`
     *(Replace with your actual Render backend URL obtained in Part 1)*
6. Click **Deploy**.
7. In ~60 seconds, Vercel will finish building and provide your live URL:
   `https://<your-project>.vercel.app`

---

## Part 3: Connect Frontend and Backend (Final Check)

1. Open your Vercel URL in your browser.
2. Sign in or Register a new account.
3. Test adding an entry to the vault.
4. If requests fail:
   - Go to Render Dashboard ➔ Your Web Service ➔ **Environment**.
   - Ensure `CORS_ORIGINS` allows your Vercel domain, or set it to `*`.
   - Ensure Render has finished waking up (Render's free tier spins down after 15 minutes of inactivity; initial request takes ~30 seconds to wake up).

---

## 🛠️ Handy Commands

### Push Local Code Changes to GitHub
```bash
git add .
git commit -m "Configure deployment for Render and Vercel"
git push origin main
```

### Sync Local Gym / Backup Data to Render (Optional)
If you have local backup data you want to import into Render:
```bash
python sync_to_render.py
```
*(Make sure to update `RENDER_API_URL` in `sync_to_render.py` with your new Render URL!)*
