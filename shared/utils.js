// GalliExpress — Shared Utilities

// ─── Price Formatting ────────────────────────────────────────────────────────
export const formatPrice = (amount) => `₹${Number(amount).toFixed(0)}`;

export const formatPriceDetailed = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

// ─── Phone Number ─────────────────────────────────────────────────────────────
export const formatPhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('91') ? `+${digits}` : `+91${digits}`;
};

export const isValidPhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 && /^[6-9]/.test(digits);
};

// ─── Time & Date ─────────────────────────────────────────────────────────────
export const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const getTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'ఇప్పుడే';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} నిమిషాల క్రితం`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} గంటల క్రితం`;
  return formatDate(timestamp);
};

// ─── Order ───────────────────────────────────────────────────────────────────
export const calculateOrderTotal = (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const getDeliveryFee = (subtotal) => {
  if (subtotal >= 300) return 0;
  if (subtotal >= 150) return 20;
  return 30;
};

export const generateOrderId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `GE${timestamp}${random}`;
};

// ─── Order Status ─────────────────────────────────────────────────────────────
export const getStatusColor = (status) => {
  const map = {
    pending: '#FFB800',
    confirmed: '#007AFF',
    preparing: '#FF6B35',
    ready: '#00C851',
    on_the_way: '#5856D6',
    delivered: '#00C851',
    cancelled: '#FF3B30',
  };
  return map[status] || '#8A8A99';
};

export const getStatusLabel = (status) => {
  const map = {
    pending: 'వేచి ఉంది',
    confirmed: 'నిర్ధారించబడింది',
    preparing: 'తయారు చేస్తున్నారు',
    ready: 'రెడీ అయింది',
    on_the_way: 'దారిలో ఉంది',
    delivered: 'డెలివర్ అయింది',
    cancelled: 'రద్దు అయింది',
  };
  return map[status] || status;
};

// ─── Validation ───────────────────────────────────────────────────────────────
export const isValidOTP = (otp) => /^\d{6}$/.test(otp);

export const isValidPrice = (price) => !isNaN(price) && Number(price) > 0;

// ─── Distance ─────────────────────────────────────────────────────────────────
export const getDistanceLabel = (distanceInMeters) => {
  if (distanceInMeters < 1000) return `${Math.round(distanceInMeters)} మీ`;
  return `${(distanceInMeters / 1000).toFixed(1)} కి.మీ`;
};

// ─── Category Icons (emoji fallback) ─────────────────────────────────────────
export const getCategoryEmoji = (category) => {
  const map = {
    food: '🍱',
    grocery: '🛒',
    vegetables: '🥦',
    fruits: '🍎',
    dairy: '🥛',
    meat: '🐔',
    bakery: '🍰',
    sweets: '🍬',
    beverages: '🥤',
    stationery: '📚',
    personal: '🧴',
    pooja: '🪔',
  };
  return map[category] || '📦';
};
