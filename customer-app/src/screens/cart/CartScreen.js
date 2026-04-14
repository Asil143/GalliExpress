// GalliExpress Customer — Cart Screen

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { formatPrice, calculateOrderTotal, getDeliveryFee } from '../../../../shared/utils';

export default function CartScreen({ navigation, route }) {
  const { cartItems: initialItems, shop } = route.params;
  const [items, setItems] = useState(initialItems);

  const updateQty = (itemId, delta) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const subtotal = calculateOrderTotal(items);
  const deliveryFee = getDeliveryFee(subtotal);
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('కార్ట్ ఖాళీగా ఉంది', 'దయచేసి వస్తువులు జోడించండి');
      return;
    }
    navigation.navigate('Checkout', { items, shop, subtotal, deliveryFee, total });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>మీ కార్ట్</Text>
        <Text style={styles.itemCount}>{items.length} వస్తువులు</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyCart}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>కార్ట్ ఖాళీగా ఉంది</Text>
          <Text style={styles.emptySubtitle}>వస్తువులు జోడించి ఆర్డర్ చేయండి</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.shopBtnText}>షాపింగ్ కొనసాగించండి</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Shop info */}
          <View style={styles.shopInfo}>
            <Ionicons name="storefront-outline" size={18} color={Colors.primary} />
            <Text style={styles.shopName}>{shop?.name}</Text>
          </View>

          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item }) => (
              <View style={[styles.cartItem, Shadows.sm]}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                </View>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, -1)}>
                    <Ionicons name={item.quantity === 1 ? 'trash-outline' : 'remove'} size={16} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.qty}>{item.quantity}</Text>
                  <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => updateQty(item.id, 1)}>
                    <Ionicons name="add" size={16} color={Colors.white} />
                  </TouchableOpacity>
                  <Text style={styles.lineTotal}>{formatPrice(item.price * item.quantity)}</Text>
                </View>
              </View>
            )}
            ListFooterComponent={
              <View style={styles.bill}>
                <Text style={styles.billTitle}>బిల్లు వివరాలు</Text>
                <BillRow label="వస్తువుల మొత్తం" value={formatPrice(subtotal)} />
                <BillRow
                  label="డెలివరీ చార్జ్"
                  value={deliveryFee === 0 ? 'ఉచితం ✓' : formatPrice(deliveryFee)}
                  highlight={deliveryFee === 0}
                />
                {deliveryFee > 0 && (
                  <Text style={styles.freeDeliveryHint}>
                    ₹{300 - subtotal} మరింత కొనండి — ఉచిత డెలివరీ!
                  </Text>
                )}
                <View style={styles.divider} />
                <BillRow label="మొత్తం చెల్లింపు" value={formatPrice(total)} bold />
              </View>
            }
          />

          {/* Checkout Button */}
          <View style={styles.checkoutBar}>
            <View>
              <Text style={styles.totalLabel}>మొత్తం</Text>
              <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
              <Text style={styles.checkoutBtnText}>చెక్అవుట్ చేయండి →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function BillRow({ label, value, bold, highlight }) {
  return (
    <View style={styles.billRow}>
      <Text style={[styles.billLabel, bold && { fontWeight: '700', color: '#1C1C2E' }]}>{label}</Text>
      <Text style={[styles.billValue, bold && { fontWeight: '700', color: '#1C1C2E' }, highlight && { color: '#00C851' }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { marginRight: Spacing.md },
  headerTitle: { flex: 1, fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.dark },
  itemCount: { fontSize: Fonts.sizes.sm, color: Colors.grey },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary + '10',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  shopName: { fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.semibold, color: Colors.primary },
  cartItem: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  itemInfo: { marginBottom: Spacing.sm },
  itemName: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold, color: Colors.dark },
  itemPrice: { fontSize: Fonts.sizes.sm, color: Colors.grey, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnAdd: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  qty: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.dark, minWidth: 24, textAlign: 'center' },
  lineTotal: { marginLeft: 'auto', fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.dark },
  bill: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  billTitle: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.dark, marginBottom: Spacing.md },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  billLabel: { fontSize: Fonts.sizes.sm, color: Colors.grey },
  billValue: { fontSize: Fonts.sizes.sm, color: Colors.dark, fontWeight: '500' },
  freeDeliveryHint: {
    fontSize: Fonts.sizes.xs,
    color: Colors.success,
    marginBottom: 10,
    fontWeight: Fonts.weights.medium,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  checkoutBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.lg,
  },
  totalLabel: { fontSize: Fonts.sizes.xs, color: Colors.grey },
  totalAmount: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.dark },
  checkoutBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.lg,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.white },
  emptyCart: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji: { fontSize: 72 },
  emptyTitle: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.dark },
  emptySubtitle: { fontSize: Fonts.sizes.sm, color: Colors.grey },
  shopBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    marginTop: 8,
  },
  shopBtnText: { color: Colors.white, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
});
