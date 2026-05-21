// GalliExpress — GalliCoins Service
// Awards and deducts coins from user's Firestore profile

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const COINS_PER_RUPEE = 1;       // 1 coin per ₹1 spent
const COINS_REDEEM_RATE = 10;    // 10 coins = ₹1 off
const MIN_REDEEM = 100;          // Minimum 100 coins to redeem
const REFERRAL_COINS = 50;       // Coins awarded for referral

/**
 * Award GalliCoins after order delivery
 * Called after order status becomes 'delivered'
 */
export async function awardCoinsForOrder(orderId, orderTotal) {
  const user = auth().currentUser;
  if (!user) return;

  const coins = Math.floor(orderTotal * COINS_PER_RUPEE);
  if (coins <= 0) return;

  try {
    const userRef = firestore().collection('users').doc(user.uid);
    await userRef.update({
      galliCoins: firestore.FieldValue.increment(coins),
      totalCoinsEarned: firestore.FieldValue.increment(coins),
    });

    // Log transaction
    await firestore().collection('coinTransactions').add({
      userId: user.uid,
      type: 'earn',
      coins,
      orderId,
      description: `Earned from order #${orderId}`,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    return coins;
  } catch (e) {
  }
}

/**
 * Redeem GalliCoins for discount
 * Returns the rupee discount amount
 */
export async function redeemCoins(coinsToRedeem) {
  const user = auth().currentUser;
  if (!user) return 0;

  if (coinsToRedeem < MIN_REDEEM) return 0;

  const discountRupees = Math.floor(coinsToRedeem / COINS_REDEEM_RATE);

  try {
    const userRef = firestore().collection('users').doc(user.uid);
    const snap = await userRef.get();
    const currentCoins = snap.data()?.galliCoins || 0;

    if (currentCoins < coinsToRedeem) {
      throw new Error('Insufficient coins');
    }

    await userRef.update({
      galliCoins: firestore.FieldValue.increment(-coinsToRedeem),
    });

    await firestore().collection('coinTransactions').add({
      userId: user.uid,
      type: 'redeem',
      coins: -coinsToRedeem,
      discountRupees,
      description: `Redeemed ${coinsToRedeem} coins for ₹${discountRupees} off`,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    return discountRupees;
  } catch (e) {
    return 0;
  }
}

/**
 * Award referral coins to referrer when referred user places first order
 */
export async function awardReferralCoins(referrerId, referredUserId) {
  if (!referrerId) return;
  try {
    const referrerRef = firestore().collection('users').doc(referrerId);
    await referrerRef.update({
      galliCoins: firestore.FieldValue.increment(REFERRAL_COINS),
      totalCoinsEarned: firestore.FieldValue.increment(REFERRAL_COINS),
    });

    await firestore().collection('coinTransactions').add({
      userId: referrerId,
      type: 'referral',
      coins: REFERRAL_COINS,
      referredUserId,
      description: `Referral bonus — friend placed first order`,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
  }
}

/**
 * Get user's current coin balance
 */
export async function getCoinBalance() {
  const user = auth().currentUser;
  if (!user) return 0;
  try {
    const snap = await firestore().collection('users').doc(user.uid).get();
    return snap.data()?.galliCoins || 0;
  } catch {
    return 0;
  }
}

export const coinsToRupees = (coins) => Math.floor(coins / COINS_REDEEM_RATE);
export const rupeesToCoins = (rupees) => rupees * COINS_PER_RUPEE;
export { MIN_REDEEM, REFERRAL_COINS };
