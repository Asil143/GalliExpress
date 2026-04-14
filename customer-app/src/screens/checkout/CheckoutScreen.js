// GalliExpress Customer — Checkout Screen

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { formatPrice, generateOrderId } from '../../../../shared/utils';
import { OrderStatus } from '../../../../shared/theme';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI / GPay / PhonePe', emoji: '📲', description: 'తక్షణ చెల్లింపు' },
  { id: 'cod', label: 'Cash on Delivery', emoji: '💵', description: 'డెలివరీ వద్ద నగదు' },
];

export default function CheckoutScreen({ navigation, route }) {
  const { items, shop, subtotal, deliveryFee, total } = route.params;
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [payment, setPayment] = useState('cod');
  const [loading, setLoading] = useState(false);

  const user = auth().currentUser;

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      Alert.alert('చిరునామా అవసరం', 'దయచేసి మీ చిరునామా నమోదు చేయండి');
      return;
    }

    setLoading(true);
    try {
      const orderId = generateOrderId();
      const orderData = {
        orderId,
        customerId: user.uid,
        customerPhone: user.phoneNumber,
        shopId: shop.id,
        shopName: shop.name,
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        address: { line1: address, landmark },
        paymentMethod: payment,
        subtotal,
        deliveryFee,
        total,
        status: OrderStatus.PENDING,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        town: 'addanki',
      };

      await firestore().collection('orders').doc(orderId).set(orderData);

      // Navigate to tracking
      navigation.reset({
        index: 0,
        routes: [{ name: 'OrderTracking', params: { orderId, order: orderData } }],
      });
    } catch (e) {
      Alert.alert('తప్పు జరిగింది', 'ఆర్డర్ చేయడంలో వైఫల్యం. మళ్ళీ ప్రయత్నించండి.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>చెక్అవుట్</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 డెలివరీ చిరునామా</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.input}
              placeholder="ఇంటి నంబర్, వీధి పేరు..."
              placeholderTextColor={Colors.lightGrey}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
            />
            <View style={styles.inputDivider} />
            <TextInput
              style={[styles.input, { paddingTop: Spacing.sm }]}
              placeholder="లాండ్‌మార్క్ (ఐచ్ఛికం) — స్కూల్ దగ్గర, టవర్ పక్కన..."
              placeholderTextColor={Colors.lightGrey}
              value={landmark}
              onChangeText={setLandmark}
            />
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧾 ఆర్డర్ సారాంశం</Text>
          <View style={[styles.card, Shadows.sm]}>
            <Text style={styles.shopLabel}>{shop.name}</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.orderItemRow}>
                <Text style={styles.orderItemName}>{item.quantity}x {item.name}</Text>
                <Text style={styles.orderItemPrice}>{formatPrice(item.price * item.quantity)}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <BillRow label="వస్తువుల మొత్తం" value={formatPrice(subtotal)} />
            <BillRow
              label="డెలివరీ"
              value={deliveryFee === 0 ? 'ఉచితం ✓' : formatPrice(deliveryFee)}
              highlight={deliveryFee === 0}
            />
            <View style={styles.divider} />
            <BillRow label="మొత్తం చెల్లింపు" value={formatPrice(total)} bold />
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 చెల్లింపు పద్ధతి</Text>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[styles.paymentOption, payment === method.id && styles.paymentSelected]}
              onPress={() => setPayment(method.id)}
            >
              <Text style={styles.paymentEmoji}>{method.emoji}</Text>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentLabel}>{method.label}</Text>
                <Text style={styles.paymentDesc}>{method.description}</Text>
              </View>
              <View style={[styles.radio, payment === method.id && styles.radioSelected]}>
                {payment === method.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Place Order */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>చెల్లించాల్సింది</Text>
          <Text style={styles.footerTotal}>{formatPrice(total)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderBtn, loading && { opacity: 0.7 }]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.placeOrderGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.placeOrderText}>ఆర్డర్ చేయండి ✓</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function BillRow({ label, value, bold, highlight }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ fontSize: 13, color: bold ? Colors.dark : Colors.grey, fontWeight: bold ? '700' : '400' }}>{label}</Text>
      <Text style={{ fontSize: 13, color: highlight ? Colors.success : bold ? Colors.dark : Colors.dark, fontWeight: bold ? '700' : '500' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  headerTitle: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.dark },
  section: { marginTop: Spacing.lg, paddingHorizontal: Spacing.lg },
  sectionTitle: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.dark, marginBottom: Spacing.sm },
  inputCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  input: { fontSize: Fonts.sizes.md, color: Colors.dark, minHeight: 40 },
  inputDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  shopLabel: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: Fonts.weights.semibold, marginBottom: 10 },
  orderItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderItemName: { fontSize: Fonts.sizes.sm, color: Colors.dark, flex: 1 },
  orderItemPrice: { fontSize: Fonts.sizes.sm, color: Colors.dark, fontWeight: Fonts.weights.medium },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  paymentSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  paymentEmoji: { fontSize: 28 },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold, color: Colors.dark },
  paymentDesc: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.lightGrey,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.lg,
  },
  footerLabel: { fontSize: Fonts.sizes.xs, color: Colors.grey },
  footerTotal: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.dark },
  placeOrderBtn: { flex: 1, borderRadius: Radius.md, overflow: 'hidden', marginLeft: Spacing.lg },
  placeOrderGradient: { height: 52, alignItems: 'center', justifyContent: 'center' },
  placeOrderText: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.white },
});
