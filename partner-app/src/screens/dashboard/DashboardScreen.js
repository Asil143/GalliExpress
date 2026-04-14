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

export default function DashboardScreen({ navigation }) {
  const [isOpen, setIsOpen] = useState(true);
  const [stats, setStats] = useState({ todayOrders: 0, todayEarnings: 0, pending: 0, totalOrders: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [shopName, setShopName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const user = auth().currentUser;

  useEffect(() => {
    loadDashboard();
    loadShopStatus();

    // Real-time listener for pending orders badge
    const unsub = firestore()
      .collection('orders')
      .where('shopId', '==', user?.uid)
      .where('status', '==', OrderStatus.PENDING)
      .onSnapshot((snap) => {
        setStats((prev) => ({ ...prev, pending: snap.size }));
      });
    return unsub;
  }, []);

  const loadShopStatus = async () => {
    const snap = await firestore().collection('partners').doc(user?.uid).get();
    if (snap.exists) {
      setIsOpen(snap.data().isOpen ?? true);
      setShopName(snap.data().shopName || 'మీ షాప్');
    }
  };

  const loadDashboard = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const snap = await firestore()
      .collection('orders')
      .where('shopId', '==', user?.uid)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setRecentOrders(orders.slice(0, 5));

    const todayOrders = orders.filter((o) => {
      const date = o.createdAt?.toDate?.() || new Date(0);
      return date >= today;
    });

    const todayEarnings = todayOrders
      .filter((o) => o.status === OrderStatus.DELIVERED)
      .reduce((sum, o) => sum + (o.total * 0.12), 0); // 12% commission

    setStats((prev) => ({
      ...prev,
      todayOrders: todayOrders.length,
      todayEarnings,
      totalOrders: snap.size,
    }));
  };

  const toggleShopOpen = async (value) => {
    setIsOpen(value);
    await firestore().collection('partners').doc(user?.uid).update({ isOpen: value });
    await firestore().collection('shops').doc(user?.uid).update({ isOpen: value });
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
              <Text style={styles.greeting}>నమస్కారం 👋</Text>
              <Text style={styles.shopName}>{shopName}</Text>
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
                  {isOpen ? '🟢 షాప్ తెరవబడి ఉంది' : '🔴 షాప్ మూసివేయబడింది'}
                </Text>
                <Text style={styles.toggleSub}>
                  {isOpen ? 'ఆర్డర్లు స్వీకరిస్తున్నారు' : 'ఆర్డర్లు రావడం ఆపబడింది'}
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
          <StatCard emoji="📦" value={stats.todayOrders} label="ఈరోజు ఆర్డర్లు" color={Colors.primary} />
          <StatCard emoji="💰" value={formatPrice(stats.todayEarnings)} label="ఈరోజు సంపాదన" color={Colors.success} />
          <StatCard
            emoji="⏳"
            value={stats.pending}
            label="పెండింగ్ ఆర్డర్లు"
            color={stats.pending > 0 ? Colors.warning : Colors.grey}
            alert={stats.pending > 0}
          />
          <StatCard emoji="📊" value={stats.totalOrders} label="మొత్తం ఆర్డర్లు" color={Colors.dark} />
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
                  {stats.pending} కొత్త ఆర్డర్{stats.pending > 1 ? 'లు' : ''}!
                </Text>
                <Text style={styles.pendingAlertSub}>అంగీకరించడానికి తొందరగా వెళ్ళండి</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>శీఘ్ర చర్యలు</Text>
          <View style={styles.quickActions}>
            <QuickAction
              icon="add-circle"
              label="వస్తువు జోడించు"
              color={Colors.primary}
              onPress={() => navigation.navigate('MenuTab')}
            />
            <QuickAction
              icon="receipt"
              label="ఆర్డర్లు చూడు"
              color={Colors.success}
              onPress={() => navigation.navigate('OrdersTab')}
            />
            <QuickAction
              icon="wallet"
              label="సంపాదన"
              color={Colors.secondary}
              onPress={() => navigation.navigate('EarningsTab')}
            />
            <QuickAction
              icon="share-social"
              label="షేర్ చేయి"
              color={Colors.dark}
              onPress={() => Alert.alert('త్వరలో వస్తుంది!')}
            />
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>తాజా ఆర్డర్లు</Text>
            <TouchableOpacity onPress={() => navigation.navigate('OrdersTab')}>
              <Text style={styles.seeAll}>అన్నీ చూడు</Text>
            </TouchableOpacity>
          </View>
          {recentOrders.length === 0 ? (
            <View style={styles.emptyOrders}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>ఇంకా ఆర్డర్లు రాలేదు</Text>
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
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
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
    borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: 4,
  },
  statEmoji: { fontSize: 24 },
  statValue: { fontSize: Fonts.sizes.xxl, fontWeight: '800' },
  statLabel: { fontSize: Fonts.sizes.xs, color: Colors.grey, textAlign: 'center' },
  pendingAlert: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.warning, marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md,
  },
  pendingAlertLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pendingAlertEmoji: { fontSize: 24 },
  pendingAlertTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
  pendingAlertSub: { fontSize: Fonts.sizes.xs, color: 'rgba(255,255,255,0.85)' },
  section: { marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.dark, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  seeAll: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '600' },
  quickActions: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm,
  },
  quickAction: { flex: 1, alignItems: 'center', gap: 6 },
  quickActionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { fontSize: 10, fontWeight: '600', color: Colors.darkGrey, textAlign: 'center' },
  recentOrderCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm, borderRadius: Radius.md, padding: Spacing.md,
  },
  recentOrderLeft: { flex: 1 },
  recentOrderId: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.dark },
  recentOrderItems: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 2 },
  recentOrderRight: { alignItems: 'flex-end', gap: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  statusText: { fontSize: 10, fontWeight: '700' },
  recentOrderTotal: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.dark },
  emptyOrders: { alignItems: 'center', paddingVertical: 32 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: Fonts.sizes.sm, color: Colors.grey },
});
