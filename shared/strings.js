// GalliExpress — English Strings

export const strings = {
  // App name
  appName: 'GalliExpress',
  appNameEn: 'GalliExpress',
  tagline: 'Delivery to your street',
  taglineEn: 'Delivery to your street',

  // Auth
  enterPhone: 'Enter your phone number',
  enterPhoneEn: 'Enter your phone number',
  sendOTP: 'Send OTP',
  sendOTPEn: 'Send OTP',
  enterOTP: 'Enter OTP',
  enterOTPEn: 'Enter OTP',
  verify: 'Verify',
  verifyEn: 'Verify',
  resendOTP: 'Resend OTP',
  resendOTPEn: 'Resend OTP',

  // Home
  goodMorning: 'Good Morning',
  goodAfternoon: 'Good Afternoon',
  goodEvening: 'Good Evening',
  whatDoYouWant: 'What do you need?',
  searchPlaceholder: 'Search food, grocery...',
  searchPlaceholderEn: 'Search food, grocery...',
  featuredShops: 'Featured Shops',
  allShops: 'All Shops',
  nearYou: 'Near You',

  // Categories
  food: 'Food',
  grocery: 'Grocery',
  vegetables: 'Vegetables',
  fruits: 'Fruits',
  dairy: 'Dairy',
  meat: 'Meat & Fish',
  bakery: 'Bakery',
  sweets: 'Sweets',
  beverages: 'Beverages',
  stationery: 'Stationery',
  personal: 'Personal Care',
  pooja: 'Pooja Items',

  // Cart & Order
  addToCart: 'Add to Cart',
  cart: 'Cart',
  checkout: 'Checkout',
  placeOrder: 'Place Order',
  orderTotal: 'Total',
  deliveryFee: 'Delivery Fee',
  itemTotal: 'Item Total',
  discount: 'Discount',

  // Payment
  paymentMethod: 'Payment Method',
  upi: 'UPI',
  cod: 'Cash on Delivery',
  codFull: 'Cash on Delivery',

  // Order Status
  orderPlaced: 'Order Placed',
  orderConfirmed: 'Order Confirmed',
  preparing: 'Preparing',
  onTheWay: 'On the Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',

  // Partner
  incomingOrder: 'New Order',
  accept: 'Accept',
  reject: 'Reject',
  markReady: 'Mark Ready',
  todayEarnings: "Today's Earnings",
  totalOrders: 'Total Orders',
  myMenu: 'My Menu',
  addItem: 'Add Item',

  // Rider
  goOnline: 'Go Online',
  goOffline: 'Go Offline',
  newDelivery: 'New Delivery',
  pickupFrom: 'Pickup from',
  deliverTo: 'Deliver to',
  callCustomer: 'Call Customer',
  markDelivered: 'Mark Delivered',
  earnings: 'Earnings',

  // Common
  back: 'Back',
  confirm: 'Confirm',
  cancel: 'Cancel',
  save: 'Save',
  edit: 'Edit',
  delete: 'Delete',
  loading: 'Loading...',
  error: 'Something went wrong',
  retry: 'Try Again',
  noData: 'No data',
  yes: 'Yes',
  no: 'No',
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return strings.goodMorning;
  if (hour < 17) return strings.goodAfternoon;
  return strings.goodEvening;
};
