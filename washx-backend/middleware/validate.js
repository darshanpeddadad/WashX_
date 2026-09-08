/**
 * WashX Input Validation Middleware
 * Uses Joi to validate request bodies/params before they hit route handlers.
 * Usage: router.post('/route', validate(schemas.mySchema), handler)
 */
const Joi = require('joi');

const PHONE_RE = /^[6-9]\d{9}$/;
const PASSWORD_MIN = 8;

// ── Reusable field definitions ────────────────────────────────────────────────
const fields = {
  email: Joi.string().email().max(200).lowercase().trim(),
  password: Joi.string().min(PASSWORD_MIN).max(128),
  phone: Joi.string().pattern(PHONE_RE).messages({ 'string.pattern.base': 'Phone must be a valid 10-digit Indian mobile number' }),
  name: Joi.string().min(2).max(100).trim(),
  city: Joi.string().min(2).max(60).trim(),
  pincode: Joi.string().pattern(/^\d{6}$/).messages({ 'string.pattern.base': 'Pincode must be 6 digits' }),
  uuid: Joi.string().uuid(),
  plan: Joi.string().valid('WEEKLY', 'MONTHLY', 'ANNUAL'),
  service: Joi.string().valid('wash', 'wash_iron', 'dry_clean'),
};

// ── Schemas ───────────────────────────────────────────────────────────────────
const schemas = {
  register: Joi.object({
    name:     fields.name.required(),
    email:    fields.email.required(),
    phone:    fields.phone.required(),
    password: fields.password.required(),
    city:     fields.city.required(),
    address:  Joi.string().min(5).max(300).trim().required(),
    pincode:  fields.pincode.required(),
  }),

  login: Joi.object({
    email:    fields.email.required(),
    password: Joi.string().max(128).required(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().max(128).required(),
    newPassword:     fields.password.required(),
  }),

  adminLogin: Joi.object({
    email:    fields.email.required(),
    password: Joi.string().max(128).required(),
  }),

  createOrder: Joi.object({
    city:             fields.city.required(),
    address:          Joi.string().min(5).max(300).trim().required(),
    pincode:          fields.pincode.required(),
    specialNotes:     Joi.string().max(500).trim().allow('', null),
    deliveryPreference: Joi.string().valid('HAND', 'DOORSTEP').default('HAND'),
    isExpress:        Joi.boolean().default(false),
  }),

  clothesItems: Joi.object({
    items: Joi.array().items(Joi.object({
      category: Joi.string().valid('mens','womens_saree','womens_other','kids','household','winterwear','accessories').required(),
      type:     Joi.string().max(100).trim().required(),
      quantity: Joi.number().integer().min(1).max(100).required(),
      service:  fields.service.required(),
    })).min(1).max(50).required(),
    inspectionAcknowledged: Joi.boolean(),
    inspectionNotes:        Joi.string().max(500).allow('', null),
  }),

  pickupSlot: Joi.object({
    pickupSlot: Joi.string().isoDate().required(),
  }),

  cancelOrder: Joi.object({
    cancellationReason: Joi.string().min(5).max(500).trim().required(),
  }),

  rating: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    review: Joi.string().max(1000).trim().allow('', null),
  }),

  subscriptionPlan: Joi.object({
    plan: fields.plan.required(),
  }),

  verifySubscription: Joi.object({
    plan:                 fields.plan.required(),
    razorpay_order_id:    Joi.string().required(),
    razorpay_payment_id:  Joi.string().required(),
    razorpay_signature:   Joi.string().required(),
  }),

  couponValidate: Joi.object({
    code:       Joi.string().uppercase().trim().max(30).required(),
    cartTotal:  Joi.number().min(0).required(),
  }),

  createCoupon: Joi.object({
    code:      Joi.string().uppercase().trim().max(30).required(),
    type:      Joi.string().valid('PERCENT', 'FLAT').required(),
    value:     Joi.number().min(1).max(10000).required(),
    minOrder:  Joi.number().min(0).default(0),
    maxUses:   Joi.number().integer().min(1).allow(null),
    expiresAt: Joi.string().isoDate().allow(null),
  }),

  applyReferral: Joi.object({
    referralCode: Joi.string().trim().max(20).required(),
  }),
};

// ── Middleware factory ────────────────────────────────────────────────────────
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = source === 'body' ? req.body : source === 'params' ? req.params : req.query;
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message.replace(/['"]/g, ''));
      return res.status(400).json({
        error: 'Validation failed',
        details: messages,
      });
    }

    // Replace with sanitized/coerced value
    if (source === 'body') req.body = value;
    next();
  };
}

module.exports = { validate, schemas };
