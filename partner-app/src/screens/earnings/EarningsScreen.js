// GalliExpress Partner — Earnings Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { formatPrice, formatDate } from '../../../../shared/utils';
import { OrderStatus } from '../../../../shared/theme';
import { useShop } from '../../context/ShopContext';

const PERIODS = ['Today', 'This Week', 'This Month'];

export default function EarningsScreen() {
  const { shopId } = useShop();
  const [period, setPeriod] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankDetails, setBankDetails] = useState({ accountHolder: '', accountNumber: '', ifsc: '', upiId: '' });
  const [bankSaving, setBankSaving] = useState(false);
  const COMMISSION_RATE = 0.12;

  useEffect(() => {
    if (!shopId) return;
    firestore().collection('shops').doc(shopId).get().then(snap => {
      if (snap.exists && snap.data().bankDetails) {
        setBankDetails(snap.data().bankDetails);
      }
    });
  }, [shopId]);

  const saveBankDetails = async () => {
    if (!bankDetails.accountHolder.trim()) {
      Alert.alert('Required', 'Please enter account holder name');
      return;
    }
    if (!bankDetails.upiId.trim() && !bankDetails.accountNumber.trim()) {
      Alert.alert('Required', 'Please enter UPI ID or bank account number');
      return;
    }
    setBankSaving(true);
    try {
      await firestore().collection('shops').doc(shopId).update({
        bankDetails,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      setShowBankModal(false);
      Alert.alert('✅ Saved', 'Bank details updated. Payments processed every Monday.');
    } catch {
      Alert.alert('Error', 'Failed to save bank details. Try again.');
    } finally {
      setBankSaving(false);
    }
  };

  useEffect(() => {
    if (shopId) loadEarnings();
  }, [period, shopId]);

  const getStartDate = () => {
    const now = new Date();
    if (period === 0) { now.setHours(0, 0, 0, 0); return now; }
    if (period === 1) { now.setDate(now.getDate() - 7); return now; }
    now.setDate(1); now.setHours(0, 0, 0, 0); return now;
  };

  const loadEarnings = async () => {
    setLoading(true);
    try {
      const startDate = getStartDate();
      const snap = await firestore()
        .collection('orders')
        .where('shopId', '==', shopId)
        .where('status', '==', OrderStatus.DELIVERED)
        .get();
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((o) => {
          const date = o.createdAt?.toDate?.() || new Date(0);
          return date >= startDate;
        })
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setOrders(all);
    } catch (e) {
    }
    setLoading(false);
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalCommission = totalRevenue * COMMISSION_RATE;
  const netEarnings = totalRevenue - totalCommission;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
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
          <Text style={styles.earningsLabel}>Net Earnings</Text>
          <Text style={styles.earningsMain}>{formatPrice(netEarnings)}</Text>
          <View style={styles.earningsRow}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsItemLabel}>Total Sales</Text>
              <Text style={styles.earningsItemValue}>{formatPrice(totalRevenue)}</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsItemLabel}>GalliExpress Commission (12%)</Text>
              <Text style={[styles.earningsItemValue, { color: Colors.error }]}>
                − {formatPrice(totalCommission)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <StatBox value={orders.length} label="Delivered Orders" emoji="📦" />
          <StatBox
            value={orders.length > 0 ? formatPrice(totalRevenue / orders.length) : '₹0'}
            label="Avg Order Value"
            emoji="📊"
          />
        </View>

        {/* Orders List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ padding: 32 }} />
          ) : orders.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💰</Text>
              <Text style={styles.emptyText}>No data for this period</Text>
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
                    Net: {formatPrice(order.total * (1 - COMMISSION_RATE))}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Payout Info */}
        <View style={styles.payoutCard}>
          <Text style={styles.payoutTitle}>💳 Payment Info</Text>
          <Text style={styles.payoutSub}>Commission rate: 12% · Payouts every Monday</Text>
          {bankDetails.accountHolder ? (
            <>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Account Holder</Text>
                <Text style={styles.bankValue}>{bankDetails.accountHolder}</Text>
              </View>
              {bankDetails.upiId ? (
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>UPI ID</Text>
                  <Text style={styles.bankValue}>{bankDetails.upiId}</Text>
                </View>
              ) : null}
              {bankDetails.accountNumber ? (
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Account No.</Text>
                  <Text style={styles.bankValue}>****{bankDetails.accountNumber.slice(-4)}</Text>
                </View>
              ) : null}
              {bankDetails.ifsc ? (
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>IFSC</Text>
                  <Text style={styles.bankValue}>{bankDetails.ifsc}</Text>
                </View>
              ) : null}
              <TouchableOpacity style={[styles.payoutBtn, { marginTop: 14, backgroundColor: Colors.dark }]} onPress={() => setShowBankModal(true)}>
                <Text style={styles.payoutBtnText}>Edit Bank Details</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.payoutText}>
                Add your bank account or UPI ID to receive weekly payouts automatically.
              </Text>
              <TouchableOpacity style={styles.payoutBtn} onPress={() => setShowBankModal(true)}>
                <Text style={styles.payoutBtnText}>Add Bank Details</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bank Details Modal */}
      <Modal visible={showBankModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowBankModal(false)}>
          <TouchableOpacity style={styles.modalCard} activeOpacity={1}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>💳 Bank Account Details</Text>
            <Text style={styles.modalSubText}>Your details are encrypted and secure</Text>

            <Text style={styles.fieldLabel}>Account Holder Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Full name as on bank account"
              placeholderTextColor={Colors.lightGrey}
              value={bankDetails.accountHolder}
              onChangeText={t => setBankDetails(prev => ({ ...prev, accountHolder: t }))}
            />

            <Text style={styles.fieldLabel}>UPI ID (Recommended)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. shopname@paytm"
              placeholderTextColor={Colors.lightGrey}
              value={bankDetails.upiId}
              onChangeText={t => setBankDetails(prev => ({ ...prev, upiId: t }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.fieldLabel}>Bank Account Number</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 1234567890"
              placeholderTextColor={Colors.lightGrey}
              value={bankDetails.accountNumber}
              onChangeText={t => setBankDetails(prev => ({ ...prev, accountNumber: t }))}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>IFSC Code</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. SBIN0001234"
              placeholderTextColor={Colors.lightGrey}
              value={bankDetails.ifsc}
              onChangeText={t => setBankDetails(prev => ({ ...prev, ifsc: t.toUpperCase() }))}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={[styles.modalSaveBtn, bankSaving && { opacity: 0.6 }]}
              onPress={saveBankDetails}
              disabled={bankSaving}
            >
              {bankSaving
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.modalSaveBtnText}>Save Details</Text>
              }
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  payoutTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.dark, marginBottom: 4 },
  payoutSub: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginBottom: 12 },
  payoutText: { fontSize: Fonts.sizes.sm, color: Colors.grey, lineHeight: 20, marginBottom: 14 },
  payoutBtn: {
    backgroundColor: Colors.dark, paddingVertical: 10,
    borderRadius: Radius.md, alignItems: 'center',
  },
  payoutBtnText: { color: Colors.white, fontWeight: '700', fontSize: Fonts.sizes.sm },
  bankRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.border },
  bankLabel: { fontSize: Fonts.sizes.sm, color: Colors.grey },
  bankValue: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.dark },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: Colors.white, borderTopLeftRadius: 28,
    borderTopRightRadius: 28, padding: Spacing.xl, paddingBottom: 40, gap: Spacing.sm,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.sm,
  },
  modalTitle: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.dark },
  modalSubText: { fontSize: Fonts.sizes.sm, color: Colors.grey },
  fieldLabel: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.dark, marginTop: Spacing.sm },
  modalInput: {
    backgroundColor: Colors.background, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    fontSize: Fonts.sizes.md, color: Colors.dark,
  },
  modalSaveBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: Spacing.sm,
  },
  modalSaveBtnText: { color: Colors.white, fontWeight: '800', fontSize: Fonts.sizes.md },
});
