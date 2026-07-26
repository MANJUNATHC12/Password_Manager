# 🆓 Free Backend Hosting Options — Password Manager

**Stack:** FastAPI (Python) + PostgreSQL + Docker
**Last Updated:** 2026-07-26

---

## Quick Comparison Table

| Platform | Always Free | RAM | Storage | PostgreSQL | Docker | Sleep? | Best For |
|----------|-------------|-----|---------|------------|--------|--------|----------|
| **Oracle Cloud** | ✅ Yes | 24 GB | 200 GB | ✅ | ✅ | ❌ Never | Best overall |
| **Railway** | ⚠️ $5 credit/mo | 512 MB | 1 GB | ✅ | ✅ | ❌ Never | Easiest setup |
| **Render** | ✅ Yes | 512 MB | — | ✅ 1GB | ❌ | ✅ After 15 min | Simple apps |
| **Fly.io** | ✅ Yes | 256 MB | 3 GB | ✅ | ✅ | ❌ Never | Good free tier |
| **Koyeb** | ✅ Yes | 512 MB | — | ❌ | ✅ | ❌ Never | Easy Docker |
| **Supabase** | ✅ Yes | — | 500 MB DB | ✅ | ❌ | ❌ Never | DB only |
| **Aiven** | ✅ Trial | — | — | ✅ | ❌ | — | DB only |

---

## Detailed Review of Each

---

### 🥇 1. Oracle Cloud Always Free

**Website:** https://cloud.oracle.com
**Cost:** ₹0 forever (after free verification)

#### What you get FREE forever:
- 2 AMD micro VMs **OR** 4 ARM Ampere cores + 24 GB RAM
- 200 GB block storage
- 10 TB outbound data/month
- Load balancer
- Object storage 20 GB

#### Why it's the best:
- ✅ **Real VM** — full Linux server, full control
- ✅ **Docker supported** — run your entire `docker-compose.yml`
- ✅ **Never sleeps** — always running 24/7
- ✅ **Huge resources** — 24 GB RAM is overkill for this app
- ✅ **PostgreSQL included** — just run it in Docker as you do now
- ✅ No surprise charges (credit card needed for signup only)

#### Setup time: ~30–45 minutes
#### Difficulty: ⭐⭐⭐ Medium (requires SSH knowledge)

---

### 🥈 2. Railway

**Website:** https://railway.app
**Cost:** Free $5 credit/month (enough for ~500 hours)

#### What you get FREE:
- $5/month free credit (auto-renewed)
- Supports Docker & docker-compose
- Built-in PostgreSQL plugin
- Automatic deploys from GitHub

#### Why it's great:
- ✅ **Easiest setup** — connect GitHub → auto-deploy
- ✅ **Docker compose support** — deploy as-is
- ✅ **PostgreSQL plugin** — one click database
- ⚠️ $5 credit may not cover a full month at 24/7 (depends on usage)
- ⚠️ App may pause if credits run out

#### Setup time: ~15 minutes
#### Difficulty: ⭐ Easy

---

### 🥉 3. Render

**Website:** https://render.com
**Cost:** Free tier available

#### What you get FREE:
- 1 free web service (512 MB RAM)
- 1 free PostgreSQL database (1 GB, expires after 90 days on free tier)
- Auto-deploy from GitHub

#### Limitations:
- ⚠️ **Sleeps after 15 min** of inactivity — first load takes ~30 seconds to wake up
- ⚠️ Free PostgreSQL expires after 90 days (then need to recreate)
- ❌ Docker compose not fully supported (deploy services individually)

#### Setup time: ~20 minutes
#### Difficulty: ⭐⭐ Easy-Medium

---

### 4. Fly.io

**Website:** https://fly.io
**Cost:** Free allowance (no credit card needed to start)

#### What you get FREE:
- 3 shared VMs (256 MB RAM each)
- 3 GB persistent storage
- PostgreSQL via Fly Postgres (free small instance)
- Global edge deployment

#### Why it's good:
- ✅ Supports Docker
- ✅ Never sleeps
- ✅ PostgreSQL included
- ⚠️ Requires `flyctl` CLI — slightly complex
- ⚠️ 256 MB RAM is low for FastAPI + PostgreSQL together

#### Setup time: ~30 minutes
#### Difficulty: ⭐⭐⭐ Medium

---

### 5. Koyeb

**Website:** https://koyeb.com
**Cost:** Free "Eco" plan

#### What you get FREE:
- 1 service, 512 MB RAM, 0.1 CPU
- Deploy from Docker image or GitHub
- Global CDN

#### Limitation:
- ❌ No free PostgreSQL — need to use Supabase or Aiven for the DB separately
- ✅ Never sleeps

#### Setup time: ~20 minutes
#### Difficulty: ⭐⭐ Easy-Medium

---

### 6. Supabase (Database Only)

**Website:** https://supabase.com
**Cost:** Free tier

#### What you get FREE:
- PostgreSQL database (500 MB)
- REST API auto-generated
- 50,000 monthly active users

#### Use case:
- Use this **only for PostgreSQL** while hosting FastAPI on Koyeb or Fly.io
- ⚠️ Pauses after 1 week of inactivity on free tier

---

## 🏆 My Recommendation for Your App

### Best Free Setup (Zero Cost):

```
FastAPI Backend  →  Oracle Cloud Always Free VM
PostgreSQL DB    →  Same Oracle VM (Docker)
React Frontend   →  Same Oracle VM (Docker/Nginx)
```
**Total cost: ₹0/month**

### Easiest Free Setup:

```
FastAPI Backend  →  Railway (from GitHub)
PostgreSQL DB    →  Railway PostgreSQL plugin
React Frontend   →  Railway (same project)
```
**Total cost: ~₹0/month (within $5 credit)**

### Split Setup (if Oracle is too complex):

```
FastAPI Backend  →  Fly.io
PostgreSQL DB    →  Supabase (free 500 MB)
React Frontend   →  Vercel (free, perfect for React)
```
**Total cost: ₹0/month**

---

## 🚀 Quickest Path — Railway (Easiest)

### Step 1: Push your project to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/password-manager.git
git push -u origin main
```

### Step 2: Deploy on Railway
1. Go to https://railway.app → Sign up with GitHub
2. Click **New Project → Deploy from GitHub**
3. Select your repository
4. Railway auto-detects `docker-compose.yml`
5. Add a **PostgreSQL plugin**
6. Set environment variables (DATABASE_URL, SECRET_KEY, etc.)
7. Click **Deploy** → get your public URL in ~3 minutes

### Step 3: Update APK with Railway URL
```env
VITE_API_URL=https://your-app.railway.app/api/v1
```

---

## ⚠️ Important Security Note

Since this is a **password manager**, always use:
- ✅ **HTTPS** (Railway/Render/Fly.io give this automatically)
- ✅ Strong `SECRET_KEY` in environment variables
- ✅ Never commit `.env` files to GitHub

---

*Guide created: 2026-07-26*
