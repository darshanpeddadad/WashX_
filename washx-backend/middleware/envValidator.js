/**
 * WashX Startup Environment Validator
 * Crashes fast if required secrets are missing — prevents silent production failures.
 */

const REQUIRED = [
  'JWT_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
];

const OPTIONAL_WITH_WARNINGS = [
  { key: 'EMAIL_USER',    feature: 'Email notifications' },
  { key: 'EMAIL_PASS',    feature: 'Email notifications' },
  { key: 'TWILIO_SID',    feature: 'SMS notifications' },
  { key: 'TWILIO_TOKEN',  feature: 'SMS notifications' },
  { key: 'TWILIO_FROM',   feature: 'SMS notifications' },
  { key: 'ADMIN_JWT_SECRET', feature: 'Admin JWT (falls back to JWT_SECRET)' },
  { key: 'FRONTEND_URL',  feature: 'CORS (falls back to localhost:3000)' },
  { key: 'ADMIN_KEY',     feature: 'Legacy admin key (deprecated)' },
];

function validateEnv() {
  const missing = REQUIRED.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    console.error('\n❌ FATAL: Missing required environment variables:');
    missing.forEach((k) => console.error(`   • ${k}`));
    console.error('\nSet these in your .env file and restart.\n');
    process.exit(1);
  }

  // Warn about weak JWT secret
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET is short (<32 chars). Use a long random string in production.');
  }

  // Warn about missing optional
  OPTIONAL_WITH_WARNINGS.forEach(({ key, feature }) => {
    if (!process.env[key]) {
      console.warn(`⚠️  WARNING: ${key} not set — ${feature} will be disabled or limited.`);
    }
  });

  console.log('✓ Environment validated');
}

module.exports = { validateEnv };
