# WashX 🧺✨
### Next-Generation On-Demand Laundry, Dry-Cleaning & Garment Care Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5.2-green?logo=node.js)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-indigo?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql)](https://www.postgresql.org/)
[![Socket.io](https://img.shields.io/badge/RealTime-Socket.io_4.8-orange?logo=socket.io)](https://socket.io/)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay-blue?logo=razorpay)](https://razorpay.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

---

## 📖 Table of Contents
1. [Overview & Vision](#-overview--vision)
2. [Key Capabilities & Ecosystem](#-key-capabilities--ecosystem)
   - [Customer Experience](#1-customer-experience)
   - [Delivery & Pickup Agent Operations](#2-delivery--pickup-agent-operations)
   - [Admin Command Center & Kanban](#3-admin-command-center--kanban)
3. [Architecture & Workflow](#-architecture--workflow)
   - [System Architecture](#system-architecture)
   - [Order Lifecycle State Machine](#order-lifecycle-state-machine)
4. [Pricing Engine & Catalog](#-pricing-engine--catalog)
5. [Subscription Plans & Fair Usage Policy (FUP)](#-subscription-plans--fair-usage-policy-fup)
6. [Tech Stack](#-tech-stack)
7. [Directory Structure](#-directory-structure)
8. [Database Schema (Prisma Models)](#-database-schema-prisma-models)
9. [API Reference](#-api-reference)
10. [Environment Variables](#-environment-variables)
11. [Local Development Setup](#-local-development-setup)
12. [Deployment Guide](#-deployment-guide)

---

## 🌟 Overview & Vision

**WashX** is an enterprise-grade, full-stack, on-demand laundry and garment care ecosystem. Designed with modern web standards and high-fidelity aesthetics, WashX bridges customers, logistics field agents, and warehouse operators into a unified real-time workflow.

From single-item bookings to recurring multi-month subscriptions, WashX manages the entire garment care lifecycle: doorstep pickup scheduling, fabric-specific itemization, steam ironing, specialized dry-cleaning, automated status dispatching via WebSockets, OTP-based doorstep handovers, and secure Razorpay payment processing.

---

## 🚀 Key Capabilities & Ecosystem

### 1. Customer Experience
* **Artisan Specimen Registry & Live Estimator**: Interactive garment and fabric selector (Men's wear, Sarees, Household bedding, Winterwear, etc.) with dynamic cost calculation.
* **Flexible Care Tiers**: Instant selection between *Wash Only*, *Wash + Steam Iron* (1.5x), and *Specialized Dry Cleaning* (fixed market rate).
* **Express Pass Turnaround**: Standard 3-day turnaround or 24-hour Express processing.
* **Granular Delivery Preferences**: Selection between *Direct Handover to Person* (secured with delivery OTP) or *Contactless Security Gate Drop-off*.
* **Live WebSocket Tracker**: Real-time interactive timeline displaying current order progression with live status updates (`PICKED_UP`, `IN_WASHING`, `WASHING_DONE`, `OUT_FOR_DELIVERY`, etc.).
* **FCM Web Push Notifications**: Automated notifications for status transitions sent directly to the customer's browser via Firebase Cloud Messaging.
* **Coupons & Referral Engine**: Apply percentage or flat promo codes; share personal referral links with automated wallet credits.
* **Order Inspection & Reviews**: View post-pickup inspection notes made by the warehouse and leave 5-star ratings and reviews once delivered.

### 2. Delivery & Pickup Agent Operations
* **Dedicated Agent Portal**: Tailored mobile-responsive interface for logistics partners (`/agent/dashboard`).
* **Role-Based Dispatch**: Configurable roles (`PICKUP`, `DELIVERY`, or `BOTH`).
* **Active Order Claiming**: Live discovery of unassigned orders in the agent's assigned operational city.
* **Daily Quota Management**: Prevents operational bottlenecks by enforcing daily claim limits.
* **Doorstep Verification**: Delivery completion requires validation of the customer's secure 4-digit Delivery OTP.

### 3. Admin Command Center & Kanban
* **Live Drag-and-Drop Kanban Board**: Visual order management across all 10 order states with real-time status transitions.
* **Agent Fleet Roster**: Monitor agent activity, city assignments, operational statuses, and order load.
* **Promo Code Studio**: Create, edit, and deactivate promotional discount codes with expiration dates and minimum order thresholds.
* **Business Analytics & Metrics**: Real-time metrics on total revenue, order volume, active subscriptions, and fulfillment turnaround times.
* **Role-Based Access Control (RBAC)**: Secure separation between `SUPER` administrators and `VIEWER` support staff.

---

## 🏗 Architecture & Workflow

### System Architecture

```mermaid
graph TD
    subgraph Frontend ["Frontend (Next.js 16 + React 19)"]
        UI_Customer["Customer Portal (/book, /dashboard, /orders)"]
        UI_Agent["Agent Portal (/agent/dashboard)"]
        UI_Admin["Admin Command Center (/admin/kanban)"]
        SW["Firebase Service Worker (Push Notifications)"]
    end

    subgraph Backend ["Backend API (Express 5 + Socket.io)"]
        Server["Express REST API & WebSocket Server"]
        AuthM["JWT & Blacklist Middleware"]
        RateL["Rate Limiter & Helmet Security"]
        PricingE["Dynamic Pricing & FUP Engine"]
        CronS["Cron Services (Slot resets, FUP checks)"]
        NotifS["FCM Notification Dispatcher"]
    end

    subgraph Data ["Data & External Services"]
        PG[("PostgreSQL Database (Prisma ORM)")]
        RP["Razorpay Gateway (Orders & Webhooks)"]
        FCM["Firebase Cloud Messaging"]
    end

    UI_Customer -->|HTTPS / REST| Server
    UI_Agent -->|HTTPS / REST| Server
    UI_Admin -->|HTTPS / REST| Server
    UI_Customer <-->|WebSocket Events| Server
    UI_Agent <-->|WebSocket Events| Server
    UI_Admin <-->|WebSocket Events| Server

    Server --> AuthM
    Server --> RateL
    Server --> PricingE
    Server --> CronS
    Server --> NotifS
    Server -->|Queries & Transactions| PG
    Server -->|Create Order & Verify Signature| RP
    RP -->|HMAC Webhooks| Server
    NotifS -->|Send Web Push| FCM
    FCM --> SW
```

### Order Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING: User Books Order
    PENDING --> PICKUP_SCHEDULED: Pickup Slot Confirmed
    PICKUP_SCHEDULED --> PICKED_UP: Agent Collects & Inspects Garments
    PICKUP_SCHEDULED --> PICKUP_MISSED: Customer Unavailable
    PICKUP_MISSED --> PICKUP_SCHEDULED: Rescheduled
    PICKED_UP --> IN_WASHING: Arrived at Processing Facility
    IN_WASHING --> WASHING_DONE: Washed, Pressed & Packaged
    WASHING_DONE --> DELIVERY_SCHEDULED: Delivery Slot Selected
    DELIVERY_SCHEDULED --> OUT_FOR_DELIVERY: Agent Dispatched with Package
    OUT_FOR_DELIVERY --> DELIVERED: OTP Verified at Doorstep
    PENDING --> CANCELLED: Cancelled by User/Admin
    PICKUP_SCHEDULED --> CANCELLED: Cancelled
    DELIVERED --> [*]
    CANCELLED --> [*]
```

---

## 💰 Pricing Engine & Catalog

WashX uses a transparent base price + multiplier pricing calculation with minimum cart checks:

| Category | Icon | Base Price (Wash) | Wash + Steam Iron (1.5x) | Dry Clean (Fixed) |
| :--- | :---: | :---: | :---: | :---: |
| **Men's Wear** | 👔 | ₹25 | ₹37.50 | ₹80 |
| **Women's Saree** | 🥻 | ₹60 | ₹90.00 | ₹150 |
| **Women's Other** | 👗 | ₹25 | ₹37.50 | ₹80 |
| **Kids & Infants** | 🧒 | ₹18 | ₹27.00 | ₹60 |
| **Household & Bedding** | 🛏️ | ₹40 | ₹60.00 | ₹100 |
| **Winter & Woolen** | 🧥 | ₹60 | ₹90.00 | ₹120 |
| **Shoes & Bags** | 👟 | ₹60 | ₹90.00 | ₹100 |

* **Express Pass**: Optional +₹99 flat surcharge for 24-hour expedited turnaround.
* **Minimum Order**: ₹99 minimum garment total before delivery fee calculation.
* **Delivery Fee**: Free delivery on orders exceeding threshold; dynamic convenience fee on small orders.

---

## 📦 Subscription Plans & Fair Usage Policy (FUP)

WashX features recurring subscription models with built-in Fair Usage Policies to protect facility capacity:

| Plan | Billing Cycle | Pickups Limit | Garment Quota | Benefit |
| :--- | :--- | :--- | :--- | :--- |
| **Weekly Lite** | 7 Days | 2 Pickups | Up to 20 garments | Flexible short-term care |
| **Monthly Club** | 30 Days | 8 Pickups | Up to 80 garments | Best value for working professionals |
| **Yearly Prime** | 365 Days | 96 Pickups | Up to 1,000 garments | Dedicated valet & zero delivery fees |

The system automatically verifies subscription active status and decrements FUP quotas upon each booked order.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 16.3.3 (App Router)
- **UI & Components**: React 19.2.8, Tailwind CSS v4, Lucide Icons, Framer Motion
- **State & Real-Time**: React Context API (`AuthContext`, `ThemeContext`, `AdminContext`, `AgentContext`), Socket.io Client
- **Forms & Feedback**: React Hook Form, React Hot Toast
- **Notifications**: Firebase Cloud Messaging (Web Push) with custom Service Worker

### Backend
- **Runtime & Framework**: Node.js, Express 5.2.1
- **Database & ORM**: PostgreSQL, Prisma Client 5.22
- **Real-Time Communication**: Socket.io 4.8
- **Payment Gateway**: Razorpay Node SDK (with HMAC-SHA256 webhook signatures)
- **Security & Utilities**: JWT, BcryptJS, Helmet, Express Rate Limit, Joi validation
- **Scheduling**: Node-cron for daily quota resets and subscription expiry tasks

---

## 📂 Directory Structure

```text
WashX/
├── .gitignore                      # Root Git ignore (protects .env, node_modules, .pgdata)
├── README.md                       # Master project documentation
│
├── washx-backend/                  # Express REST & WebSocket API
│   ├── .env.example                # Backend environment template
│   ├── .gitignore                  # Backend-specific ignore
│   ├── Procfile                    # Railway / Heroku deployment spec
│   ├── RAILWAY_DEPLOY.md           # Railway deployment instructions
│   ├── server.js                   # Application entrypoint & HTTP/Socket server
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma           # Complete PostgreSQL Prisma schema
│   ├── lib/
│   │   ├── prisma.js               # Prisma client singleton
│   │   ├── response.js             # Standardized API response formatters
│   │   └── constants.js            # Business constants & error codes
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification & token blacklist checker
│   │   ├── auditLogger.js          # HTTP request audit logging
│   │   ├── errorHandler.js         # Centralized error handler
│   │   ├── rateLimiter.js          # API route rate limiters
│   │   ├── validate.js             # Joi input validation middleware
│   │   └── envValidator.js         # Startup environment check
│   ├── routes/
│   │   ├── admin.js                # Admin order, fleet, and coupon management
│   │   ├── adminAuth.js            # Admin authentication & RBAC
│   │   ├── agent.js                # Pickup/Delivery agent portal endpoints
│   │   ├── auth.js                 # Customer registration, login, profile, password
│   │   ├── catalog.js              # Garment catalog & price lookup
│   │   ├── cities.js               # Serviceable cities directory
│   │   ├── coupons.js              # Promo code validation & application
│   │   ├── orders.js               # Order placement, status tracking, OTP
│   │   ├── payments.js             # Razorpay order generation & signature verify
│   │   ├── referrals.js            # Referral codes & wallet earnings
│   │   ├── slots.js                # Dynamic pickup & delivery slot generator
│   │   ├── subscriptions.js        # Subscription purchasing & FUP status
│   │   └── webhooks.js             # Razorpay webhook listener
│   ├── scripts/
│   │   ├── create-admin.js         # CLI tool to initialize Super Admin account
│   │   └── ensure-db.js            # Local database initialization utility
│   └── services/
│       ├── cronService.js          # Scheduled cleanup & daily quota resets
│       ├── fupService.js           # Fair Usage Policy enforcement logic
│       ├── notificationService.js  # Push notification & FCM dispatcher
│       ├── orderService.js         # Business logic for order lifecycles
│       ├── pricingService.js       # Dynamic price computation engine
│       └── slotService.js          # Capacity-based slot booking engine
│
└── washx-frontend/                 # Next.js 16 App Router Client
    ├── .env.example                # Frontend environment template
    ├── .gitignore                  # Frontend-specific ignore
    ├── package.json
    ├── next.config.ts
    ├── VERCEL_DEPLOY.md            # Vercel deployment walkthrough
    ├── public/
    │   ├── firebase-messaging-sw.js# Web Push background service worker
    │   └── manifest.json           # PWA web app manifest
    └── src/
        ├── app/
        │   ├── page.tsx            # High-conversion luxury landing page
        │   ├── layout.tsx          # Root layout with providers & theme
        │   ├── globals.css         # Modern typography & Tailwind CSS setup
        │   ├── book/page.tsx       # Multi-step booking wizard
        │   ├── dashboard/page.tsx  # Customer dashboard & order history
        │   ├── login/page.tsx      # Customer authentication
        │   ├── register/page.tsx   # Customer sign up with referral code
        │   ├── profile/page.tsx    # Customer profile & addresses
        │   ├── subscription/       # Subscription plans & active usage
        │   ├── orders/[id]/        # Live order tracker & timeline
        │   ├── orders/[id]/clothes # Garment itemization & inspection viewer
        │   ├── orders/[id]/delivery# Delivery slot picker & OTP confirmation
        │   ├── agent/login         # Agent portal login
        │   ├── agent/dashboard     # Agent active orders, claims, OTP submit
        │   ├── admin/login         # Admin login
        │   ├── admin/dashboard     # High-level metrics & activity
        │   ├── admin/kanban        # Real-time drag-and-drop order pipeline
        │   ├── admin/orders        # Full table list of all customer orders
        │   ├── admin/agents        # Fleet management & active dispatchers
        │   ├── admin/coupons       # Coupon studio & discount management
        │   └── admin/analytics     # Business analytics & charts
        ├── components/
        │   ├── AdminShell.tsx      # Admin navigation & header shell
        │   ├── ThemeToggle.tsx     # Dark / Light mode toggle
        │   ├── RazorpayCheckout.tsx# Embedded Razorpay modal component
        │   ├── PushNotificationManager.tsx # Web Push permissions & handler
        │   ├── common/             # Navbars, Footers, Badges, Steppers
        │   └── landing/            # Landing page sections (Hero, Estimator, Reviews, etc.)
        ├── context/                # AuthContext, ThemeContext, AdminContext, AgentContext
        └── lib/
            ├── api.ts              # Centralized Axios client with JWT interceptors
            ├── constants.ts        # UI constants & categories
            └── firebase.ts         # Firebase Web SDK initialization
```

---

## 🗄 Database Schema (Prisma Models)

The system is built on a relational PostgreSQL schema managed via Prisma:

1. **`User`**: Registered customer accounts, address, coordinates, FCM device tokens, referral codes, wallet balance.
2. **`Order`**: Order state, pickup/delivery slots, total pricing, express flags, inspection notes, 4-digit delivery OTP, rating, and cancellation details.
3. **`ClothesItem`**: Granular breakdown of garments per order (category, type, service, unit price, quantity).
4. **`Agent`**: Delivery and pickup partner profiles, credentials, role (`PICKUP`, `DELIVERY`, `BOTH`), city, daily claimed counts.
5. **`Payment`**: Payment record linked to orders or subscriptions with Razorpay payment IDs, signatures, status, and refund audit details.
6. **`Subscription`**: Active customer plans (`WEEKLY`, `MONTHLY`, `YEARLY`) with dynamic FUP pickup and garment tracking.
7. **`AdminUser`**: Backoffice administrators with bcrypt-hashed credentials and roles (`SUPER`, `VIEWER`).
8. **`TokenBlacklist`**: Invalidated JWT tokens for instantaneous logout and session invalidation.
9. **`Coupon`**: Promotional codes (percentage or flat discount, expiration, maximum usage caps).
10. **`Referral`**: Tracks referrers and referees with reward status tracking.
11. **`City`**: Serviceable coverage areas and city-level operational toggles.

---

## 🔌 API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a customer with optional referral code.
- `POST /api/auth/login` — Customer login returning JWT access token.
- `GET /api/auth/me` — Fetch authenticated customer profile and wallet balance.
- `PUT /api/auth/profile` — Update address, pincode, and contact details.
- `PUT /api/auth/change-password` — Change password and invalidate old tokens.
- `POST /api/auth/logout` — Blacklist current JWT token.
- `POST /api/auth/fcm-token` — Register browser FCM push token for order notifications.

### Orders (`/api/orders`)
- `POST /api/orders` — Create a new order with pickup slot, address, and express option.
- `GET /api/orders` — List authenticated user's order history.
- `GET /api/orders/:id` — Retrieve detailed order info, status, items, and delivery OTP.
- `POST /api/orders/:id/clothes` — Save garment itemization and service selections.
- `POST /api/orders/:id/delivery-slot` — Schedule delivery time and handover preference.
- `POST /api/orders/:id/cancel` — Cancel pending order with reason.
- `POST /api/orders/:id/review` — Submit rating (1–5 stars) and feedback review.

### Logistics Agent (`/api/agent`)
- `POST /api/agent/login` — Agent authentication.
- `GET /api/agent/orders/available` — List unassigned orders available to claim.
- `POST /api/agent/orders/:id/claim` — Claim an order for pickup or delivery.
- `GET /api/agent/orders/my` — View agent's active claimed tasks.
- `PATCH /api/agent/orders/:id/status` — Advance order status (`PICKED_UP`, `IN_WASHING`, etc.).
- `POST /api/agent/orders/:id/verify-otp` — Verify customer's delivery OTP to mark order as delivered.

### Administration (`/api/admin` & `/api/admin/auth`)
- `POST /api/admin/auth/login` — Administrator login with email & password.
- `GET /api/admin/orders` — Query all orders with status and date filters.
- `PATCH /api/admin/orders/:id/status` — Override order status and broadcast via WebSocket.
- `PATCH /api/admin/orders/:id/assign` — Manually assign pickup or delivery agents.
- `GET /api/admin/agents` — List logistics fleet agents and operational statuses.
- `POST /api/admin/agents` — Create and onboard new logistics agents.
- `GET /api/admin/analytics` — Fetch business analytics (revenue, order counts, status breakdowns).
- `GET /api/admin/coupons` — List all promo codes.
- `POST /api/admin/coupons` — Create new coupon rules.

### Payments & Webhooks (`/api/payments` & `/api/webhooks`)
- `POST /api/payments/create-order` — Generate Razorpay payment order for checkout.
- `POST /api/payments/verify` — Verify Razorpay HMAC signature and mark payment completed.
- `POST /api/webhooks` — Secure webhook endpoint for asynchronous payment and refund notifications.

---

## ⚙️ Environment Variables

### Backend (`washx-backend/.env`)
```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3000
AGENT_URL=http://localhost:3000

# PostgreSQL Database (Prisma)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/washx?schema=public"

# Authentication
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET=YOUR_RAZORPAY_WEBHOOK_SECRET

# Admin Account Seed (used by scripts/create-admin.js)
ADMIN_EMAIL=admin@washx.in
ADMIN_PASSWORD=WashX@Admin2024!
ADMIN_NAME=WashX Super Admin
```

### Frontend (`washx-frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID

# Optional Firebase Web Push Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
```

---

## 💻 Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) (running locally or via Docker/cloud instance)
- [Git](https://git-scm.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/darshanpeddadad/WashX_.git
cd WashX_
```

### 2. Configure & Run Backend
```bash
cd washx-backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Open .env and set your DATABASE_URL and JWT_SECRET

# Run Prisma schema migrations
npx prisma db push

# (Optional) Seed the Super Admin account
node scripts/create-admin.js

# Start backend development server
npm run dev
# Server will be listening on http://localhost:5000
```

### 3. Configure & Run Frontend
In a new terminal window:
```bash
cd washx-frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start Next.js development server
npm run dev
# App will be accessible at http://localhost:3000
```

---

## 🚢 Deployment Guide

### Backend: Railway / Render
1. Connect your GitHub repository to [Railway](https://railway.app) or [Render](https://render.com).
2. Set the root directory to `washx-backend`.
3. Attach a managed PostgreSQL database service and link `DATABASE_URL`.
4. Configure required environment variables (`JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `FRONTEND_URL`).
5. Set the build command:
   ```bash
   npm install && npx prisma generate && npx prisma db push
   ```
6. Set the start command:
   ```bash
   node server.js
   ```

### Frontend: Vercel
1. Connect your repository to [Vercel](https://vercel.com).
2. Set the root directory to `washx-frontend`.
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL` -> Your deployed backend API URL (e.g. `https://washx-api.up.railway.app/api`)
   - `NEXT_PUBLIC_SOCKET_URL` -> Your deployed backend URL (e.g. `https://washx-api.up.railway.app`)
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` -> Your Razorpay public key ID.
4. Deploy with automatic CI/CD on every push to `main`.

---

## 📄 License
This project is licensed under the ISC License.
