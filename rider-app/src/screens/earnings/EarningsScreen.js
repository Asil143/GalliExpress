// GalliExpress Rider — Earnings Screen
// Save as: rider-app/src/screens/earnings/EarningsScreen.js

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
const DELIVERY_FEE = 30;

export default function EarningsScreen() {
  const [period, setPeriod] = useState(0);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth().currentUser;

  useEffect(() => { loadEarnings(); }, [period]);

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
      .where('riderId', '==', user?.uid)
      .where('status', '==', OrderStatus.DELIVERED)
      .where('createdAt', '>=', firestore.Timestamp.fromDate(startDate))
      .orderBy('createdAt', 'desc')
      .get();
    setDeliveries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const totalEarnings = deliveries.length * DELIVERY_FEE;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>నా సంపాదన</Text>
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

        {/* Earnings Card */}
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>మొత్తం సంపాదన</Text>
          <Text style={styles.earningsAmount}>{formatPrice(totalEarnings)}</Text>
          <View style={styles.earningsRow}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsItemVal}>{deliveries.length}</Text>
              <Text style={styles.earningsItemLabel}>డెలివరీలు</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsItemVal}>{formatPrice(DELIVERY_FEE)}</Text>
              <Text style={styles.earningsItemLabel}>ప్రతి డెలివరీకి</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsItemVal}>
                {deliveries.length > 0 ? formatPrice(totalEarnings / deliveries.length) : '₹0'}
              </Text>
              <Text style={styles.earningsItemLabel}>సగటు</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Performance Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>🏆 మీ పర్ఫార్మెన్స్</Text>
          <View style={styles.performanceRow}>
            <PerformanceItem label="రేటింగ్" value="⭐ 5.0" good />
            <PerformanceItem label="అంగీకార రేటు" value="95%" good />
            <PerformanceItem label="సమయపాలన" value="98%" good />
          </View>
        </View>

        {/* Delivery List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>డెలివరీ చరిత్ర</Text>
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ padding: 32 }} />
          ) : deliveries.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🛵</Text>
              <Text style={styles.emptyText}>ఈ కాలానికి డెలివరీలు లేవు</Text>
            </View>
          ) : (
            deliveries.map((d) => (
              <View key={d.id} style={[styles.deliveryRow, Shadows.sm]}>
                <View style={styles.deliveryLeft}>
                  <Text style={styles.deliveryId}>#{d.orderId}</Text>
                  <Text style={styles.deliveryShop}>{d.shopName}</Text>
                  <Text style={styles.deliveryDate}>{formatDate(d.createdAt)}</Text>
                </View>
                <View style={styles.deliveryRight}>
                  <Text style={styles.deliveryEarning}>{formatPrice(DELIVERY_FEE)}</Text>
                  <Text style={styles.deliveryStatus}>✅ డెలివర్ అయింది</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Bank Details */}
        <View style={styles.bankCard}>
          <Text style={styles.bankTitle}>💳 చెల్లింపు సమాచారం</Text>
          <Text style={styles.bankText}>
            మీ సంపాదన ప్రతి సోమవారం మీ UPI / బ్యాంక్ ఖాతాకు జమ అవుతుంది.
          </Text>
          <TouchableOpacity style={styles.bankBtn}>
            <Text style={styles.bankBtnText}>UPI / బ్యాంక్ వివరాలు జోడించు</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PerformanceItem({ label, value, good }) {
  return (
    <View style={styles.perfItem}>
      <Text style={[styles.perfValue, { color: good ? Colors.success : Colors.error }]}>{value}</Text>
      <Text style={styles.perfLabel}>{label}</Text>
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
  tab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 50, backgroundColor: Colors.background },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: Fonts.sizes.sm, color: Colors.grey, fontWeight: '600' },
  tabTextActive: { color: Colors.white },
  earningsCard: { margin: Spacing.lg, borderRadius: Radius.xl, padding: Spacing.xl },
  earningsLabel: { fontSize: Fonts.sizes.sm, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  earningsAmount: { fontSize: 44, fontWeight: '800', color: Colors.white, marginBottom: Spacing.lg },
  earningsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.md, padding: Spacing.md,
  },
  earningsItem: { flex: 1, alignItems: 'center' },
  earningsItemVal: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.white },
  earningsItemLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  earningsDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 4 },
  tipsCard: {
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm,
  },
  tipsTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.dark, marginBottom: Spacing.md },
  performanceRow: { flexDirection: 'row', justifyContent: 'space-around' },
  perfItem: { alignItems: 'center', gap: 4 },
  perfValue: { fontSize: Fonts.sizes.lg, fontWeight: '800' },
  perfLabel: { fontSize: 10, color: Colors.grey },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.dark, marginBottom: Spacing.md },
  deliveryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  deliveryLeft: { flex: 1 },
  deliveryId: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.dark },
  deliveryShop: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 2 },
  deliveryDate: { fontSize: 10, color: Colors.lightGrey, marginTop: 2 },
  deliveryRight: { alignItems: 'flex-end' },
  deliveryEarning: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.success },
  deliveryStatus: { fontSize: 10, color: Colors.success, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: Fonts.sizes.md, color: Colors.grey },
  bankCard: {
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg,
    marginBottom: 32, borderRadius: Radius.xl, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  bankTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.dark, marginBottom: 8 },
  bankText: { fontSize: Fonts.sizes.sm, color: Colors.grey, lineHeight: 20, marginBottom: 14 },
  bankBtn: {
    backgroundColor: Colors.primary, paddingVertical: 10,
    borderRadius: Radius.md, alignItems: 'center',
  },
  bankBtnText: { color: Colors.white, fontWeight: '700', fontSize: Fonts.sizes.sm },
});
