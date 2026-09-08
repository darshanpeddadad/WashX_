/**
 * WashX Notification Service
 * Handles Email (Nodemailer/Gmail) + SMS (Twilio) notifications
 */

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });
  }
  return transporter;
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function orderConfirmationEmail(order, user) {
  return {
    from: `"WashX 🧺" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `WashX Order Confirmed — #${order.id.slice(0, 12).toUpperCase()}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; background: #09090b; font-family: 'Inter', Arial, sans-serif; color: #fafafa; }
    .container { max-width: 580px; margin: 0 auto; padding: 40px 24px; }
    .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
    .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg,#6366f1,#06b6d4); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; text-align: center; line-height: 44px; }
    .logo-text { font-size: 24px; font-weight: 800; color: #6366f1; }
    .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 28px; margin-bottom: 20px; }
    .order-id { font-family: monospace; font-size: 22px; font-weight: 800; color: #a78bfa; letter-spacing: 2px; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 999px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); color: #a78bfa; font-size: 13px; font-weight: 600; }
    .slot-info { background: rgba(255,255,255,0.03); border-radius: 10px; padding: 14px 18px; margin-top: 14px; font-size: 14px; color: #a1a1aa; }
    .btn { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg,#6366f1,#4f46e5); color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; margin-top: 20px; }
    .footer { text-align: center; color: #52525b; font-size: 13px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <div class="logo-icon">🧺</div>
      <div class="logo-text">WashX</div>
    </div>

    <div class="card">
      <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 8px;">ORDER CONFIRMED</p>
      <div class="order-id">${order.id.slice(0, 16).toUpperCase()}</div>
      <p style="color: #71717a; font-size: 14px; margin-top: 4px;">Keep this ID for tracking your order.</p>
      <br>
      <span class="badge">📅 Pickup Scheduled</span>
      <div class="slot-info">
        🕐 <strong>Pickup Slot:</strong> ${order.pickupSlot ? new Date(order.pickupSlot).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'TBD'}<br>
        📍 <strong>Address:</strong> ${order.pickupAddress || 'Not set'}<br>
        🏙️ <strong>City:</strong> ${order.city || ''}
      </div>
    </div>

    <div class="card">
      <p style="font-weight: 700; margin-bottom: 12px;">Hi ${user.name}! Your laundry is booked. 🎉</p>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">Our pickup agent will arrive at your address during the scheduled slot. Please keep your clothes ready in a bag.</p>
      <a href="${process.env.FRONTEND_URL}/orders/${order.id}" class="btn">Track Order →</a>
    </div>

    <div class="footer">
      WashX — Making laundry effortless across India 🇮🇳<br>
      <a href="${process.env.FRONTEND_URL}" style="color: #6366f1;">washx.in</a>
    </div>
  </div>
</body>
</html>`,
  };
}

function washingDoneEmail(order, user) {
  return {
    from: `"WashX 🧺" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `✅ Your clothes are clean! — WashX Order #${order.id.slice(0, 12).toUpperCase()}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
  body { margin:0;padding:0;background:#09090b;font-family:Arial,sans-serif;color:#fafafa; }
  .container { max-width:580px;margin:0 auto;padding:40px 24px; }
  .card { background:rgba(255,255,255,0.04);border:1px solid rgba(16,185,129,0.3);border-radius:16px;padding:28px;margin-bottom:20px; }
  .btn { display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#10b981,#059669);color:white;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;margin-top:20px; }
  .footer { text-align:center;color:#52525b;font-size:13px;margin-top:32px; }
</style>
</head>
<body>
<div class="container">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="font-size:60px;margin-bottom:8px;">✅</div>
    <div style="font-size:24px;font-weight:800;color:#10b981;">Clothes are fresh & clean!</div>
  </div>
  <div class="card">
    <p>Hi <strong>${user.name}</strong>! Your WashX order <code style="color:#a78bfa">#${order.id.slice(0,12).toUpperCase()}</code> has been processed.</p>
    <p style="color:#a1a1aa;font-size:14px;margin-top:12px;line-height:1.6;">Your clothes are washed, dried, and ready for delivery. Book a delivery slot at your convenience and we'll bring them right to your door!</p>
    <a href="${process.env.FRONTEND_URL}/orders/${order.id}/delivery" class="btn">📅 Book Delivery Slot →</a>
  </div>
  <div class="footer">WashX — <a href="${process.env.FRONTEND_URL}" style="color:#6366f1;">washx.in</a></div>
</div>
</body></html>`,
  };
}

function deliveryDoneEmail(order, user) {
  return {
    from: `"WashX 🧺" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `🎉 Delivered! Rate your WashX experience — #${order.id.slice(0, 12).toUpperCase()}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
  body { margin:0;padding:0;background:#09090b;font-family:Arial,sans-serif;color:#fafafa; }
  .container { max-width:580px;margin:0 auto;padding:40px 24px; }
  .card { background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px;margin-bottom:20px; }
  .btn { display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:white;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;margin-top:20px; }
</style>
</head>
<body>
<div class="container">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="font-size:60px;margin-bottom:8px;">🎉</div>
    <div style="font-size:24px;font-weight:800;">Order Delivered!</div>
  </div>
  <div class="card">
    <p>Hi <strong>${user.name}</strong>! Your clean clothes have been delivered. Hope you love the freshness!</p>
    <p style="color:#a1a1aa;font-size:14px;margin-top:12px;">Order <code style="color:#a78bfa">#${order.id.slice(0,12).toUpperCase()}</code> — Total: ₹${order.totalPrice}</p>
    <a href="${process.env.FRONTEND_URL}/orders/${order.id}" class="btn">⭐ Rate Your Experience →</a>
  </div>
</div>
</body></html>`,
  };
}

// ─── SMS Templates (Twilio) ───────────────────────────────────────────────────

function getSmsText(status, order) {
  const id = order.id.slice(0, 10).toUpperCase();
  const messages = {
    PICKUP_SCHEDULED: `WashX: Pickup confirmed for order #${id}. Our agent will arrive at your scheduled time. Track: ${process.env.FRONTEND_URL}/orders/${order.id}`,
    PICKED_UP: `WashX: Your clothes have been collected for order #${id}. We'll notify you when washing is done! 🫧`,
    WASHING_DONE: `WashX: Great news! Order #${id} is washed & ready. Book your delivery slot now: ${process.env.FRONTEND_URL}/orders/${order.id}/delivery`,
    OUT_FOR_DELIVERY: `WashX: Your clean clothes are on the way! 🛵 Order #${id}. Expected in your scheduled slot.`,
    DELIVERED: `WashX: Order #${id} delivered! 🎉 Thanks for choosing WashX. Rate us: ${process.env.FRONTEND_URL}/orders/${order.id}`,
  };
  return messages[status] || null;
}

// ─── Main send functions ──────────────────────────────────────────────────────

async function sendEmail(mailOptions) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('[Notification] Email not configured, skipping');
    return;
  }
  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log(`[Notification] Email sent: ${info.messageId}`);
  } catch (err) {
    console.error('[Notification] Email error:', err.message);
  }
}

async function sendSms(to, body) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_ACCOUNT_SID.includes('xx')) {
    console.log('[Notification] SMS not configured, skipping');
    return;
  }
  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const msg = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to.startsWith('+') ? to : `+91${to}`,
    });
    console.log(`[Notification] SMS sent: ${msg.sid}`);
  } catch (err) {
    console.error('[Notification] SMS error:', err.message);
  }
}

// ─── Firebase Cloud Messaging (Push Notifications) ──────────────────────────

let firebaseAdmin = null;

function getFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin;
  try {
    const admin = require('firebase-admin');
    if (admin.apps.length > 0) {
      firebaseAdmin = admin.apps[0];
      return firebaseAdmin;
    }

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string' && process.env.FIREBASE_SERVICE_ACCOUNT.startsWith('{')
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : require(process.env.FIREBASE_SERVICE_ACCOUNT);

      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[Notification] Firebase Admin initialized with service account');
    } else if (process.env.FIREBASE_PROJECT_ID) {
      firebaseAdmin = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      console.log('[Notification] Firebase Admin initialized with projectId');
    }
  } catch (err) {
    console.warn('[Notification] Firebase Admin init skipped:', err.message);
  }
  return firebaseAdmin;
}

async function sendPushNotification(fcmToken, { title, body, data = {} }) {
  if (!fcmToken) return;
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      console.log('[Notification] Firebase Admin not configured, skipping push notification');
      return;
    }

    const response = await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: {
        ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        click_action: data.orderId ? `/orders/${data.orderId}` : '/dashboard',
      },
      webpush: {
        fcmOptions: {
          link: data.orderId ? `/orders/${data.orderId}` : '/dashboard',
        },
        notification: {
          icon: '/icons/icon-192.png',
          badge: '/icons/badge-72.png',
        },
      },
    });
    console.log('[Notification] FCM Push sent:', response);
  } catch (err) {
    console.error('[Notification] FCM Push error:', err.message);
  }
}

// ─── Dispatch notifications based on status ───────────────────────────────────

async function notifyStatusChange(order, user) {
  const { status } = order;

  // 1. Send SMS
  const smsText = getSmsText(status, order);
  if (smsText && user.phone) await sendSms(user.phone, smsText);

  // 2. Send email based on status
  if (status === 'PICKUP_SCHEDULED') {
    await sendEmail(orderConfirmationEmail(order, user));
  } else if (status === 'WASHING_DONE') {
    await sendEmail(washingDoneEmail(order, user));
  } else if (status === 'DELIVERED') {
    await sendEmail(deliveryDoneEmail(order, user));
  }

  // 3. Send Web / Mobile Push Notification via FCM
  if (user && user.fcmToken) {
    const titles = {
      PICKUP_SCHEDULED: '📅 Pickup Scheduled',
      PICKED_UP: '🧺 Clothes Collected',
      IN_WASHING: '🫧 Washing in Progress',
      WASHING_DONE: '✅ Clothes are Ready!',
      DELIVERY_SCHEDULED: '📦 Delivery Scheduled',
      OUT_FOR_DELIVERY: '🛵 Out for Delivery!',
      DELIVERED: '🎉 Order Delivered!',
      CANCELLED: '❌ Order Cancelled',
    };

    const bodies = {
      PICKUP_SCHEDULED: `Your pickup is scheduled for ${order.pickupSlot ? new Date(order.pickupSlot).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'soon'}.`,
      PICKED_UP: 'Agent picked up your clothes and is heading to the wash facility.',
      IN_WASHING: 'Your laundry is currently being cleaned with care.',
      WASHING_DONE: 'Your laundry is clean, dried and ready! Click to book your delivery slot.',
      DELIVERY_SCHEDULED: 'Your delivery slot is booked.',
      OUT_FOR_DELIVERY: 'Your clean clothes are on their way to your doorstep!',
      DELIVERED: 'Thank you for choosing WashX! Please rate your service experience.',
      CANCELLED: 'Your order has been cancelled.',
    };

    const title = titles[status] || `WashX Order Update: ${status}`;
    const body = bodies[status] || `Order #${order.id.slice(0, 10).toUpperCase()} status is now ${status}.`;

    await sendPushNotification(user.fcmToken, {
      title: `WashX: ${title}`,
      body,
      data: { orderId: order.id, status },
    });
  }
}

module.exports = { notifyStatusChange, sendEmail, sendSms, sendPushNotification };

