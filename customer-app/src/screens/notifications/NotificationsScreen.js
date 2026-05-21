// GalliExpress Customer — Notifications Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { getTimeAgo } from '../../../../shared/utils';

const NOTIF_STYLES = {
  order_placed:     { icon: 'receipt-outline',          color: Colors.primary },
  order_confirmed:  { icon: 'checkmark-circle-outline', color: Colors.success },
  order_preparing:  { icon: 'flame-outline',            color: Colors.warning },
  order_ready:      { icon: 'cube-outline',             color: Colors.success },
  order_on_the_way: { icon: 'bicycle-outline',          color: '#5856D6' },
  order_delivered:  { icon: 'gift-outline',             color: Colors.success },
  order_cancelled:  { icon: 'close-circle-outline',     color: Colors.error },
  flash_sale:       { icon: 'flash-outline',            color: Colors.secondary },
  gallicoins:       { icon: 'star-outline',             color: '#B8860B' },
  default:          { icon: 'notifications-outline',    color: Colors.primary },
};

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth().currentUser;

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const unsub = firestore()
      .collection('notifications')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .limit(60)
      .onSnapshot(
        snap => {
          setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setLoading(false);
        },
        () => setLoading(false)
      );
    return unsub;
  }, []);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (!unread.length) return;
    const batch = firestore().batch();
    unread.forEach(n =>
      batch.update(firestore().collection('notifications').doc(n.id), { read: true })
    );
    await batch.commit();
  };

  const handlePress = (notif) => {
    if (!notif.read) {
      firestore().collection('notifications').doc(notif.id).update({ read: true }).catch(() => {});
    }
    if (notif.orderId) {
      navigation.navigate('OrderTracking', {
        orderId: notif.orderId,
        order: { orderId: notif.orderId },
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderItem = ({ item }) => {
    const s = NOTIF_STYLES[item.type] || NOTIF_STYLES.default;
    return (
      <TouchableOpacity
        style={[styles.item, !item.read && styles.itemUnread]}
        onPress={() => handlePress(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconBox, { backgroundColor: s.color + '20' }]}>
          <Ionicons name={s.icon} size={20} color={s.color} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.time}>{getTimeAgo(item.createdAt)}</Text>
        </View>
        {!item.read && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markRead}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 56 }}>🔔</Text>
          <Text style={styles.emptyTitle}>No Notifications Yet</Text>
          <Text style={styles.emptySub}>Order updates and offers will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: Spacing.sm }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.dark },
  markRead: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: Fonts.weights.semibold },
  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  itemUnread: { backgroundColor: Colors.primary + '06' },
  iconBox: {
    width: 42, height: 42, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  content: { flex: 1, gap: 2 },
  title: { fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.bold, color: Colors.dark },
  body: { fontSize: Fonts.sizes.sm, color: Colors.grey, lineHeight: 18 },
  time: { fontSize: Fonts.sizes.xs, color: Colors.lightGrey, marginTop: 2 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary, marginTop: 6, flexShrink: 0,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.dark },
  emptySub: { fontSize: Fonts.sizes.sm, color: Colors.grey, textAlign: 'center', paddingHorizontal: Spacing.xxl },
});
