// GalliExpress Customer — Order Tracking Screen

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { formatPrice, getStatusLabel, getStatusColor, formatTime } from '../../../../shared/utils';
import { OrderStatus } from '../../../../shared/theme';

const STATUS_STEPS = [
  { key: OrderStatus.PENDING, label: 'ఆర్డర్ చేశారు', emoji: '📝', desc: 'షాప్ అంగీకరించడం కోసం వేచి ఉంది' },
  { key: OrderStatus.CONFIRMED, label: 'నిర్ధారించబడింది', emoji: '✅', desc: 'షాప్ మీ ఆర్డర్ అంగీకరించింది' },
  { key: OrderStatus.PREPARING, label: 'తయారు చేస్తున్నారు', emoji: '👨‍🍳', desc: 'మీ ఆర్డర్ తయారు చేస్తున్నారు' },
  { key: OrderStatus.READY, label: 'రెడీ అయింది', emoji: '📦', desc: 'రైడర్ కోసం వేచి ఉంది' },
  { key: OrderStatus.ON_THE_WAY, label: 'దారిలో ఉంది', emoji: '🛵', desc: 'రైడర్ డెలివరీ చేస్తున్నాడు' },
  { key: OrderStatus.DELIVERED, label: 'డెలివర్ అయింది', emoji: '🎉', desc: 'ఆర్డర్ డెలివర్ అయింది!' },
];

const STATUS_ORDER = [
  OrderStatus.PENDING, OrderStatus.CONFIRMED,
  OrderStatus.PREPARING, OrderStatus.READY,
  OrderStatus.ON_THE_WAY, OrderStatus.DELIVERED,
];

export default function OrderTrackingScreen({ navigation, route }) {
  const { orderId, order: initialOrder } = route.params;
  const [order, setOrder] = useState(initialOrder);
  const [riderPhone, setRiderPhone] = useState(null);

  useEffect(() => {
    // Real-time listener on Firestore
    const unsubscribe = firestore()
      .collection('orders')
      .doc(orderId)
      .onSnapshot((snap) => {
        if (snap.exists) {
          const data = { id: snap.id, ...snap.data() };
          setOrder(data);
          if (data.riderId) loadRiderPhone(data.riderId);
        }
      });
    return unsubscribe;
  }, [orderId]);

  const loadRiderPhone = async (riderId) => {
    const snap = await firestore().collection('riders').doc(riderId).get();
    if (snap.exists) setRiderPhone(snap.data().phone);
  };

  const currentStatusIndex = STATUS_ORDER.indexOf(order?.status || OrderStatus.PENDING);
  const isCancelled = order?.status === OrderStatus.CANCELLED;
  const isDelivered = order?.status === OrderStatus.DELIVERED;

  const handleCallRider = () => {
    if (riderPhone) Linking.openURL(`tel:${riderPhone}`);
    else Alert.alert('రైడర్ అందుబాటులో లేడు');
  };

  const handleCallShop = () => {
    if (order?.shopPhone) Linking.openURL(`tel:${order.shopPhone}`);
    else Alert.alert('షాప్ నంబర్ అందుబాటులో లేదు');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <LinearGradient
        colors={isCancelled ? [Colors.error, '#C0392B'] : [Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.navigate('HomeTab')}>
            <Ionicons name="home-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.orderId}>#{order?.orderId}</Text>
          <TouchableOpacity>
            <Ionicons name="help-circle-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Current Status */}
        <View style={styles.currentStatus}>
          <Text style={styles.currentStatusEmoji}>
            {isCancelled ? '❌' : STATUS_STEPS[currentStatusIndex]?.emoji || '📝'}
          </Text>
          <Text style={styles.currentStatusLabel}>
            {isCancelled ? 'రద్దు అయింది' : STATUS_STEPS[currentStatusIndex]?.label}
          </Text>
          <Text style={styles.currentStatusDesc}>
            {isCancelled
              ? 'మీ ఆర్డర్ రద్దు అయింది'
              : STATUS_STEPS[currentStatusIndex]?.desc}
          </Text>
          {isDelivered && (
            <View style={styles.deliveredBadge}>
              <Text style={styles.deliveredText}>అభినందనలు! 🎉</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView>
        {/* Status Timeline */}
        {!isCancelled && (
          <View style={[styles.timeline, Shadows.sm]}>
            {STATUS_STEPS.map((step, index) => {
              const isDone = index <= currentStatusIndex;
              const isActive = index === currentStatusIndex;
              const isLast = index === STATUS_STEPS.length - 1;

              return (
                <View key={step.key} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      isDone && styles.timelineDotDone,
                      isActive && styles.timelineDotActive,
                    ]}>
                      {isDone ? (
                        <Text style={styles.timelineEmoji}>{step.emoji}</Text>
                      ) : (
                        <View style={styles.timelineDotEmpty} />
                      )}
                    </View>
                    {!isLast && (
                      <View style={[styles.timelineLine, isDone && styles.timelineLineDone]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[
                      styles.timelineLabel,
                      isDone && { color: Colors.dark, fontWeight: '600' },
                    ]}>
                      {step.label}
                    </Text>
                    {isActive && (
                      <Text style={styles.timelineDesc}>{step.desc}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Contact Buttons */}
        {!isDelivered && !isCancelled && (
          <View style={styles.contactRow}>
            {order?.status === OrderStatus.ON_THE_WAY && riderPhone && (
              <TouchableOpacity style={styles.contactBtn} onPress={handleCallRider}>
                <Ionicons name="call" size={20} color={Colors.white} />
                <Text style={styles.contactBtnText}>రైడర్‌కి కాల్</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.contactBtn, { backgroundColor: Colors.darkGrey }]}
              onPress={handleCallShop}
            >
              <Ionicons name="storefront" size={20} color={Colors.white} />
              <Text style={styles.contactBtnText}>షాప్‌కి కాల్</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Order Details */}
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>ఆర్డర్ వివరాలు</Text>
          {order?.items?.map((item, i) => (
            <View key={i} style={styles.detailRow}>
              <Text style={styles.detailItem}>{item.quantity}x {item.name}</Text>
              <Text style={styles.detailPrice}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailItem, { fontWeight: '700', color: Colors.dark }]}>మొత్తం</Text>
            <Text style={[styles.detailPrice, { fontWeight: '700', color: Colors.dark }]}>
              {formatPrice(order?.total || 0)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailMeta}>చెల్లింపు పద్ధతి</Text>
            <Text style={styles.detailMeta}>{order?.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI'}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>📍 డెలివరీ చిరునామా</Text>
          <Text style={styles.addressText}>{order?.address?.line1}</Text>
          {order?.address?.landmark && (
            <Text style={styles.addressMeta}>లాండ్‌మార్క్: {order.address.landmark}</Text>
          )}
        </View>

        {/* Rate Order (if delivered) */}
        {isDelivered && (
          <View style={styles.rateCard}>
            <Text style={styles.rateTitle}>ఆర్డర్ ఎలా ఉంది?</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star}>
                  <Text style={styles.star}>⭐</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: Spacing.xl },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  orderId: { fontSize: Fonts.sizes.sm, color: 'rgba(255,255,255,0.85)', fontWeight: Fonts.weights.semibold },
  currentStatus: { alignItems: 'center', paddingHorizontal: Spacing.xl },
  currentStatusEmoji: { fontSize: 56, marginBottom: 12 },
  currentStatusLabel: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.bold,
    color: Colors.white,
    marginBottom: 6,
  },
  currentStatusDesc: { fontSize: Fonts.sizes.sm, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  deliveredBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 50,
    marginTop: 12,
  },
  deliveredText: { color: Colors.white, fontWeight: Fonts.weights.bold },
  timeline: {
    backgroundColor: Colors.white,
    margin: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  timelineLeft: { alignItems: 'center', width: 40 },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: { backgroundColor: Colors.success + '20' },
  timelineDotActive: { backgroundColor: Colors.primary + '20' },
  timelineDotEmpty: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.lightGrey },
  timelineEmoji: { fontSize: 18 },
  timelineLine: { width: 2, height: 28, backgroundColor: Colors.border, marginVertical: 2 },
  timelineLineDone: { backgroundColor: Colors.success },
  timelineContent: { flex: 1, paddingBottom: Spacing.md },
  timelineLabel: { fontSize: Fonts.sizes.sm, color: Colors.grey, paddingTop: 8 },
  timelineDesc: { fontSize: Fonts.sizes.xs, color: Colors.primary, marginTop: 2 },
  contactRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  contactBtnText: { color: Colors.white, fontWeight: Fonts.weights.semibold, fontSize: Fonts.sizes.sm },
  detailCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  detailTitle: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.dark, marginBottom: Spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailItem: { fontSize: Fonts.sizes.sm, color: Colors.darkGrey, flex: 1 },
  detailPrice: { fontSize: Fonts.sizes.sm, color: Colors.dark },
  detailMeta: { fontSize: Fonts.sizes.xs, color: Colors.grey },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  addressText: { fontSize: Fonts.sizes.md, color: Colors.dark },
  addressMeta: { fontSize: Fonts.sizes.sm, color: Colors.grey, marginTop: 4 },
  rateCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  rateTitle: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.dark, marginBottom: Spacing.md },
  stars: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 32 },
});
