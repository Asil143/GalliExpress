// GalliExpress Partner — Notification Service

import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import * as Notifications from 'expo-notifications';
import { Vibration } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function registerFCMToken() {
  const user = auth().currentUser;
  if (!user) return;
  try {
    const token = await messaging().getToken();
    await firestore().collection('partners').doc(user.uid).set({ fcmToken: token }, { merge: true });
  } catch {}
}

export async function showNewOrderNotification(order) {
  Vibration.vibrate([0, 300, 100, 300, 100, 300]);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 New Order!',
      body: `Order #${order.orderId} · ${order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')} · ₹${order.total}`,
      sound: true,
      data: { orderId: order.orderId || order.id },
    },
    trigger: null,
  });
}

export function setupForegroundMessaging() {
  return messaging().onMessage(async (remoteMessage) => {
    const data = remoteMessage.data || {};
    if (data.type === 'new_order') {
      Vibration.vibrate([0, 500, 200, 500]);
    }
  });
}

messaging().setBackgroundMessageHandler(async () => {});
