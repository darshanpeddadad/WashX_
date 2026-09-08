# WashX Backend — Railway Deployment

## Quick Deploy Steps

### 1. Create Railway account
Go to https://railway.app and sign up with GitHub.

### 2. Create a new project
- Click **New Project** → **Deploy from GitHub repo**
- Connect your GitHub and select the `washx-backend` repo
- (Or use a monorepo: set Root Directory to `washx-backend`)

### 3. Add PostgreSQL
- In Railway dashboard → **New** → **Database** → **Add PostgreSQL**
- Railway auto-sets `DATABASE_URL` as an environment variable

### 4. Set Environment Variables in Railway
Go to your service → **Variables** tab, add:

```
DATABASE_URL          = (auto-set by Railway PostgreSQL)
JWT_SECRET            = your_very_long_random_secret_string_here
ADMIN_KEY             = washx_admin_secure_key_2024
PORT                  = 3000
NODE_ENV              = production

RAZORPAY_KEY_ID       = rzp_live_YOUR_KEY_ID
RAZORPAY_KEY_SECRET   = YOUR_LIVE_SECRET

TWILIO_ACCOUNT_SID    = ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN     = your_auth_token
TWILIO_PHONE_NUMBER   = +1234567890

EMAIL_USER            = washx.noreply@gmail.com
EMAIL_PASS            = your_gmail_app_password

FRONTEND_URL          = https://your-washx-app.vercel.app
```

### 5. Run database migrations
In Railway terminal or via Railway CLI:
```bash
npx prisma migrate deploy
# or for first time:
npx prisma db push
```

### 6. Start command
Railway auto-detects `npm start` from package.json (`node server.js`).

---

## Local Development with Railway DB

You can use Railway's PostgreSQL URL locally too:
1. Copy the DATABASE_URL from Railway
2. Paste into your local `washx-backend/.env`
3. Run `npm run db:push` to sync schema
