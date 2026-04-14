// GalliExpress — Telugu & English Strings
// All UI text in Telugu with English fallback

export const strings = {
  // App name
  appName: 'గల్లి ఎక్స్‌ప్రెస్',
  appNameEn: 'GalliExpress',
  tagline: 'మీ గల్లికి డెలివరీ',         // Delivery to your street
  taglineEn: 'Delivery to your street',

  // Auth
  enterPhone: 'మీ ఫోన్ నంబర్ నమోదు చేయండి',
  enterPhoneEn: 'Enter your phone number',
  sendOTP: 'OTP పంపండి',
  sendOTPEn: 'Send OTP',
  enterOTP: 'OTP నమోదు చేయండి',
  enterOTPEn: 'Enter OTP',
  verify: 'ధృవీకరించండి',
  verifyEn: 'Verify',
  resendOTP: 'OTP మళ్ళీ పంపండి',
  resendOTPEn: 'Resend OTP',

  // Home
  goodMorning: 'శుభోదయం',
  goodAfternoon: 'శుభ మధ్యాహ్నం',
  goodEvening: 'శుభ సాయంత్రం',
  whatDoYouWant: 'ఏమి కావాలి?',
  searchPlaceholder: 'ఆహారం, కిరాణా వెతకండి...',
  searchPlaceholderEn: 'Search food, grocery...',
  featuredShops: 'ప్రముఖ షాపులు',
  allShops: 'అన్ని షాపులు',
  nearYou: 'మీ దగ్గర',

  // Categories
  food: 'ఆహారం',
  grocery: 'కిరాణా',
  vegetables: 'కూరగాయలు',
  fruits: 'పండ్లు',
  dairy: 'పాల పదార్థాలు',
  meat: 'మాంసం & చేప',
  bakery: 'బేకరీ',
  sweets: 'మిఠాయిలు',
  beverages: 'పానీయాలు',
  stationery: 'స్టేషనరీ',
  personal: 'వ్యక్తిగత',
  pooja: 'పూజా సామాను',

  // Cart & Order
  addToCart: 'కార్ట్‌కి జోడించు',
  cart: 'కార్ట్',
  checkout: 'చెక్అవుట్',
  placeOrder: 'ఆర్డర్ చేయండి',
  orderTotal: 'మొత్తం',
  deliveryFee: 'డెలివరీ చార్జ్',
  itemTotal: 'వస్తువుల మొత్తం',
  discount: 'డిస్కౌంట్',

  // Payment
  paymentMethod: 'చెల్లింపు పద్ధతి',
  upi: 'UPI',
  cod: 'నగదు డెలివరీ వద్ద',
  codFull: 'Cash on Delivery',

  // Order Status
  orderPlaced: 'ఆర్డర్ చేశారు',
  orderConfirmed: 'ఆర్డర్ నిర్ధారించబడింది',
  preparing: 'తయారు చేస్తున్నారు',
  onTheWay: 'దారిలో ఉంది',
  delivered: 'డెలివర్ అయింది',
  cancelled: 'రద్దు అయింది',

  // Partner
  incomingOrder: 'కొత్త ఆర్డర్',
  accept: 'అంగీకరించు',
  reject: 'తిరస్కరించు',
  markReady: 'రెడీ అని మార్కు చేయి',
  todayEarnings: 'ఈరోజు సంపాదన',
  totalOrders: 'మొత్తం ఆర్డర్లు',
  myMenu: 'నా మెనూ',
  addItem: 'వస్తువు జోడించు',

  // Rider
  goOnline: 'ఆన్‌లైన్ అవ్వు',
  goOffline: 'ఆఫ్‌లైన్ అవ్వు',
  newDelivery: 'కొత్త డెలివరీ',
  pickupFrom: 'ఇక్కడ నుండి తీసుకో',
  deliverTo: 'ఇక్కడ డెలివర్ చేయి',
  callCustomer: 'కస్టమర్‌కి కాల్ చేయి',
  markDelivered: 'డెలివర్ అయింది అని మార్కు చేయి',
  earnings: 'సంపాదన',

  // Common
  back: 'వెనక్కి',
  confirm: 'నిర్ధారించు',
  cancel: 'రద్దు',
  save: 'సేవ్ చేయి',
  edit: 'మార్చు',
  delete: 'తొలగించు',
  loading: 'లోడ్ అవుతోంది...',
  error: 'తప్పు జరిగింది',
  retry: 'మళ్ళీ ప్రయత్నించు',
  noData: 'డేటా లేదు',
  yes: 'అవును',
  no: 'కాదు',
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return strings.goodMorning;
  if (hour < 17) return strings.goodAfternoon;
  return strings.goodEvening;
};
