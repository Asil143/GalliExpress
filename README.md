<h1 align="center">
  <br>
  🛵 GalliExpress
  <br>
</h1>

<h3 align="center">Hyperlocal food delivery built for Tier-3 India.</h3>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-Expo-0070f3?style=flat-square&logo=expo" />
  <img src="https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-f5820d?style=flat-square&logo=firebase" />
  <img src="https://img.shields.io/badge/Language-Telugu_%2F_English-blueviolet?style=flat-square" />
  <img src="https://img.shields.io/badge/Apps-3_in_1-black?style=flat-square" />
  <img src="https://img.shields.io/badge/Region-Andhra_Pradesh-green?style=flat-square" />
</p>

<p align="center">
  Swiggy and Zomato don't reach Addanki. GalliExpress does.
  <br>
  Built for the towns, in the language of the towns.
</p>

---

## What is GalliExpress?

GalliExpress is a 3-sided hyperlocal delivery marketplace for Tier-3 towns in Andhra Pradesh. It connects local restaurants and kirana shops with customers and delivery riders — all through native Telugu + English apps.

The name "Galli" (గల్లీ) means street or lane in Telugu. This platform is built for delivery right to your galli.

**Three complete React Native apps in one repo:**

| App | Who it's for | Key Features |
|-----|-------------|--------------|
| **Customer App** | People ordering | Browse shops, cart, OTP checkout, live tracking |
| **Partner App** | Shop / restaurant owners | Order management, menu editor, earnings dashboard |
| **Rider App** | Delivery partners | Accept deliveries, navigation, payout tracking |

---

## Features

### 🛒 Customer App
- Browse local shops by category (food, grocery, vegetables)
- Live shop status (open/closed, prep time)
- Cart with GalliCoins loyalty rewards
- OTP-based checkout (no password needed)
- Real-time order tracking
- Order history and reorder
- Address management with location picker
- Rate & review orders
- In-app help and support

### 🏪 Partner App
- Real-time incoming orders with accept/reject
- Menu management (add/edit/remove items with photos)
- Shop settings (hours, delivery radius, min order)
- Earnings breakdown (daily/weekly/monthly)
- Push notifications for new orders
- Shop onboarding flow

### 🏍️ Rider App
- Available order feed with distance and payout
- Active delivery with navigation
- Delivery confirmation (OTP or photo)
- Earnings history
- Rider profile and documents

### 🌐 Shared Infrastructure
- Telugu + English throughout (full bilingual UI)
- Firebase Phone Auth (OTP — no passwords)
- Real-time Firestore for order state machine
- Firebase Cloud Messaging (push notifications)
- Shared theme, strings, and utility layer across all 3 apps

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native + Expo |
| Navigation | React Navigation 6 (Stack + Bottom Tabs) |
| Backend | Firebase (Auth + Firestore + Storage + FCM) |
| Real-time | Firestore `onSnapshot` listeners |
| Location | Expo Location + Google Places Autocomplete |
| Maps | React Native Maps |
| Payments | COD + UPI via Razorpay (configured) |
| Notifications | Firebase Cloud Messaging |
| Build | EAS Build (Expo Application Services) |
| Auth | Firebase Phone Auth (OTP) |

---

## Project Structure

```
GalliExpress/
├── shared/
│   ├── theme.js           ← Colors, typography, spacing
│   ├── strings.js         ← All UI text in Telugu + English
│   ├── utils.js           ← Formatting, delivery fee calculator
│   └── addressData.js     ← Town/district data for AP
│
├── customer-app/
│   └── src/
│       ├── screens/
│       │   ├── home/      ← Shop feed, categories
│       │   ├── shop/      ← Shop detail, menu
│       │   ├── cart/      ← Cart management
│       │   ├── checkout/  ← Address, payment
│       │   ├── tracking/  ← Live order tracking
│       │   ├── profile/   ← Orders, addresses, settings
│       │   ├── search/    ← Search shops and items
│       │   └── rating/    ← Post-delivery rating
│       ├── context/
│       │   └── CartContext.js   ← Global cart state
│       └── services/
│           ├── GalliCoinsService.js    ← Loyalty points logic
│           └── NotificationService.js ← FCM handler
│
├── partner-app/
│   └── src/
│       ├── screens/
│       │   ├── dashboard/ ← Orders overview, stats
│       │   ├── orders/    ← Incoming + active orders
│       │   ├── menu/      ← Menu management
│       │   └── earnings/  ← Revenue breakdown
│       └── context/
│           └── ShopContext.js   ← Shop state management
│
├── rider-app/
│   └── src/
│       ├── screens/
│       │   ├── home/      ← Available deliveries
│       │   ├── delivery/  ← Active delivery + navigation
│       │   ├── earnings/  ← Payout history
│       │   └── profile/   ← Rider profile + docs
│
├── FIREBASE_SCHEMA.js     ← Firestore collections + security rules
├── firestore.rules        ← Production security rules
├── storage.rules          ← Firebase Storage rules
└── legal/
    ├── terms.html
    └── privacy.html
```

---

## Delivery Fee Model

```js
// Free above ₹300, tiered below
if (subtotal >= 300) → ₹0
if (subtotal >= 150) → ₹20
else                 → ₹30
```

Rider payout: **₹30 per delivery** (configured in rider-app).

Commission rates by category:
- Food restaurants: 12–15%
- Grocery / Kirana: 8–10%
- Self-delivery shops: 5–7%

---

## Getting Started

### 1. Firebase Setup

Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com), then enable:
- **Phone Authentication**
- **Firestore Database** (region: `asia-south1`)
- **Firebase Storage**
- **Cloud Messaging**

Copy your config into `shared/firebase.js`.

### 2. Install Dependencies

```bash
# Run in each app folder
cd customer-app && npm install
cd ../partner-app && npm install
cd ../rider-app && npm install
```

### 3. Run

```bash
cd customer-app
npx expo start --android
```

Press `a` for Android emulator, or scan QR code with Expo Go on a physical device.

### 4. Build APK

```bash
npm install -g eas-cli
eas login
# In each app folder:
eas build --platform android --profile preview
```

---

## Why Tier-3?

Swiggy and Zomato operate in 500+ cities — but India has 640,000 villages and thousands of small towns. Addanki (population ~50,000) has active local restaurants with no digital presence.

GalliExpress is built for exactly these towns:
- OTP auth (no email required — most users prefer phone)
- Telugu UI (not everyone is comfortable in English)
- Low data mode (images are optimized, Firestore reads are minimal)
- COD support (UPI adoption is growing, but cash is still king in rural AP)

---

## License

MIT

---

<p align="center">
  <strong>మీ గల్లికి డెలివరీ 🛵</strong>
  <br>
  <em>Delivery to your street.</em>
</p>
