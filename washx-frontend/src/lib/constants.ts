export const CLOTHES_CATALOG = {
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
    'Bedsheet (Double)',
    'Pillow Cover',
    'Blanket',
    'Towel',
    'Curtain',
  ],
};

export const CATEGORY_LABELS: Record<string, string> = {
  mens: "Men's Wear",
  womens_saree: "Women's Saree",
  womens_other: "Women's Wear",
  kids: 'Kids & Infants',
  household: 'Household & Bedding',
  winterwear: 'Winter & Woolen',
  accessories: 'Shoes & Bags',
  common: 'Common / Linens',
};

export const CATEGORY_ICONS: Record<string, string> = {
  mens: '👔',
  womens_saree: '🥻',
  womens_other: '👗',
  kids: '🧒',
  household: '🛏️',
  winterwear: '🧥',
  accessories: '👟',
  common: '🧺',
};

export const BASE_PRICES: Record<string, number> = {
  mens: 25,
  womens_saree: 60,
  womens_other: 25,
  kids: 18,
  household: 40,
  winterwear: 60,
  accessories: 60,
};

export const DRY_CLEAN_PRICES: Record<string, number> = {
  mens: 80,
  womens_saree: 150,
  womens_other: 80,
  kids: 60,
  household: 100,
  winterwear: 120,
  accessories: 100,
};

export const SERVICE_LABELS: Record<string, string> = {
  wash: 'Wash Only',
  wash_iron: 'Wash + Iron',
  dry_clean: 'Dry Clean',
};

export const SERVICE_MULTIPLIERS: Record<string, number> = {
  wash: 1,
  wash_iron: 1.5,
  dry_clean: 0, // not used for dry_clean — see DRY_CLEAN_PRICES
};

export const FREE_DELIVERY_THRESHOLD = 250;
export const STANDARD_DELIVERY_FEE = 40;
export const MIN_ORDER_VALUE = 99;

export function getPricePerUnit(category: string, service: string): number {
  if (service === 'dry_clean') {
    return DRY_CLEAN_PRICES[category] ?? 80;
  }
  const base = BASE_PRICES[category] ?? 25;
  const multiplier = SERVICE_MULTIPLIERS[service] ?? 1;
  return Math.round(base * multiplier);
}

export const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; icon: string; step: number }> = {
  PENDING:            { label: 'Order Placed',        color: 'text-yellow-400',  icon: '📋', step: 0 },
  PICKUP_SCHEDULED:   { label: 'Pickup Scheduled',    color: 'text-blue-400',    icon: '📅', step: 1 },
  PICKUP_MISSED:      { label: 'Pickup Missed',       color: 'text-orange-400',  icon: '⚠️', step: 1 },
  PICKED_UP:          { label: 'Picked Up',           color: 'text-purple-400',  icon: '🚗', step: 2 },
  IN_WASHING:         { label: 'Washing in Progress', color: 'text-cyan-400',    icon: '🪷', step: 3 },
  WASHING_DONE:       { label: 'Ready for Delivery',  color: 'text-green-400',   icon: '✅', step: 4 },
  DELIVERY_SCHEDULED: { label: 'Delivery Scheduled',  color: 'text-blue-400',    icon: '📦', step: 5 },
  OUT_FOR_DELIVERY:   { label: 'Out for Delivery',    color: 'text-orange-400',  icon: '🛵', step: 6 },
  DELIVERED:          { label: 'Delivered',           color: 'text-emerald-400', icon: '🎉', step: 7 },
  CANCELLED:          { label: 'Cancelled',           color: 'text-red-400',     icon: '❌', step: -1 },
};
