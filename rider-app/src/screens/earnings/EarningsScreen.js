// GalliExpress Rider — Earnings Screen
// Save as: rider-app/src/screens/earnings/EarningsScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { formatPrice, formatDate } from '../../../../shared/utils';
import { OrderStatus } from '../../../../shared/theme';

const PERIODS = ['Today', 'This Week', 'This Month'];
const DELIVERY_FEE = 30;

export default function EarningsScreen() {
  const [period, setPeriod] = useState(0);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankDetails, setBankDetails] = useState({ upiId: '', accountNumber: '', ifsc: '', holderName: '' });
  const [bankSaving, setBankSaving] = useState(false);
  const [riderRating, setRiderRating] = useState(null);
  const [totalTrips, setTotalTrips] = useState(null);
  const user = auth().currentUser;

  useEffect(() => {
    if (!user?.uid) return;
    firestore().collection('riders').doc(user.uid).get().then(snap => {
      if (snap.exists && snap.data().bankDetails) setBankDetails(snap.data().bankDetails);
    });
    // Compute rider rating from the ratings collection (deliveryRating field)
    firestore().collection('ratings').where('riderId', '==', user.uid).get().then(snap => {
      if (snap.size > 0) {
        const avg = snap.docs.reduce((sum, d) => sum + (d.data().deliveryRating || 0), 0) / snap.size;
        setRiderRating(avg.toFixed(1));
      }
    });
    firestore().collection('orders')
      .where('riderId', '==', user.uid)
      .where('status', '==', OrderStatus.DELIVERED)
      .get()
      .then(snap => setTotalTrips(snap.size));
  }, []);

  const saveBankDetails = async () => {
    if (!bankDetails.holderName.trim()) {
      Alert.alert('Required', 'Please enter account holder name');
      return;
    }
    if (!bankDetails.upiId.trim() && !bankDetails.accountNumber.trim()) {
      Alert.alert('Required', 'Please enter UPI ID or bank account number');
      return;
    }
    setBankSaving(true);
    try {
      await firestore().collection('riders').doc(user.uid).update({
        bankDetails,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      setShowBankModal(false);
      Alert.alert('✅ Saved', 'Bank details updated successfully. Payouts every Monday.');
    } catch {
      Alert.alert('Error', 'Failed to save bank details. Try again.');
    } finally {
      setBankSaving(false);
    }
  };

  useEffect(() => { loadEarnings(); }, [period]);

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
        .where('riderId', '==', user?.uid)
        .where('status', '==', OrderStatus.DELIVERED)
        .get();
      const filtered = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((o) => {
          const date = o.createdAt?.toDate?.() || new Date(0);
          return date >= startDate;
        })
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setDeliveries(filtered);
    } catch (e) {
    }
    setLoading(false);
  };

  const totalEarnings = deliveries.length * DELIVERY_FEE;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Earnings</Text>
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
          <Text style={styles.earningsLabel}>Total Earnings</Text>
          <Text style={styles.earningsAmount}>{formatPrice(totalEarnings)}</Text>
          <View style={styles.earningsRow}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsItemVal}>{deliveries.length}</Text>
              <Text style={styles.earningsItemLabel}>Deliveries</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsItemVal}>{formatPrice(DELIVERY_FEE)}</Text>
              <Text style={styles.earningsItemLabel}>Per Delivery</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsItemVal}>
                {deliveries.length > 0 ? formatPrice(totalEarnings / deliveries.length) : '₹0'}
              </Text>
              <Text style={styles.earningsItemLabel}>Average</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Performance */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>🏆 Your Performance</Text>
          <View style={styles.performanceRow}>
            <PerformanceItem
              label="Rating"
              value={riderRating ? `⭐ ${riderRating}` : '—'}
              good={riderRating >= 4}
            />
            <PerformanceItem
              label="Total Trips"
              value={totalTrips !== null ? `${totalTrips}` : '—'}
              good={totalTrips > 0}
            />
            <PerformanceItem
              label="This Period"
              value={`${deliveries.length}`}
              good={deliveries.length > 0}
            />
          </View>
        </View>

        {/* Delivery List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery History</Text>
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ padding: 32 }} />
          ) : deliveries.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🛵</Text>
              <Text style={styles.emptyText}>No deliveries for this period</Text>
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
                  <Text style={styles.deliveryStatus}>✅ Delivered</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Bank Details */}
        <View style={styles.bankCard}>
          <Text style={styles.bankTitle}>💳 Payment Info</Text>
          {bankDetails.holderName ? (
            <>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Name</Text>
                <Text style={styles.bankValue}>{bankDetails.holderName}</Text>
              </View>
              {bankDetails.upiId ? (
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>UPI ID</Text>
                  <Text style={styles.bankValue}>{bankDetails.upiId}</Text>
                </View>
              ) : null}
              {bankDetails.accountNumber ? (
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Account</Text>
                  <Text style={styles.bankValue}>****{bankDetails.accountNumber.slice(-4)}</Text>
                </View>
              ) : null}
              {bankDetails.ifsc ? (
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>IFSC</Text>
                  <Text style={styles.bankValue}>{bankDetails.ifsc}</Text>
                </View>
              ) : null}
              <Text style={[styles.bankText, { marginTop: 10 }]}>Payouts every Monday</Text>
              <TouchableOpacity style={[styles.bankBtn, { backgroundColor: Colors.dark }]} onPress={() => setShowBankModal(true)}>
                <Text style={styles.bankBtnText}>Edit Details</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.bankText}>
                Your earnings are credited to your UPI / bank account every Monday. Add your details to receive payouts.
              </Text>
              <TouchableOpacity style={styles.bankBtn} onPress={() => setShowBankModal(true)}>
                <Text style={styles.bankBtnText}>Add UPI / Bank Details</Text>
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
            <Text style={styles.modalTitle}>💳 Bank / UPI Details</Text>
            <Text style={styles.modalSub}>Your details are encrypted and secure</Text>

            <Text style={styles.fieldLabel}>Account Holder Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Full name as on bank account"
              placeholderTextColor={Colors.lightGrey}
              value={bankDetails.holderName}
              onChangeText={t => setBankDetails(prev => ({ ...prev, holderName: t }))}
            />

            <Text style={styles.fieldLabel}>UPI ID (Recommended)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. yourname@paytm"
              placeholderTextColor={Colors.lightGrey}
              value={bankDetails.upiId}
              onChangeText={t => setBankDetails(prev => ({ ...prev, upiId: t }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.fieldLabel}>Bank Account Number</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 1234567890123456"
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
  bankTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.dark, marginBottom: 10 },
  bankText: { fontSize: Fonts.sizes.sm, color: Colors.grey, lineHeight: 20, marginBottom: 14 },
  bankRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  bankLabel: { fontSize: Fonts.sizes.sm, color: Colors.grey },
  bankValue: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.dark },
  bankBtn: {
    backgroundColor: Colors.primary, paddingVertical: 10,
    borderRadius: Radius.md, alignItems: 'center', marginTop: 12,
  },
  bankBtnText: { color: Colors.white, fontWeight: '700', fontSize: Fonts.sizes.sm },
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
  modalSub: { fontSize: Fonts.sizes.sm, color: Colors.grey },
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
