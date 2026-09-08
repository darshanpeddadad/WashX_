# WashX Frontend 🧺✨

The client web application for **WashX** — Next-generation On-Demand Laundry & Garment Care Platform.

Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Socket.io Client**.

> 📖 **Full System Documentation**: Please refer to the root [README.md](../README.md) for architecture, API routes, database schemas, and end-to-end system design.

---

## Features Implemented
- **Landing Page**: Interactive hero, process step-by-step walkthrough, garment specimen registry, live price estimator, and city coverage ticker.
- **Customer Booking Flow**: Multi-step booking wizard (`/book`), category and garment item selection with real-time price totals (`/orders/[id]/clothes`), and delivery slot scheduling (`/orders/[id]/delivery`).
- **Live Order Tracking**: Real-time order progress timeline with WebSocket sync (`/orders/[id]`).
- **Subscriptions**: Membership plan selection (`/subscription`) with Fair Usage Policy (FUP) status tracking.
- **Logistics Agent Portal**: Responsive agent workspace (`/agent/dashboard`) for claiming pickups and deliveries, and submitting delivery OTPs.
- **Admin Command Center**: Visual drag-and-drop Kanban board (`/admin/kanban`), orders table (`/admin/orders`), agent management (`/admin/agents`), coupons studio (`/admin/coupons`), and business analytics (`/admin/analytics`).
- **Payments**: Razorpay modal checkout integration.
- **Push Notifications**: Firebase Cloud Messaging background service worker.
- **Dark/Light Mode**: Full theme customization with system preference detection.

---

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Ensure `NEXT_PUBLIC_API_URL` points to your backend:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
