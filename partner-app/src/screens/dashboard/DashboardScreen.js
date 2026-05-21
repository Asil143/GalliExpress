// GalliExpress Partner — Dashboard Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { formatPrice, getStatusLabel, getStatusColor } from '../../../../shared/utils';
import { OrderStatus } from '../../../../shared/theme';
import { useShop } from '../../context/ShopContext';

export default function DashboardScreen({ navigation }) {
  const { shopId, shop, setShop } = useShop();
  const [isOpen, setIsOpen] = useState(true);
  const [stats, setStats] = useState({ todayOrders: 0, todayEarnings: 0, pending: 0, totalOrders: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const user = auth().currentUser;

  useEffect(() => {
    if (!shopId) return;
    loadDashboard();
    const openValue = shop?.isOpen ?? true;
    setIsOpen(openValue);
    // Write isOpen to Firestore if the field was never set (fixes customer app showing "Closed")
    if (shopId && shop?.isOpen === undefined) {
      firestore().collection('shops').doc(shopId).update({ isOpen: true }).catch(() => {});
    }

    const unsub = firestore()
      .collection('orders')
      .where('shopId', '==', shopId)
      .where('status', '==', OrderStatus.PENDING)
      .onSnapshot(
        (snap) => { if (snap) setStats((prev) => ({ ...prev, pending: snap.size })); },
        () => {}
      );
    return unsub;
  }, [shopId]);

  const loadDashboard = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const snap = await firestore()
        .collection('orders')
        .where('shopId', '==', shopId)
        .limit(50)
        .get();

      const orders = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRecentOrders(orders.slice(0, 5));

    const todayOrders = orders.filter((o) => {
      const date = o.createdAt?.toDate?.() || new Date(0);
      return date >= today;
    });

    const todayEarnings = todayOrders
      .filter((o) => o.status === OrderStatus.DELIVERED)
      .reduce((sum, o) => sum + (o.total * (shop?.commissionRate || 0.12)), 0);

      setStats((prev) => ({
        ...prev,
        todayOrders: todayOrders.length,
        todayEarnings,
        totalOrders: snap.size,
      }));
    } catch (e) {
    }
  };

  const toggleShopOpen = async (value) => {
    setIsOpen(value);
    setShop((prev) => ({ ...prev, isOpen: value }));
    try {
      await firestore().collection('shops').doc(shopId).update({ isOpen: value });
    } catch (e) {
      // Revert UI if write fails
      setIsOpen(!value);
      setShop((prev) => ({ ...prev, isOpen: !value }));
      Alert.alert('Error', 'Could not update shop status: ' + e.message);
    }
  };

  const loadShopStatus = async () => {
    if (!shopId) return;
    try {
      const snap = await firestore().collection('shops').doc(shopId).get();
      if (snap.exists) setIsOpen(snap.data().isOpen ?? true);
    } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    await loadShopStatus();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <LinearGradient colors={['#1C1C2E', '#3D3D5C']} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Hello 👋</Text>
              <Text style={styles.shopName}>{shop?.name || 'Your Shop'}</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => navigation.navigate('ShopSettings')}
            >
              <Ionicons name="settings-outline" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Open/Close Toggle */}
          <View style={styles.toggleCard}>
            <View style={styles.toggleLeft}>
              <View style={[styles.statusDot, { backgroundColor: isOpen ? Colors.success : Colors.error }]} />
              <View>
                <Text style={styles.toggleLabel}>
                  {isOpen ? '🟢 Shop is Open' : '🔴 Shop is Closed'}
                </Text>
                <Text style={styles.toggleSub}>
                  {isOpen ? 'Accepting orders' : 'Not accepting orders'}
                </Text>
              </View>
            </View>
            <Switch
              value={isOpen}
              onValueChange={toggleShopOpen}
              trackColor={{ false: Colors.error + '40', true: Colors.success + '60' }}
              thumbColor={isOpen ? Colors.success : Colors.error}
            />
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard emoji="📦" value={stats.todayOrders} label="Today's Orders" color={Colors.primary} />
          <StatCard emoji="💰" value={formatPrice(stats.todayEarnings)} label="Today's Earnings" color={Colors.success} />
          <StatCard
            emoji="⏳"
            value={stats.pending}
            label="Pending Orders"
            color={stats.pending > 0 ? Colors.warning : Colors.grey}
            alert={stats.pending > 0}
          />
          <StatCard emoji="📊" value={stats.totalOrders} label="Total Orders" color={Colors.dark} />
        </View>

        {/* Pending Alert */}
        {stats.pending > 0 && (
          <TouchableOpacity
            style={styles.pendingAlert}
            onPress={() => navigation.navigate('OrdersTab')}
          >
            <View style={styles.pendingAlertLeft}>
              <Text style={styles.pendingAlertEmoji}>🔔</Text>
              <View>
                <Text style={styles.pendingAlertTitle}>
                  {stats.pending} new order{stats.pending > 1 ? 's' : ''}!
                </Text>
                <Text style={styles.pendingAlertSub}>Go accept them quickly</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <QuickAction
              icon="add-circle"
              label="Add Item"
              color={Colors.primary}
              onPress={() => navigation.navigate('MenuTab')}
            />
            <QuickAction
              icon="receipt"
              label="Orders"
              color={Colors.success}
              onPress={() => navigation.navigate('OrdersTab')}
            />
            <QuickAction
              icon="wallet"
              label="Earnings"
              color={Colors.secondary}
              onPress={() => navigation.navigate('EarningsTab')}
            />
            <QuickAction
              icon="share-social"
              label="Share"
              color={Colors.dark}
              onPress={() => Alert.alert('Coming Soon!')}
            />
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('OrdersTab')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {recentOrders.length === 0 ? (
            <View style={styles.emptyOrders}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>No orders yet</Text>
            </View>
          ) : (
            recentOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={[styles.recentOrderCard, Shadows.sm]}
                onPress={() => navigation.navigate('OrdersTab', {
                  screen: 'OrderDetail',
                  params: { orderId: order.id, order },
                })}
              >
                <View style={styles.recentOrderLeft}>
                  <Text style={styles.recentOrderId}>#{order.orderId}</Text>
                  <Text style={styles.recentOrderItems} numberOfLines={1}>
                    {order.items?.map((i) => i.name).join(', ')}
                  </Text>
                </View>
                <View style={styles.recentOrderRight}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                      {getStatusLabel(order.status)}
                    </Text>
                  </View>
                  <Text style={styles.recentOrderTotal}>{formatPrice(order.total)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ emoji, value, label, color, alert }) {
  return (
    <View style={[styles.statCard, Shadows.sm, alert && { borderWidth: 1.5, borderColor: color }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={26} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: Spacing.xl, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  greeting: { fontSize: Fonts.sizes.sm, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  shopName: { fontSize: Fonts.sizes.xxl, fontWeight: '800', color: Colors.white },
  settingsBtn: { padding: 8 },
  toggleCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  toggleLabel: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.white },
  toggleSub: { fontSize: Fonts.sizes.xs, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    padding: Spacing.md, gap: Spacing.sm,
  },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.white,
    borderRadius: Radius.xl, padding: Spacing.lg, alignItems: 'center', gap: 6,
    shadowColor: '#1C1C2E', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  statEmoji: { fontSize: 28 },
  statValue: { fontSize: Fonts.sizes.xxl, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: Fonts.sizes.xs, color: Colors.grey, textAlign: 'center', fontWeight: '500' },
  pendingAlert: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.warning, marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md,
    shadowColor: Colors.warning, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  pendingAlertLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pendingAlertEmoji: { fontSize: 28 },
  pendingAlertTitle: { fontSize: Fonts.sizes.md, fontWeight: '800', color: Colors.white },
  pendingAlertSub: { fontSize: Fonts.sizes.xs, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  section: { marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.dark, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, letterSpacing: -0.2 },
  seeAll: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '700' },
  quickActions: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm,
  },
  quickAction: { flex: 1, alignItems: 'center', gap: 8 },
  quickActionIcon: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  quickActionLabel: { fontSize: 10, fontWeight: '700', color: Colors.darkGrey, textAlign: 'center' },
  recentOrderCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm, borderRadius: Radius.lg, padding: Spacing.md,
    shadowColor: '#1C1C2E', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  recentOrderLeft: { flex: 1 },
  recentOrderId: { fontSize: Fonts.sizes.sm, fontWeight: '800', color: Colors.dark },
  recentOrderItems: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 3 },
  recentOrderRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.2 },
  recentOrderTotal: { fontSize: Fonts.sizes.sm, fontWeight: '800', color: Colors.dark },
  emptyOrders: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 10 },
  emptyText: { fontSize: Fonts.sizes.md, color: Colors.grey, fontWeight: '500' },
});
