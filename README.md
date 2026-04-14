# 🛵 GalliExpress — Complete Setup Guide

**Delivery platform for Tier 3 towns in Andhra Pradesh**
Built with React Native (Expo) + Firebase

---

## 📁 Project Structure

```
GalliExpress/
├── shared/                    ← Shared across all 3 apps
│   ├── theme.js               ← Colors, fonts, spacing
│   ├── strings.js             ← Telugu + English UI strings
│   ├── utils.js               ← Formatting, validation helpers
│   └── firebase.js            ← Firebase config (fill YOUR credentials)
│
├── customer-app/              ← Customer ordering app
│   ├── App.js
│   ├── package.json
│   └── src/
│       ├── navigation/        ← AppNavigator, AuthNavigator
│       ├── screens/
│       │   ├── SplashScreen.js
│       │   ├── auth/          ← LoginScreen, OTPScreen
│       │   ├── home/          ← HomeScreen
│       │   ├── shop/          ← ShopListScreen, ShopDetailScreen
│       │   ├── cart/          ← CartScreen
│       │   ├── checkout/      ← CheckoutScreen
│       │   ├── tracking/      ← OrderTrackingScreen
│       │   └── profile/       ← ProfileScreen, OrderHistoryScreen
│       └── components/        ← ShopCard, CategoryButton
│
├── partner-app/               ← Shop owner app
│   ├── App.js
│   ├── package.json
│   └── src/
│       ├── navigation/        ← AppNavigator, AuthNavigator
│       └── screens/
│           ├── SplashScreen.js
│           ├── auth/          ← LoginScreen, OTPScreen
│           ├── dashboard/     ← DashboardScreen, ShopSettingsScreen
│           ├── orders/        ← IncomingOrdersScreen, OrderDetailScreen
│           ├── menu/          ← MenuScreen, AddItemScreen
│           └── earnings/      ← EarningsScreen
│
├── rider-app/                 ← Rider delivery app
│   ├── App.js
│   ├── package.json
│   └── src/
│       ├── navigation/        ← AppNavigator, AuthNavigator
│       └── screens/
│           ├── SplashScreen.js
│           ├── auth/          ← LoginScreen, OTPScreen
│           ├── home/          ← RiderHomeScreen
│           ├── delivery/      ← ActiveDeliveryScreen
│           ├── earnings/      ← EarningsScreen
│           └── profile/       ← RiderProfileScreen
│
├── FIREBASE_SCHEMA.js         ← Firestore collections + security rules
└── README.md                  ← This file
```

---

## ⚙️ Step 1 — Firebase Setup

### 1.1 Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Name it: `galliexpress`
4. Enable Google Analytics (optional)

### 1.2 Enable Authentication
1. Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Phone** authentication
3. Add test phone numbers for development if needed

### 1.3 Enable Firestore
1. Firebase Console → **Firestore Database**
2. Click **"Create database"**
3. Start in **production mode**
4. Location: `asia-south1` (Mumbai — closest to Andhra Pradesh)
5. Paste security rules from `FIREBASE_SCHEMA.js`

### 1.4 Enable Storage
1. Firebase Console → **Storage**
2. Click **"Get started"**
3. Location: `asia-south1`

### 1.5 Get Config Credentials
1. Firebase Console → **Project Settings** → **General**
2. Scroll to **"Your apps"** → Add Android app
3. Package name for each app:
   - Customer: `com.galliexpress.customer`
   - Partner: `com.galliexpress.partner`
   - Rider: `com.galliexpress.rider`
4. Download `google-services.json` for each app
5. Place each `google-services.json` in the respective app's `android/app/` folder

### 1.6 Fill Firebase Config
Open `shared/firebase.js` and replace the placeholder values:
```js
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "galliexpress.firebaseapp.com",
  projectId: "galliexpress",
  storageBucket: "galliexpress.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

---

## 📦 Step 2 — Install Dependencies

Run this in each app folder separately:

```bash
# Customer App
cd customer-app
npm install

# Partner App
cd ../partner-app
npm install

# Rider App
cd ../rider-app
npm install
```

---

## 🚀 Step 3 — Run the Apps

### Run on Android device/emulator:
```bash
# Customer App
cd customer-app
npx expo start --android

# Partner App
cd partner-app
npx expo start --android

# Rider App
cd rider-app
npx expo start --android
```

### For physical Android device:
1. Enable **Developer Options** on phone
2. Enable **USB Debugging**
3. Connect via USB
4. Run `npx expo start --android`

---

## 🏗️ Step 4 — Build APK for Testing

Install EAS CLI first:
```bash
npm install -g eas-cli
eas login
```

Build APK for each app:
```bash
# In each app folder:
eas build --platform android --profile preview
```

This generates a `.apk` file you can install directly on Android phones.

---

## 🗄️ Step 5 — Seed Initial Data

After setup, manually add this data in Firebase Console:

### Add Categories:
Go to Firestore → `categories` collection → Add documents:
```
food: { nameTeluguU: "ఆహారం", emoji: "🍱", isActive: true, sortOrder: 1 }
grocery: { nameTeluguU: "కిరాణా", emoji: "🛒", isActive: true, sortOrder: 2 }
vegetables: { nameTeluguU: "కూరగాయలు", emoji: "🥦", isActive: true, sortOrder: 3 }
```

### Add Your First Test Shop:
Go to Firestore → `shops` collection → Add document:
```
{
  name: "టెస్ట్ హోటల్",
  category: "ఆహారం",
  town: "addanki",
  isOpen: true,
  isActive: true,
  rating: 4.5,
  minOrder: 50,
  deliveryTime: "25-30"
}
```

---

## 📱 Step 6 — App Store Publishing

### Google Play Store (₹1,750 one-time fee):
1. Create Google Play Developer account
2. Build release APK: `eas build --platform android --profile production`
3. Upload to Play Console
4. Fill store listing (Telugu + English description)
5. Submit for review

### Separate listings needed:
- GalliExpress — Customer App
- GalliExpress Partner — Shop Owner App
- GalliExpress Rider — Delivery Partner App

---

## 💰 Revenue Configuration

### Commission rates (set in Firestore):
- Food restaurants: 12–15%
- Grocery / Kirana: 8–10%
- Self-delivery shops: 5–7%

### Delivery fees (configured in `shared/utils.js`):
```js
export const getDeliveryFee = (subtotal) => {
  if (subtotal >= 300) return 0;   // Free above ₹300
  if (subtotal >= 150) return 20;  // ₹20 for ₹150-₹299
  return 30;                       // ₹30 below ₹150
};
```

### Rider payout (configured in rider-app):
```js
const DELIVERY_FEE_PER_ORDER = 30; // ₹30 per delivery to rider
```

---

## 🔔 Push Notifications Setup

1. Firebase Console → **Cloud Messaging**
2. In each app's `App.js`, add FCM token registration
3. Store FCM token in user's Firestore document
4. Use Firebase Cloud Functions to send notifications on order status change

---

## 🌐 WhatsApp Business (Next Step)

After apps are ready:
1. Apply for **WhatsApp Business API** at business.whatsapp.com
2. Use **Twilio** or **Wati.io** for easy WhatsApp API integration
3. Build order flow via WhatsApp chatbot

---

## 🛠️ Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React Native + Expo |
| Navigation | React Navigation 6 |
| Backend | Firebase (Auth + Firestore + Storage) |
| Real-time | Firestore onSnapshot listeners |
| Maps | React Native Maps + Google Maps |
| Payments | Razorpay (COD + UPI) |
| Notifications | Firebase Cloud Messaging |
| Build | EAS Build (Expo) |
| Language | Telugu + English |

---

## 📞 Support

Built for: **Addanki, Ballikurava Mandal, Prakasam District, Andhra Pradesh**

GalliExpress — మీ గల్లికి డెలివరీ 🛵
