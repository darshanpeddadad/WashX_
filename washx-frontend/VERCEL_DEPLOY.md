# WashX Frontend — Vercel Deployment

## Quick Deploy

### 1. Push to GitHub
```bash
cd washx-frontend
git init
git add .
git commit -m "Initial WashX customer panel"
git remote add origin https://github.com/yourusername/washx-frontend.git
git push -u origin main
```

### 2. Import to Vercel
1. Go to https://vercel.com → **New Project**
2. Import your GitHub repo `washx-frontend`
3. Framework: **Next.js** (auto-detected)

### 3. Set Environment Variables in Vercel
Go to Project Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL           = https://your-app.railway.app/api
NEXT_PUBLIC_RAZORPAY_KEY_ID   = rzp_live_YOUR_KEY_ID
NEXT_PUBLIC_SOCKET_URL        = https://your-app.railway.app
```

### 4. Deploy
Vercel auto-deploys on every push to `main`.

---

## Vercel CLI (alternative)
```bash
npm i -g vercel
vercel login
vercel --prod
```
