# ☁️ Oracle Cloud Always Free — Complete Setup Guide
# Password Manager Deployment

**Date:** 2026-07-26
**Stack:** FastAPI + PostgreSQL + React (Docker)

---

## 📋 Overview — What We'll Do

```
Step 1: Create Oracle Cloud account (10 min)
Step 2: Create Ubuntu VM (10 min)
Step 3: Open firewall ports (5 min)
Step 4: SSH into the VM (2 min)
Step 5: Install Docker (5 min)
Step 6: Copy project to server (5 min)
Step 7: Configure & run the app (5 min)
Step 8: Access from browser/Android (1 min)

Total: ~40 minutes
```

---

## STEP 1 — Create Oracle Cloud Account

1. Go to: **https://cloud.oracle.com**
2. Click **"Start for free"**
3. Fill in:
   - Country: **India**
   - Email, Name, Password
4. Verify your email
5. Add credit/debit card (for identity only — **will NOT be charged**)
6. Choose **Home Region: India (Hyderabad)** or **India (Mumbai)**
   > ⚠️ You CANNOT change your home region later. Choose India for lowest latency.
7. Complete signup

---

## STEP 2 — Create a Free VM Instance

1. In Oracle Cloud dashboard, click **"Create a VM instance"**
2. Configure:

   **Name:** `password-manager-server`

   **Image:** Click "Edit" → Choose **Ubuntu 22.04** (Canonical)

   **Shape:** Click "Edit" →
   - Select **"Ampere"** tab
   - Choose **`VM.Standard.A1.Flex`**
   - Set **OCPUs: 2**, **Memory: 12 GB**
   *(This is within the Always Free limit of 4 OCPUs / 24 GB total)*

   **SSH Keys:**
   - Click **"Generate a key pair for me"**
   - Download both `private key` and `public key`
   - **Save the private key file safely** — you need it to connect

3. Click **"Create"**
4. Wait 2–3 minutes for the instance to start (State: **Running**)
5. Note your **Public IP Address** (e.g. `152.67.xx.xx`)

---

## STEP 3 — Open Firewall Ports on Oracle

Oracle has TWO firewalls — you must open BOTH:

### A. Oracle Security List (cloud firewall)

1. In your VM page → Click **"Subnet"** link → **"Default Security List"**
2. Click **"Add Ingress Rules"**
3. Add these rules one by one:

   | Source CIDR | Protocol | Port | Purpose |
   |-------------|----------|------|---------|
   | 0.0.0.0/0 | TCP | 22 | SSH (already exists) |
   | 0.0.0.0/0 | TCP | 80 | HTTP |
   | 0.0.0.0/0 | TCP | 443 | HTTPS |
   | 0.0.0.0/0 | TCP | 3000 | Frontend |
   | 0.0.0.0/0 | TCP | 8000 | Backend API |

4. Click **"Add Ingress Rules"**

### B. Ubuntu Firewall (inside the VM)

Run these after SSH-ing in (Step 4):
```bash
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 8000 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

---

## STEP 4 — Connect to VM via SSH

### On Windows — use PowerShell or Windows Terminal:

```powershell
# Replace with your actual private key path and server IP
ssh -i "C:\Users\Manju\Downloads\ssh-key-private.key" ubuntu@152.67.xx.xx
```

If you get a permissions error on the key:
```powershell
# Fix key permissions (run in PowerShell)
icacls "C:\Users\Manju\Downloads\ssh-key-private.key" /inheritance:r /grant:r "%username%:R"
```

> You should see: `ubuntu@password-manager-server:~$`

---

## STEP 5 — Install Docker on the VM

Copy and paste this entire block into your SSH terminal:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Install netfilter-persistent (to save firewall rules)
sudo apt install iptables-persistent netfilter-persistent -y

# Open ports in Ubuntu firewall
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 8000 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo netfilter-persistent save

# Apply docker group without re-login
newgrp docker

# Verify Docker works
docker --version
docker compose version
```

Expected output:
```
Docker version 27.x.x
Docker Compose version v2.x.x
```

---

## STEP 6 — Copy Your Project to the Server

### Option A: Using Git (Recommended)

First, push your project to GitHub from your PC:
```powershell
# On your Windows PC
cd D:\Projects\Password_manager
git init
git add .
git commit -m "Initial deployment"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/password-manager.git
git push -u origin main
```

Then on the Oracle VM:
```bash
git clone https://github.com/YOURUSERNAME/password-manager.git
cd password-manager
```

### Option B: Using SCP (Direct file copy, no GitHub needed)

Run this on your **Windows PC** (in a new PowerShell — not the SSH one):
```powershell
# Copy entire project to the server
scp -i "C:\Users\Manju\Downloads\ssh-key-private.key" -r "D:\Projects\Password_manager" ubuntu@152.67.xx.xx:~/password-manager
```

---

## STEP 7 — Configure Environment & Run

On the Oracle VM:

```bash
cd ~/password-manager

# Create production environment file
cat > .env << 'EOF'
# Database
POSTGRES_USER=password_manager
POSTGRES_PASSWORD=CHANGE_THIS_TO_A_STRONG_PASSWORD_123!
POSTGRES_DB=password_manager

# Backend security — CHANGE THIS! Generate with: openssl rand -hex 32
SECRET_KEY=CHANGE_THIS_TO_A_RANDOM_64_CHARACTER_STRING_abc123xyz

# URLs — replace with your actual Oracle VM public IP
FRONTEND_URL=http://152.67.xx.xx:3000
VITE_API_URL=http://152.67.xx.xx:8000/api/v1

# Environment
ENVIRONMENT=production
EOF

echo "✅ .env file created"
```

> ⚠️ **Replace `152.67.xx.xx` with your actual Oracle VM Public IP**
> ⚠️ **Change the passwords and SECRET_KEY** — use something strong and unique

Generate a strong SECRET_KEY:
```bash
openssl rand -hex 32
# Copy the output and paste it as your SECRET_KEY in .env
```

Now build and run:
```bash
# Build and start all containers
docker compose up --build -d

# Check all containers are running
docker compose ps
```

Expected output:
```
NAME                      STATUS
password-manager-db       running (healthy)
password-manager-api      running
password-manager-web      running
```

Check logs if something is wrong:
```bash
docker compose logs -f
```

---

## STEP 8 — Access Your App

Open in your browser or Android phone:
```
http://152.67.xx.xx:3000
```
*(Replace with your actual Oracle VM IP)*

- **Frontend (App):** `http://YOUR_IP:3000`
- **Backend API:** `http://YOUR_IP:8000`
- **API Docs:** `http://YOUR_IP:8000/docs`

---

## STEP 9 — Keep App Running Forever (Auto-restart on reboot)

```bash
# Enable Docker to start on boot
sudo systemctl enable docker

# Your containers already have "restart: unless-stopped" in docker-compose.yml
# So they restart automatically after server reboot ✅

# Verify restart policy
docker compose ps
```

---

## STEP 10 — Update APK to Use Oracle Server URL

On your **Windows PC**, update the frontend API URL:

Create/edit `D:\Projects\Password_manager\frontend\.env.production`:
```env
VITE_API_URL=http://152.67.xx.xx:8000/api/v1
```

Then rebuild and push to server:
```powershell
cd D:\Projects\Password_manager\frontend
npm run build
# Copy dist/ folder to server or push via Git
```

---

## 🔒 BONUS: Add HTTPS + Free Domain (Optional but Recommended)

For a password manager, HTTPS is strongly recommended.

### Get a free domain from DuckDNS:
1. Go to **https://duckdns.org** → Sign in with Google
2. Create a subdomain: e.g. `manju-vault.duckdns.org`
3. Enter your Oracle VM's public IP → click **"Update IP"**

### Install Nginx + SSL on the Oracle VM:
```bash
# Install Nginx
sudo apt install nginx -y

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Create Nginx config
sudo tee /etc/nginx/sites-available/password-manager << 'EOF'
server {
    listen 80;
    server_name manju-vault.duckdns.org;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/password-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get FREE SSL certificate
sudo certbot --nginx -d manju-vault.duckdns.org

# Auto-renew SSL
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

After this, access your app at:
```
https://manju-vault.duckdns.org
```

Update your `.env` and APK:
```env
VITE_API_URL=https://manju-vault.duckdns.org/api/v1
```

---

## 🛠️ Useful Commands on the Server

```bash
# View running containers
docker compose ps

# View live logs
docker compose logs -f

# Restart all services
docker compose restart

# Stop all services
docker compose down

# Start all services
docker compose up -d

# Update after code change
git pull
docker compose up --build -d

# Check disk space
df -h

# Check memory usage
free -h
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't SSH | Check key permissions, check security list has port 22 open |
| Can't access port 3000 | Run `sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT` |
| Container not starting | Run `docker compose logs backend` to see errors |
| Database error | Run `docker compose restart postgres` |
| App not loading | Check `docker compose ps` — all should show "running" |
| CORS error in browser | Make sure `FRONTEND_URL` in `.env` matches your access URL |

---

*Guide created: 2026-07-26 | For: Password Manager Project*
