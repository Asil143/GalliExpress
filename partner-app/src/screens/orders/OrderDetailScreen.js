// GalliExpress Partner — Order Detail Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../../shared/theme';

const STATUS_FLOW = [
  { key: 'pending', label: 'పెండింగ్', icon: 'time-outline' },
  { key: 'confirmed', label: 'కన్ఫర్మ్', icon: 'checkmark-circle-outline' },
  { key: 'preparing', label: 'తయారు చేస్తున్నాం', icon: 'restaurant-outline' },
  { key: 'ready', label: 'రెడీ', icon: 'bag-check-outline' },
];

export default function OrderDetailScreen({ navigation, route }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const unsub = firestore()
      .collection('orders')
      .doc(orderId)
      .onSnapshot((doc) => {
        if (doc.exists) setOrder({ id: doc.id, ...doc.data() });
      });
    return unsub;
  }, [orderId]);

  const updateStatus = async (newStatus) => {
    Alert.alert('స్టేటస్ అప్‌డేట్', `ఆర్డర్‌ను "${newStatus}" కి మార్చాలా?`, [
      { text: 'రద్దు', style: 'cancel' },
      {
        text: 'అవును',
        onPress: async () => {
          setUpdating(true);
          try {
            await firestore().collection('orders').doc(orderId).update({
              status: newStatus,
              [`${newStatus}At`]: firestore.FieldValue.serverTimestamp(),
            });
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  const cancelOrder = () => {
    Alert.alert('ఆర్డర్ రద్దు', 'ఈ ఆర్డర్‌ను రద్దు చేయాలా?', [
      { text: 'వద్దు', style: 'cancel' },
      {
        text: 'రద్దు చేయి',
        style: 'destructive',
        onPress: async () => {
          await firestore().collection('orders').doc(orderId).update({
            status: 'cancelled',
            cancelledAt: firestore.FieldValue.serverTimestamp(),
            cancelledBy: 'partner',
          });
          navigation.goBack();
        },
      },
    ]);
  };

  if (!order) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const currentIndex = STATUS_FLOW.findIndex((s) => s.key === order.status);
  const nextStatus = STATUS_FLOW[currentIndex + 1];
  const canCancel = ['pending', 'confirmed'].includes(order.status);

  const totalAmount = order.items?.reduce((sum, i) => sum + i.price * i.qty, 0) || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>ఆర్డర్ #{order.orderNumber || orderId.slice(-6).toUpperCase()}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Timeline */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ఆర్డర్ స్థితి</Text>
          <View style={styles.timeline}>
            {STATUS_FLOW.map((step, i) => {
              const done = i <= currentIndex;
              return (
                <View key={step.key} style={styles.timelineStep}>
                  <View style={[styles.timelineDot, done && styles.timelineDotDone]}>
                    <Ionicons name={step.icon} size={14} color={done ? Colors.white : Colors.lightGrey} />
                  </View>
                  {i < STATUS_FLOW.length - 1 && (
                    <View style={[styles.timelineLine, done && i < currentIndex && styles.timelineLineDone]} />
                  )}
                  <Text style={[styles.timelineLabel, done && styles.timelineLabelDone]}>
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>కస్టమర్ వివరాలు</Text>
          <View style={styles.row}>
            <Ionicons name="person-outline" size={16} color={Colors.grey} />
            <Text style={styles.infoText}>{order.customerName || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="call-outline" size={16} color={Colors.grey} />
            <Text style={styles.infoText}>{order.customerPhone || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={16} color={Colors.grey} />
            <Text style={styles.infoText}>{order.deliveryAddress || '—'}</Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ఆర్డర్ వస్తువులు</Text>
          {(order.items || []).map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.qty}x</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price * item.qty}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>మొత్తం</Text>
            <Text style={styles.totalAmount}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* Payment */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="cash-outline" size={16} color={Colors.grey} />
            <Text style={styles.infoText}>
              {order.paymentMethod === 'cod' ? 'క్యాష్ ఆన్ డెలివరీ' : 'UPI పేమెంట్'}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {nextStatus && order.status !== 'cancelled' && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => updateStatus(nextStatus.key)}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>
                  → {nextStatus.label} కి మార్చు
                </Text>
              )}
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={cancelOrder}>
              <Text style={styles.cancelBtnText}>ఆర్డర్ రద్దు చేయి</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.dark },
  card: {
    backgroundColor: Colors.white,
    margin: Spacing.lg,
    marginBottom: 0,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
    color: Colors.dark,
    marginBottom: Spacing.md,
  },
  timeline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  timelineStep: { alignItems: 'center', flex: 1 },
  timelineDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotDone: { backgroundColor: Colors.primary },
  timelineLine: {
    position: 'absolute',
    top: 14,
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: Colors.border,
  },
  timelineLineDone: { backgroundColor: Colors.primary },
  timelineLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.grey,
    marginTop: 6,
    textAlign: 'center',
  },
  timelineLabelDone: { color: Colors.primary, fontWeight: Fonts.weights.semibold },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  infoText: { fontSize: Fonts.sizes.sm, color: Colors.darkGrey, flex: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  itemQty: { fontSize: Fonts.sizes.sm, color: Colors.grey, width: 28 },
  itemName: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.dark },
  itemPrice: { fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.semibold, color: Colors.dark },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.dark },
  totalAmount: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.primary },
  actions: { padding: Spacing.lg, gap: Spacing.md },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: Colors.white, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
  cancelBtn: {
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { color: Colors.error, fontWeight: Fonts.weights.semibold, fontSize: Fonts.sizes.md },
});
