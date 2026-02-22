# Deployment Guide — Sarang K Portfolio

## Architecture
- **Frontend**: Static files (`index.html`, `style.css`, `script.js`) → Vercel
- **Backend**: Node.js/Express SMS API → Railway

---

## 1. Backend Setup (Railway)

### Prerequisites
- [Railway account](https://railway.app) (free tier available)
- [Twilio account](https://www.twilio.com) for SMS

### Steps
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repository, set root directory to `/backend`
3. Add these **Environment Variables** in Railway dashboard:

| Variable | Value |
|---|---|
| `TWILIO_ACCOUNT_SID` | From [twilio.com/console](https://twilio.com/console) |
| `TWILIO_AUTH_TOKEN` | From [twilio.com/console](https://twilio.com/console) |
| `TWILIO_PHONE` | Your Twilio phone number (e.g. `+12025551234`) |
| `MY_PHONE` | Your personal number to receive SMS (e.g. `+919xxxxxxxxx`) |

4. Railway auto-deploys. Copy the generated URL (e.g. `https://portfolio-backend-production-xxxx.up.railway.app`)

---

## 2. Frontend Setup (Vercel)

### Steps
1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select your repository, leave root directory as `/` (default)
3. Add this **Environment Variable** (optional — only if you want to override backend URL):

| Variable | Value |
|---|---|
| `BACKEND_URL` | Your Railway backend URL |

4. Deploy. Vercel gives you a URL like `https://sarang-portfolio.vercel.app`

> **Note**: The frontend's `script.js` already points to Railway. If your Railway URL differs, update the `BACKEND` constant in `script.js` → `initContactForm()`.

---

## 3. Local Development

```bash
# Backend
cd backend
cp .env.example .env
# Fill in your Twilio credentials in .env
npm install
npm start

# Frontend — just open index.html in browser
# Or use Live Server in VS Code
```

---

## 4. Twilio Free Trial Notes
- You need to verify the destination phone number on Twilio free trial
- Upgrade to a paid plan to SMS any number
- Get a Twilio phone number from the console (starts with a US number)
