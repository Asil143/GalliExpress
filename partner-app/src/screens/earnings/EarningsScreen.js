// GalliExpress Partner — Earnings Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { formatPrice, formatDate } from '../../../../shared/utils';
import { OrderStatus } from '../../../../shared/theme';

const PERIODS = ['ఈరోజు', 'ఈ వారం', 'ఈ నెల'];

export default function EarningsScreen() {
  const [period, setPeriod] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth().currentUser;
  const COMMISSION_RATE = 0.12; // 12%

  useEffect(() => {
    loadEarnings();
  }, [period]);

  const getStartDate = () => {
    const now = new Date();
    if (period === 0) { now.setHours(0, 0, 0, 0); return now; }
    if (period === 1) { now.setDate(now.getDate() - 7); return now; }
    now.setDate(1); now.setHours(0, 0, 0, 0); return now;
  };

  const loadEarnings = async () => {
    setLoading(true);
    const startDate = getStartDate();
    const snap = await firestore()
      .collection('orders')
      .where('shopId', '==', user?.uid)
      .where('status', '==', OrderStatus.DELIVERED)
      .where('createdAt', '>=', firestore.Timestamp.fromDate(startDate))
      .orderBy('createdAt', 'desc')
      .get();
    setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalCommission = totalRevenue * COMMISSION_RATE;
  const netEarnings = totalRevenue - totalCommission;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>సంపాదన</Text>
      </View>

      <ScrollView>
        {/* Period Tabs */}
        <View style={styles.tabs}>
          {PERIODS.map((p, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.tab, period === i && styles.tabActive]}
              onPress={() => setPeriod(i)}
            >
              <Text style={[styles.tabText, period === i && styles.tabTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Earnings Card */}
        <LinearGradient colors={['#1C1C2E', '#3D3D5C']} style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>నికర సంపాదన</Text>
          <Text style={styles.earningsMain}>{formatPrice(netEarnings)}</Text>
          <View style={styles.earningsRow}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsItemLabel}>మొత్తం అమ్మకాలు</Text>
              <Text style={styles.earningsItemValue}>{formatPrice(totalRevenue)}</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsItemLabel}>GalliExpress కమీషన్ (12%)</Text>
              <Text style={[styles.earningsItemValue, { color: Colors.error }]}>
                − {formatPrice(totalCommission)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <StatBox value={orders.length} label="డెలివర్ అయిన ఆర్డర్లు" emoji="📦" />
          <StatBox
            value={orders.length > 0 ? formatPrice(totalRevenue / orders.length) : '₹0'}
            label="సగటు ఆర్డర్ విలువ"
            emoji="📊"
          />
        </View>

        {/* Orders List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ఆర్డర్ల వివరాలు</Text>
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ padding: 32 }} />
          ) : orders.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💰</Text>
              <Text style={styles.emptyText}>ఈ కాలానికి డేటా లేదు</Text>
            </View>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={[styles.orderRow, Shadows.sm]}>
                <View style={styles.orderRowLeft}>
                  <Text style={styles.orderRowId}>#{order.orderId}</Text>
                  <Text style={styles.orderRowDate}>{formatDate(order.createdAt)}</Text>
                  <Text style={styles.orderRowItems} numberOfLines={1}>
                    {order.items?.map((i) => i.name).join(', ')}
                  </Text>
                </View>
                <View style={styles.orderRowRight}>
                  <Text style={styles.orderRowTotal}>{formatPrice(order.total)}</Text>
                  <Text style={styles.orderRowNet}>
                    నికరం: {formatPrice(order.total * (1 - COMMISSION_RATE))}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Payout Info */}
        <View style={styles.payoutCard}>
          <Text style={styles.payoutTitle}>💳 చెల్లింపు సమాచారం</Text>
          <Text style={styles.payoutText}>
            మీ నికర సంపాదన ప్రతి సోమవారం మీ బ్యాంక్ ఖాతాకు జమ అవుతుంది.
            {'\n'}కమీషన్ రేటు: 12% (ఆర్డర్ మొత్తంపై)
          </Text>
          <TouchableOpacity style={styles.payoutBtn}>
            <Text style={styles.payoutBtnText}>బ్యాంక్ వివరాలు జోడించు</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ value, label, emoji }) {
  return (
    <View style={[styles.statBox, Shadows.sm]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.dark },
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg, paddingBottom: 8, gap: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 50, backgroundColor: Colors.background,
  },
  tabActive: { backgroundColor: Colors.dark },
  tabText: { fontSize: Fonts.sizes.sm, color: Colors.grey, fontWeight: '600' },
  tabTextActive: { color: Colors.white },
  earningsCard: {
    margin: Spacing.lg, borderRadius: Radius.xl, padding: Spacing.xl,
  },
  earningsLabel: { fontSize: Fonts.sizes.sm, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  earningsMain: { fontSize: 40, fontWeight: '800', color: Colors.white, marginBottom: Spacing.lg },
  earningsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.md, padding: Spacing.md,
  },
  earningsItem: { flex: 1, alignItems: 'center' },
  earningsItemLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 4, textAlign: 'center' },
  earningsItemValue: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
  earningsDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg,
    gap: Spacing.sm, marginBottom: Spacing.lg,
  },
  statBox: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', gap: 4,
  },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.dark },
  statLabel: { fontSize: 10, color: Colors.grey, textAlign: 'center' },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.dark, marginBottom: Spacing.md },
  orderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  orderRowLeft: { flex: 1 },
  orderRowId: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.dark },
  orderRowDate: { fontSize: 10, color: Colors.grey, marginTop: 2 },
  orderRowItems: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 3 },
  orderRowRight: { alignItems: 'flex-end' },
  orderRowTotal: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.dark },
  orderRowNet: { fontSize: 11, color: Colors.success, marginTop: 3, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 44, marginBottom: 10 },
  emptyText: { fontSize: Fonts.sizes.md, color: Colors.grey },
  payoutCard: {
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg,
    marginBottom: 32, borderRadius: Radius.xl, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  payoutTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.dark, marginBottom: 10 },
  payoutText: { fontSize: Fonts.sizes.sm, color: Colors.grey, lineHeight: 20, marginBottom: 14 },
  payoutBtn: {
    backgroundColor: Colors.dark, paddingVertical: 10,
    borderRadius: Radius.md, alignItems: 'center',
  },
  payoutBtnText: { color: Colors.white, fontWeight: '700', fontSize: Fonts.sizes.sm },
});
