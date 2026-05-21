// GalliExpress Partner — Incoming Orders Screen

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Vibration, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import { Colors, Fonts, Spacing, Radius, Shadows, OrderStatus } from '../../../../shared/theme';
import { formatPrice, getStatusLabel, getStatusColor, getTimeAgo } from '../../../../shared/utils';
import { useShop } from '../../context/ShopContext';
import { showNewOrderNotification } from '../../services/NotificationService';

const TABS = [
  { key: 'pending',   label: 'New',       color: Colors.warning },
  { key: 'active',    label: 'Active',    color: Colors.primary },
  { key: 'completed', label: 'Done',      color: Colors.success },
];

const STATUS_GROUPS = {
  pending:   [OrderStatus.PENDING],
  active:    [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY],
  completed: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
};

export default function IncomingOrdersScreen({ navigation }) {
  const { shopId } = useShop();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [counts, setCounts] = useState({ pending: 0, active: 0, completed: 0 });
  const prevPendingIds = useRef(new Set());
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for new orders badge
  useEffect(() => {
    if (counts.pending > 0) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [counts.pending]);

  // Live count listener across all statuses
  useEffect(() => {
    if (!shopId) return;
    const unsubs = Object.entries(STATUS_GROUPS).map(([tab, statuses]) =>
      firestore()
        .collection('orders')
        .where('shopId', '==', shopId)
        .where('status', 'in', statuses)
        .onSnapshot(
          (snap) => {
            if (!snap) return;
            setCounts((prev) => ({ ...prev, [tab]: snap.size }));

            if (tab === 'pending') {
              const currentIds = new Set(snap.docs.map((d) => d.id));
              const newIds = [...currentIds].filter((id) => !prevPendingIds.current.has(id));
              if (newIds.length > 0 && prevPendingIds.current.size > 0) {
                const newOrder = snap.docs.find((d) => newIds.includes(d.id));
                if (newOrder) {
                  const orderData = { id: newOrder.id, ...newOrder.data() };
                  showNewOrderNotification(orderData).catch(() => {});
                  Vibration.vibrate([0, 400, 100, 400]);
                }
              }
              prevPendingIds.current = currentIds;
            }
          },
          () => {}
        )
    );
    return () => unsubs.forEach((u) => u());
  }, [shopId]);

  // Orders for selected tab
  useEffect(() => {
    if (!shopId) return;
    setLoading(true);
    const unsub = firestore()
      .collection('orders')
      .where('shopId', '==', shopId)
      .where('status', 'in', STATUS_GROUPS[activeTab])
      .onSnapshot(
        (snap) => {
          if (!snap) { setLoading(false); return; }
          const sorted = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setOrders(sorted);
          setLoading(false);
        },
        (err) => {
          setLoading(false);
        }
      );
    return unsub;
  }, [activeTab, shopId]);

  const updateOrderStatus = async (orderId, newStatus, extra = {}) => {
    setUpdating(orderId);
    try {
      await firestore().collection('orders').doc(orderId).update({
        status: newStatus,
        [`${newStatus}At`]: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        ...extra,
      });
    } catch {
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = (order) => {
    Alert.alert(
      'Reject Order?',
      `Reject order #${order.orderId}?\nCustomer will be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => updateOrderStatus(order.id, OrderStatus.CANCELLED, { cancelledBy: 'partner' }),
        },
      ]
    );
  };

  const getNextAction = (status) => {
    const map = {
      [OrderStatus.CONFIRMED]: { label: '🍳 Start Preparing', next: OrderStatus.PREPARING },
      [OrderStatus.PREPARING]: { label: '📦 Mark Ready for Pickup', next: OrderStatus.READY },
    };
    return map[status];
  };

  const renderOrder = ({ item }) => {
    const nextAction = getNextAction(item.status);
    const isPending = item.status === OrderStatus.PENDING;

    return (
      <View style={[styles.card, Shadows.md]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>#{item.orderId}</Text>
            <Text style={styles.orderTime}>{getTimeAgo(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        {/* Customer + Payment */}
        <View style={styles.metaRow}>
          <Ionicons name="person-circle-outline" size={16} color={Colors.grey} />
          <Text style={styles.customerPhone}>{item.customerPhone}</Text>
          <View style={[styles.payBadge, { backgroundColor: item.paymentMethod === 'cod' ? Colors.warning + '20' : Colors.success + '20' }]}>
            <Text style={[styles.payText, { color: item.paymentMethod === 'cod' ? Colors.warning : Colors.success }]}>
              {item.paymentMethod === 'cod' ? '💵 COD' : item.paymentMethod === 'upi' ? '📲 UPI' : item.paymentMethod === 'card' ? '💳 Card' : '👛 Wallet'}
            </Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.addrRow}>
          <Ionicons name="location-outline" size={14} color={Colors.primary} />
          <Text style={styles.addrText} numberOfLines={2}>
            {item.address?.line1 || '—'}
            {item.address?.landmark ? `, near ${item.address.landmark}` : ''}
            {item.address?.pincode ? ` - ${item.address.pincode}` : ''}
          </Text>
        </View>

        {/* Items */}
        <View style={styles.itemsBox}>
          {item.items?.map((i, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>{i.quantity}× {i.name}</Text>
              <Text style={styles.itemPrice}>{formatPrice(i.price * i.quantity)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(item.total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {item.cookingNote ? (
          <View style={styles.noteRow}>
            <Ionicons name="restaurant-outline" size={13} color={Colors.primary} />
            <Text style={styles.noteText}>{item.cookingNote}</Text>
          </View>
        ) : null}
        {item.deliveryNote ? (
          <View style={styles.noteRow}>
            <Ionicons name="bicycle-outline" size={13} color={Colors.dark} />
            <Text style={styles.noteText}>{item.deliveryNote}</Text>
          </View>
        ) : null}
        {item.scheduleSlot && item.scheduleSlot !== 'now' ? (
          <View style={[styles.noteRow, { backgroundColor: Colors.warning + '15', borderRadius: Radius.sm, padding: 6 }]}>
            <Ionicons name="time-outline" size={13} color={Colors.warning} />
            <Text style={[styles.noteText, { color: Colors.warning }]}>Scheduled: {item.scheduleSlot}</Text>
          </View>
        ) : null}

        {/* Pending Actions — Accept / Reject */}
        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)}>
              <Ionicons name="close" size={16} color={Colors.error} />
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => updateOrderStatus(item.id, OrderStatus.CONFIRMED)}
              disabled={updating === item.id}
            >
              <LinearGradient
                colors={[Colors.success, '#009940']}
                style={styles.acceptGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {updating === item.id
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <>
                      <Ionicons name="checkmark" size={16} color={Colors.white} />
                      <Text style={styles.acceptText}>Accept</Text>
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Active Progress Buttons */}
        {nextAction && (
          <View style={styles.progressRow}>
            <TouchableOpacity
              style={styles.progressBtn}
              onPress={() => updateOrderStatus(item.id, nextAction.next)}
              disabled={updating === item.id}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.progressGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {updating === item.id
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={styles.progressText}>{nextAction.label}</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.detailsBtn}
              onPress={() => navigation.navigate('OrderDetail', { orderId: item.id, order: item })}
            >
              <Ionicons name="document-text-outline" size={16} color={Colors.dark} />
            </TouchableOpacity>
          </View>
        )}

        {/* Ready — waiting for rider */}
        {item.status === OrderStatus.READY && (
          <View style={styles.waitingRider}>
            <Text style={styles.waitingRiderText}>🛵 Waiting for rider to pick up...</Text>
          </View>
        )}

        {/* Completed order tap to view */}
        {(item.status === OrderStatus.DELIVERED || item.status === OrderStatus.CANCELLED) && (
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id, order: item })}
          >
            <Text style={styles.viewBtnText}>View Details</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.grey} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        {counts.pending > 0 && (
          <Animated.View style={[styles.newBadge, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.newBadgeText}>{counts.pending} new!</Text>
          </Animated.View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && { borderBottomColor: tab.color, borderBottomWidth: 2.5 }]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && { color: tab.color, fontWeight: '700' }]}>
              {tab.label}
            </Text>
            {counts[tab.key] > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: tab.color }]}>
                <Text style={styles.tabBadgeText}>{counts[tab.key]}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 52 }}>📭</Text>
          <Text style={styles.emptyText}>
            {activeTab === 'pending' ? 'No New Orders' : activeTab === 'active' ? 'No Active Orders' : 'No Completed Orders'}
          </Text>
          <Text style={styles.emptySub}>
            {activeTab === 'pending' ? 'New orders will appear here instantly' : 'Orders will appear here once updated'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
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
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.dark },
  newBadge: {
    backgroundColor: Colors.error, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  newBadgeText: { color: Colors.white, fontWeight: '800', fontSize: Fonts.sizes.xs },
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabText: { fontSize: Fonts.sizes.sm, color: Colors.grey, fontWeight: '500' },
  tabBadge: { borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '800' },

  card: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.lg, marginBottom: Spacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  orderId: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.dark },
  orderTime: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontSize: 11, fontWeight: '700' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  customerPhone: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.darkGrey },
  payBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  payText: { fontSize: 11, fontWeight: '700' },

  addrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: Spacing.sm },
  addrText: { flex: 1, fontSize: Fonts.sizes.xs, color: Colors.grey, lineHeight: 17 },

  itemsBox: {
    backgroundColor: Colors.background, borderRadius: Radius.md,
    padding: Spacing.sm, marginBottom: Spacing.sm,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  itemName: { fontSize: Fonts.sizes.sm, color: Colors.dark, flex: 1 },
  itemPrice: { fontSize: Fonts.sizes.sm, color: Colors.dark, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 6 },
  totalLabel: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.dark },
  totalValue: { fontSize: Fonts.sizes.md, fontWeight: '800', color: Colors.primary },

  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  noteText: { flex: 1, fontSize: Fonts.sizes.xs, color: Colors.darkGrey, lineHeight: 16 },

  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  rejectBtn: {
    flex: 1, height: 48, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.error,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  rejectText: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.error },
  acceptBtn: { flex: 2, borderRadius: Radius.md, overflow: 'hidden' },
  acceptGradient: {
    height: 48, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  acceptText: { fontSize: Fonts.sizes.md, fontWeight: '800', color: Colors.white },

  progressRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  progressBtn: { flex: 1, borderRadius: Radius.md, overflow: 'hidden' },
  progressGradient: { height: 48, alignItems: 'center', justifyContent: 'center' },
  progressText: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.white },
  detailsBtn: {
    width: 48, height: 48, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },

  waitingRider: {
    backgroundColor: Colors.warning + '15', borderRadius: Radius.md,
    padding: Spacing.sm, marginTop: Spacing.sm, alignItems: 'center',
  },
  waitingRiderText: { fontSize: Fonts.sizes.sm, color: Colors.warning, fontWeight: '600' },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, marginTop: Spacing.sm, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  viewBtnText: { fontSize: Fonts.sizes.sm, color: Colors.grey },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.dark },
  emptySub: { fontSize: Fonts.sizes.sm, color: Colors.grey, textAlign: 'center', paddingHorizontal: 40 },
});
