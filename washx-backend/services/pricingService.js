/**
 * WashX Pricing Engine
 * Men's items: ₹5/item
 * Women's saree: ₹20/item
 * Women's other: ₹5/item
 *
 * Service multipliers:
 * - wash: 1x
 * - wash_iron: 1.5x
 * - dry_clean: 3x
 */

const BASE_PRICES = {
  mens: 25,
  womens_saree: 60,
  womens_other: 25,
  kids: 18,
  household: 40,
  winterwear: 60,
  accessories: 60,
};

// Dry-clean prices are category-specific (market rates)
const DRY_CLEAN_PRICES = {
  mens: 80,       // shirt/suit dry clean: ₹80
  womens_saree: 150, // saree dry clean: ₹150
  womens_other: 80,
  kids: 60,
  household: 100,
  winterwear: 120,
  accessories: 100,
};

const SERVICE_MULTIPLIERS = {
  wash: 1,
  wash_iron: 1.5,
  dry_clean: null, // uses DRY_CLEAN_PRICES instead
};

const MIN_ORDER_VALUE = 99; // ₹99 minimum garment total before delivery fee

const CATEGORY_META = {
  mens: { label: "Men's Wear", icon: '👔', basePrice: 25 },
  womens_saree: { label: "Women's Saree", icon: '🥻', basePrice: 60 },
  womens_other: { label: "Women's Other", icon: '👗', basePrice: 25 },
  kids: { label: 'Kids & Infants', icon: '🧒', basePrice: 18 },
  household: { label: 'Household & Bedding', icon: '🛏️', basePrice: 40 },
  winterwear: { label: 'Winter & Woolen', icon: '🧥', basePrice: 60 },
  accessories: { label: 'Shoes & Bags', icon: '👟', basePrice: 60 },
};

const CLOTHES_CATALOG = {
  mens: [
    'Shirt (Casual / Formal)',
    'T-Shirt / Polo',
    'Pant / Trousers',
    'Jeans / Denim',
    'Shorts / Bermudas',
    'Kurta / Pyjama',
    'Dhoti / Lungi',
    'Sherwani / Indo-Western',
    'Suit Jacket / Blazer',
    'Suit Trouser',
    'Nehru Jacket / Modi Vest',
    'Jacket / Windcheater',
    'Sweater / Cardigan',
    'Hoodie / Sweatshirt',
    'Track Pants / Joggers',
    'Undergarments / Vests (set)',
    'Socks (pair)',
    'Handkerchiefs (set of 3)',
  ],
  womens_saree: [
    'Cotton Saree',
    'Silk / Kanjeevaram Saree',
    'Banarasi Saree',
    'Chiffon / Georgette Saree',
    'Designer Embroidered Saree',
    'Paithani / Chanderi Saree',
    'Bandhani / Bandhej Saree',
    'Heavy Bridal Saree',
  ],
  womens_other: [
    'Kurti / Tunics',
    'Salwar Kameez (set)',
    'Dupatta / Stole',
    'Palazzo / Culottes',
    'Leggings / Jeggings',
    'Jeans / Trousers',
    'Top / T-Shirt',
    'Formal Shirt / Blouse',
    'Saree Blouse (Plain)',
    'Saree Blouse (Embroidered / Padded)',
    'Skirt / Midi / Maxi',
    'One-Piece Dress / Gown',
    'Lehenga (set)',
    'Anarkali Suit',
    'Jacket / Blazer / Shrug',
    'Sweater / Cardigan',
    'Nightwear / Kaftan',
    'Undergarments (set)',
  ],
  kids: [
    'School Uniform (set)',
    'Kids T-Shirt / Shirt',
    'Kids Shorts / Skirt',
    'Kids Jeans / Pants',
    'Kids Frock / Party Dress',
    'Kids Pajamas / Nightwear',
    'Infant / Baby Onesie / Romper',
    'Kids Jacket / Sweater',
    'Baby Blanket / Swaddle Cloth',
  ],
  household: [
    'Bedsheet (Single)',
    'Bedsheet (Double / King)',
    'Pillow Covers (Pair)',
    'Duvet Cover / Quilt Cover',
    'Light Blanket / Dohar',
    'Heavy Blanket / Razai',
    'Quilt / Comforter',
    'Bath Towel',
    'Hand Towel / Face Towel (set of 2)',
    'Window Curtain',
    'Door Curtain',
    'Cushion Covers (set of 2)',
    'Sofa Cover (Single / Double)',
    'Tablecloth / Table Runner',
    'Bath Mat / Floor Rug',
  ],
  winterwear: [
    'Woolen Sweater / Pullover',
    'Cardigan / Shrug',
    'Woolen Shawl / Pashmina',
    'Thermal Innerwear (set)',
    'Leather / Suede Jacket',
    'Puffer / Down Jacket',
    'Overcoat / Trench Coat',
    'Woolen Scarf / Muffler',
    'Woolen Cap & Gloves (set)',
  ],
  accessories: [
    'Canvas / Sports Shoes (Wash & Clean)',
    'Sneakers / Casual Shoes (Clean)',
    'Backpack / School Bag',
    'Gym Bag / Duffle Bag',
    'Soft Toy (Small / Medium)',
    'Soft Toy (Large)',
    'Baseball Cap / Sun Hat',
  ],
  common: [
    'Bedsheet (Single)',
    'Bedsheet (Double / King)',
    'Pillow Covers (Pair)',
    'Blanket',
    'Towel',
    'Curtain',
  ],
};

const FREE_DELIVERY_THRESHOLD = 250;
const STANDARD_DELIVERY_FEE = 40;

/**
 * Get price per unit for a clothes category and service
 */
function getPricePerUnit(category, service) {
  if (service === 'dry_clean') {
    return DRY_CLEAN_PRICES[category] || 80;
  }
  const base = BASE_PRICES[category] || 25;
  const multiplier = SERVICE_MULTIPLIERS[service] || 1;
  return Math.round(base * multiplier);
}

/**
 * Calculate total and delivery breakdown for a list of clothes items
 * @param {Array} items - [{category, type, quantity, service}]
 * @param {Object} options - { isSubscriber: boolean }
 */
function calculateOrderBreakdown(items, { isSubscriber = false } = {}) {
  let garmentsTotal = 0;
  const priced = items.map((item) => {
    const pricePerUnit = getPricePerUnit(item.category, item.service);
    const totalPrice = pricePerUnit * item.quantity;
    garmentsTotal += totalPrice;
    return { ...item, pricePerUnit, totalPrice };
  });

  // Business Rule: Free delivery if cart is >= 250 or user has an active Express Pass subscription.
  // If cart is < 250, add delivery fee of ₹40.
  const isFreeDelivery = isSubscriber || garmentsTotal >= FREE_DELIVERY_THRESHOLD;
  const deliveryFee = isFreeDelivery ? 0 : STANDARD_DELIVERY_FEE;
  const finalTotal = garmentsTotal + deliveryFee;
  const amountNeededForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - garmentsTotal);

  // Business Rule: Minimum order value
  const belowMinimum = garmentsTotal < MIN_ORDER_VALUE;

  return {
    items: priced,
    garmentsTotal,
    deliveryFee,
    finalTotal,
    grandTotal: finalTotal, // for backwards-compatibility
    isFreeDelivery,
    amountNeededForFreeDelivery,
    threshold: FREE_DELIVERY_THRESHOLD,
    belowMinimum,
    minimumOrderValue: MIN_ORDER_VALUE,
  };
}

/**
 * Calculate total for a list of clothes items (legacy wrapper)
 * @param {Array} items - [{category, type, quantity, service}]
 * @returns {Array} items with pricePerUnit and totalPrice added
 */
function calculateOrderTotal(items, options = {}) {
  const breakdown = calculateOrderBreakdown(items, options);
  return {
    items: breakdown.items,
    garmentsTotal: breakdown.garmentsTotal,
    deliveryFee: breakdown.deliveryFee,
    grandTotal: breakdown.finalTotal,
  };
}

module.exports = {
  getPricePerUnit,
  calculateOrderTotal,
  calculateOrderBreakdown,
  FREE_DELIVERY_THRESHOLD,
  STANDARD_DELIVERY_FEE,
  MIN_ORDER_VALUE,
  CLOTHES_CATALOG,
  BASE_PRICES,
  DRY_CLEAN_PRICES,
  SERVICE_MULTIPLIERS,
  CATEGORY_META,
};

