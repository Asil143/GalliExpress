// GalliExpress Customer — Notification Service
// Handles FCM push notifications via @react-native-firebase/messaging

import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Alert, Linking } from 'react-native';

// ── Permission ─────────────────────────────────────────────────────────────────
export async function requestNotificationPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  return enabled;
}

// ── Token Registration ─────────────────────────────────────────────────────────
export async function registerFCMToken() {
  try {
    const token = await messaging().getToken();
    const user = auth().currentUser;
    if (token && user) {
      await firestore().collection('users').doc(user.uid).update({
        fcmToken: token,
        fcmUpdatedAt: firestore.FieldValue.serverTimestamp(),
        platform: 'android',
      });
    }
    return token;
  } catch (e) {
    return null;
  }
}

// ── Notification Message Handlers ─────────────────────────────────────────────

// Called when app is in FOREGROUND and notification arrives
export function setupForegroundHandler(navigationRef) {
  return messaging().onMessage(async (remoteMessage) => {
    const { notification, data } = remoteMessage;
    if (!notification) return;

    Alert.alert(
      notification.title || 'GalliExpress',
      notification.body || '',
      [
        { text: 'Dismiss', style: 'cancel' },
        ...(data?.orderId
          ? [{
              text: 'View Order',
              onPress: () => {
                if (navigationRef?.current) {
                  navigationRef.current.navigate('OrderTracking', {
                    orderId: data.orderId,
                    order: { orderId: data.orderId },
                  });
                }
              },
            }]
          : []),
      ]
    );
  });
}

// Called when app is in BACKGROUND and user taps notification
export function setupBackgroundTapHandler(navigationRef) {
  messaging().onNotificationOpenedApp((remoteMessage) => {
    handleNotificationNavigation(remoteMessage, navigationRef);
  });
}

// Called when app is KILLED and opened via notification tap
export async function checkInitialNotification(navigationRef) {
  const remoteMessage = await messaging().getInitialNotification();
  if (remoteMessage) {
    // Delay to let navigation fully mount
    setTimeout(() => {
      handleNotificationNavigation(remoteMessage, navigationRef);
    }, 500);
  }
}

// ── Navigation helper ──────────────────────────────────────────────────────────
function handleNotificationNavigation(remoteMessage, navigationRef) {
  const { data } = remoteMessage || {};
  if (!data || !navigationRef?.current) return;

  if (data.type === 'order_update' && data.orderId) {
    navigationRef.current.navigate('OrderTracking', {
      orderId: data.orderId,
      order: { orderId: data.orderId },
    });
  } else if (data.type === 'flash_sale') {
    navigationRef.current.navigate('Tabs', { screen: 'HomeTab' });
  }
}

// ── Background Message Handler (register OUTSIDE component) ───────────────────
// This must be called at the module level in index.js or App.js
export function registerBackgroundHandler() {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    // Notification is automatically displayed by Firebase when app is in background
    // No additional handling needed here unless you want to process data silently
  });
}

// ── Utility: Send Notification via Firestore trigger ──────────────────────────
// Partner/Rider apps update order status → Cloud Function sends FCM
// This function is for reference; actual sending is done by Cloud Functions
export const NOTIFICATION_TYPES = {
  ORDER_CONFIRMED: {
    title: '✅ Order Confirmed!',
    body: (shopName) => `${shopName} has accepted your order. It's being prepared!`,
  },
  ORDER_PREPARING: {
    title: '👨‍🍳 Your food is cooking!',
    body: (shopName) => `${shopName} is preparing your order fresh.`,
  },
  ORDER_READY: {
    title: '📦 Order Ready for Pickup',
    body: () => 'Your order is packed. Rider is on the way!',
  },
  ORDER_ON_THE_WAY: {
    title: '🛵 Rider is heading your way!',
    body: (riderName) => `${riderName || 'Your rider'} is delivering your order. ETA ~10 min.`,
  },
  ORDER_DELIVERED: {
    title: '🎉 Order Delivered!',
    body: (shopName) => `Enjoy your order from ${shopName}! Rate your experience.`,
  },
  ORDER_CANCELLED: {
    title: '❌ Order Cancelled',
    body: () => 'Your order has been cancelled. Refund (if any) in 3–5 days.',
  },
  FLASH_SALE: {
    title: '⚡ Flash Sale in Addanki!',
    body: (discount) => `${discount || '20%'} off for next 2 hours! Order now.`,
  },
  GALLI_COINS: {
    title: '🪙 GalliCoins Earned!',
    body: (coins) => `You earned ${coins} GalliCoins from your last order!`,
  },
};
