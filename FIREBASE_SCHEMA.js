// ═══════════════════════════════════════════════════════════════════
// GalliExpress — Firebase Firestore Schema & Security Rules
// ═══════════════════════════════════════════════════════════════════

// ─── COLLECTION: users ────────────────────────────────────────────
// Document ID = Firebase Auth UID
{
  uid: "string",
  name: "string",
  phone: "+91XXXXXXXXXX",
  email: "string (optional)",
  profilePhoto: "url (optional)",
  defaultAddress: {
    line1: "string",
    landmark: "string",
    town: "addanki"
  },
  savedAddresses: [],
  galliPassActive: false,
  galliPassExpiry: null,
  totalOrders: 0,
  totalSavings: 0,
  createdAt: "timestamp",
  updatedAt: "timestamp"
}

// ─── COLLECTION: partners ─────────────────────────────────────────
// Document ID = Firebase Auth UID
{
  uid: "string",
  shopName: "string",
  ownerName: "string",
  phone: "+91XXXXXXXXXX",
  category: "ఆహారం | కిరాణా | బేకరీ ...",
  description: "string",
  address: "string",
  town: "addanki",
  isOpen: true,
  isActive: true,
  isFeatured: false,
  isVerified: false,
  minOrder: 50,
  deliveryTime: "25-30",
  rating: 4.2,
  totalOrders: 0,
  commissionRate: 0.12,
  bankDetails: {
    accountNumber: "string",
    ifscCode: "string",
    upiId: "string"
  },
  createdAt: "timestamp",
  updatedAt: "timestamp"
}

// ─── COLLECTION: riders ───────────────────────────────────────────
// Document ID = Firebase Auth UID
{
  uid: "string",
  name: "string",
  phone: "+91XXXXXXXXXX",
  profilePhoto: "url",
  isOnline: false,
  isActive: true,
  isVerified: false,
  town: "addanki",
  currentLocation: {
    latitude: 15.8289,
    longitude: 80.0207
  },
  vehicleType: "bike | scooter",
  vehicleNumber: "AP XX XX XXXX",
  licenseNumber: "string",
  rating: 5.0,
  totalDeliveries: 0,
  totalEarnings: 0,
  bankDetails: {
    upiId: "string",
    accountNumber: "string"
  },
  createdAt: "timestamp",
  updatedAt: "timestamp"
}

// ─── COLLECTION: shops ────────────────────────────────────────────
// Public-facing shop data (denormalized from partners for fast reads)
// Document ID = same as partners UID
{
  id: "string",
  name: "string",
  category: "string",
  description: "string",
  address: "string",
  town: "addanki",
  isOpen: true,
  isActive: true,
  isFeatured: false,
  rating: 4.2,
  totalOrders: 0,
  minOrder: 50,
  deliveryTime: "25-30",
  image: "url (optional)",
  createdAt: "timestamp"
}

// ─── COLLECTION: menuItems ────────────────────────────────────────
// Document ID = auto-generated
{
  id: "string",
  shopId: "partnerUID",
  name: "string",
  description: "string",
  price: 80,
  category: "ఆహారం | కిరాణా ...",
  subCategory: "string (optional)",
  image: "url (optional)",
  isAvailable: true,
  isVeg: true,
  isBestseller: false,
  createdAt: "timestamp",
  updatedAt: "timestamp"
}

// ─── COLLECTION: orders ───────────────────────────────────────────
// Document ID = orderId (GE + timestamp + random)
{
  orderId: "GEXXXXX",
  customerId: "userUID",
  customerPhone: "+91XXXXXXXXXX",
  shopId: "partnerUID",
  shopName: "string",
  shopPhone: "+91XXXXXXXXXX",
  riderId: null,  // assigned when rider accepts
  riderLocation: { latitude: 0, longitude: 0 },  // updated live
  items: [
    {
      id: "menuItemId",
      name: "string",
      price: 80,
      quantity: 2
    }
  ],
  address: {
    line1: "string",
    landmark: "string"
  },
  paymentMethod: "cod | upi",
  isPaid: false,
  subtotal: 160,
  deliveryFee: 30,
  discount: 0,
  total: 190,
  status: "pending | confirmed | preparing | ready | on_the_way | delivered | cancelled",
  town: "addanki",
  rating: null,
  review: null,
  createdAt: "timestamp",
  updatedAt: "timestamp",
  deliveredAt: null
}

// ─── COLLECTION: categories ───────────────────────────────────────
// Pre-populated, managed by admin
{
  id: "food",
  nameTeluguU: "ఆహారం",
  nameEn: "Food",
  emoji: "🍱",
  isActive: true,
  sortOrder: 1
}

// ─── COLLECTION: notifications ────────────────────────────────────
{
  userId: "string",
  userType: "customer | partner | rider",
  title: "string",
  body: "string",
  data: { orderId: "string" },
  isRead: false,
  createdAt: "timestamp"
}

// ═══════════════════════════════════════════════════════════════════
// FIRESTORE SECURITY RULES
// Paste this in Firebase Console → Firestore → Rules
// ═══════════════════════════════════════════════════════════════════

/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Partners can only read/write their own profile
    match /partners/{partnerId} {
      allow read, write: if request.auth != null && request.auth.uid == partnerId;
    }

    // Riders can only read/write their own profile
    match /riders/{riderId} {
      allow read, write: if request.auth != null && request.auth.uid == riderId;
    }

    // Shops are public read, partner can write their own
    match /shops/{shopId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == shopId;
    }

    // Menu items - public read, partner writes their own
    match /menuItems/{itemId} {
      allow read: if true;
      allow write: if request.auth != null &&
        (request.auth.uid == resource.data.shopId ||
         request.auth.uid == request.resource.data.shopId);
    }

    // Orders - complex rules
    match /orders/{orderId} {
      // Customer can read their own orders
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.customerId ||
         request.auth.uid == resource.data.shopId ||
         request.auth.uid == resource.data.riderId);

      // Only authenticated users can create orders
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.customerId;

      // Partner can update status of their orders
      // Rider can update riderId and status
      allow update: if request.auth != null;
    }

    // Categories are public read only
    match /categories/{catId} {
      allow read: if true;
      allow write: if false; // Admin only via Firebase Console
    }
  }
}
*/
