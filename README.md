<h1 align="center">GalliExpress</h1>

<p align="center">
  <strong>Hyperlocal delivery for Tier-3 India. Built for the towns Swiggy and Zomato don't reach.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android_(React_Native)-black?style=flat-square&logo=android" />
  <img src="https://img.shields.io/badge/Backend-Firebase_(Auth_%2B_Firestore_%2B_FCM)-f5820d?style=flat-square&logo=firebase" />
  <img src="https://img.shields.io/badge/Language-Telugu_%2F_English-blueviolet?style=flat-square" />
  <img src="https://img.shields.io/badge/Apps-3_(Customer_%2B_Partner_%2B_Rider)-0070f3?style=flat-square" />
  <img src="https://img.shields.io/badge/Status-Under_Active_Development-orange?style=flat-square" />
</p>

---

## The Problem

India has **640,000 villages** and thousands of Tier-3 towns. Swiggy operates in ~580 cities. Zomato in ~800.

That leaves hundreds of millions of people — working in local restaurants, ordering from kirana shops, delivering goods on bikes — with no digital delivery infrastructure at all.

Addanki (అడ్డంకి), Andhra Pradesh. Population: ~50,000. Active local restaurants, grocery stores, vegetable vendors, bakeries. No delivery app. Customers can't order from their phone. Shops can't go digital. Riders have no platform to earn on.

That's the gap GalliExpress is built to fill.

---

## What GalliExpress Does

GalliExpress is a 3-sided delivery marketplace — three separate apps, one platform, built specifically for Tier-3 Andhra Pradesh towns.

The name comes from **గల్లీ (galli)** — the Telugu word for street or lane. *"Delivery to your street."*

---

## Three Apps, One Platform

### Customer App
What a person in Addanki actually needs to order food or groceries:

- Browse shops by category (food, grocery, vegetables, fruits, dairy, bakery, sweets, beverages, stationery, personal care, **pooja items**)
- Time-aware greeting (Good Morning / Good Afternoon / Good Evening) based on device time
- Live shop status (open/closed, estimated prep time, minimum order)
- Add to cart with GalliCoins loyalty rewards
- Checkout with **OTP only** — no passwords, no email required
- UPI and Cash on Delivery payment options
- Real-time order tracking (Order Placed → Confirmed → Preparing → On the Way → Delivered)
- Order history and one-tap reorder
- Address management with local town selector
- Rate and review after delivery
- In-app help and support

**The "Pooja Items" category** is not in Swiggy. It's there because that's what people in Andhra Pradesh actually buy. Every category decision was made based on what local shops actually sell.

### Partner App
For local shop owners and restaurant owners:

- Real-time incoming orders with Accept/Reject
- Tap to mark order ready for pickup
- Full menu management — add items with photos, edit prices, pause items
- Shop settings: hours, minimum order, delivery radius
- Earnings dashboard (daily/weekly/monthly breakdown)
- Shop onboarding flow for new partners
- Push notifications for every new order

### Rider App
For delivery partners on bikes and scooters:

- Available deliveries feed with distance, payout, and estimated time
- Accept delivery → navigate to shop → pick up → navigate to customer → confirm delivery
- Delivery confirmation by OTP or photo
- Earnings history and daily total
- Online/Offline toggle
- Vehicle and license verification during onboarding
- UPI bank details for direct payouts

---

## Why It's Built the Way It Is

Every technical decision maps to a real constraint in Tier-3 India:

| Decision | Why |
|----------|-----|
| **OTP-only auth (no email)** | Most users prefer phone. Many don't regularly use email. |
| **Telugu + English UI** | Not everyone is comfortable in English. Local language = trust. |
| **COD payment option** | UPI adoption is growing but cash is still the dominant payment mode in rural AP. |
| **No minimum order** | Local kirana shops have low average order values. A ₹50 minimum would exclude real orders. |
| **Pooja items category** | That's what local shops sell. The platform serves the actual market, not a hypothetical one. |
| **Addanki GPS coordinates hardcoded** | `15.8289° N, 80.0207° E` — this app was built for one specific town first. Expand from there. |
| **GalliPassActive field in user schema** | Subscription service planned. Build the data model before the feature. |

---

## Data Model

Three verified participant types, each with their own Firestore collection:

```
users        → OTP phone auth, saved addresses, GalliCoins, order history
partners     → shop profile, category (in Telugu), bank details (IFSC/UPI), commission rate
riders       → vehicle details, license number, GPS location, earnings, online status
orders       → order lifecycle (6 statuses), items, amounts, delivery fee, rider assignment
categories   → shop categories (stored in Telugu: ఆహారం, కిరాణా, కూరగాయలు...)
```

Security rules enforced: customers read their own data, partners read their own orders, riders see only unassigned deliveries in their town.

---

## Business Model

**Commission rates:**
- Food restaurants: 12–15%
- Grocery / Kirana: 8–10%
- Self-delivery shops (partner uses own rider): 5–7%

**Delivery fee:**
- Above ₹300 order → ₹0 (free delivery)
- ₹150–₹299 → ₹20
- Below ₹150 → ₹30

**Rider payout:** ₹30 per completed delivery, direct UPI transfer.

**GalliPass (planned):** Monthly subscription for customers — free delivery on all orders, priority support, exclusive deals. The `galliPassActive` and `galliPassExpiry` fields are already in the user schema.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native + Expo |
| Navigation | React Navigation 6 (Stack + Bottom Tabs) |
| Auth | Firebase Phone Authentication (OTP) |
| Database | Firebase Firestore (real-time `onSnapshot`) |
| Storage | Firebase Storage (shop photos, menu images) |
| Push Notifications | Firebase Cloud Messaging |
| Location | Expo Location + Google Places Autocomplete |
| Maps | React Native Maps |
| Payments | UPI + COD (Razorpay integration planned) |
| Build | EAS Build (Expo Application Services) |

---

## Project Structure

```
GalliExpress/
├── shared/                         ← Used by all 3 apps
│   ├── theme.js                    ← Colors, fonts, spacing
│   ├── strings.js                  ← All UI text (English + Telugu)
│   ├── utils.js                    ← Delivery fee calc, formatters
│   └── addressData.js              ← Towns and districts in AP
│
├── customer-app/src/screens/
│   ├── home/         ← Shop feed, categories, search
│   ├── shop/         ← Shop detail, menu browsing
│   ├── cart/         ← Cart management + GalliCoins
│   ├── checkout/     ← Address, payment method
│   ├── tracking/     ← Live order status
│   ├── profile/      ← Orders, addresses, settings
│   ├── rating/       ← Post-delivery rating
│   └── support/      ← Help and contact
│
├── partner-app/src/screens/
│   ├── dashboard/    ← Order overview, today's stats
│   ├── orders/       ← Incoming + active orders (real-time)
│   ├── menu/         ← Menu management
│   ├── earnings/     ← Revenue breakdown
│   └── onboarding/   ← Shop setup wizard
│
├── rider-app/src/screens/
│   ├── home/         ← Available deliveries
│   ├── delivery/     ← Active delivery + navigation
│   ├── earnings/     ← Payout history
│   └── profile/      ← Rider docs, vehicle info
│
├── FIREBASE_SCHEMA.js             ← Full Firestore schema + security rules
├── firestore.rules                ← Production security rules
├── storage.rules                  ← Firebase Storage rules
└── legal/
    ├── terms.html
    └── privacy.html
```

---

## Getting Started

### 1. Firebase Setup
Create a project at [console.firebase.google.com](https://console.firebase.google.com). Enable:
- **Phone Authentication**
- **Firestore** (region: `asia-south1` for lowest latency in AP)
- **Storage**
- **Cloud Messaging**

Copy your config into `shared/firebase.js`.

### 2. Install

```bash
cd customer-app && npm install
cd ../partner-app && npm install
cd ../rider-app && npm install
```

### 3. Run

```bash
cd customer-app
npx expo start --android
```

### 4. Build APK

```bash
npm install -g eas-cli && eas login
eas build --platform android --profile preview
```

---

## What's Coming

- [ ] Full Telugu UI (current strings file is English; Telugu strings labeled `teluguU` in schema)
- [ ] WhatsApp order confirmation (Wati.io or Twilio)
- [ ] Razorpay UPI integration (live payments)
- [ ] GalliPass subscription
- [ ] Multi-town expansion (Narasaraopet, Ongole, Chirala)
- [ ] Admin panel for monitoring orders and payouts
- [ ] Rider GPS tracking on customer tracking screen
- [ ] Weekly earnings payout automation

---

## Why This Matters

India's digital economy is growing fast — but growth is concentrated in Tier-1 and Tier-2 cities. The infrastructure gap in Tier-3 towns and rural areas is massive. Local businesses in these towns have no way to go digital. Riders have no platform to earn. Customers have to physically walk to shops.

GalliExpress starts with Addanki because that's what we know. The same model works for any Tier-3 town in Andhra Pradesh, Telangana, and beyond. The platform is designed to expand town-by-town — not flood the market with a half-built product.

Local. Specific. Real.

---

## License

MIT

---

<p align="center">
  <strong>మీ గల్లికి డెలివరీ</strong> · Delivery to your street
</p>
