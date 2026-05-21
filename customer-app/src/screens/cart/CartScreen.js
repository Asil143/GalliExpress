// GalliExpress Customer — Cart Screen v2

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  TextInput, ActivityIndicator, Animated, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { formatPrice, calculateOrderTotal, getDeliveryFee } from '../../../../shared/utils';

const FREE_DELIVERY_THRESHOLD = 300;
const GST_RATE = 0.05; // 5%
const TIP_OPTIONS = [10, 20, 50];
const COINS_PER_RUPEE = 1; // 1 GalliCoin per ₹1 spent

export default function CartScreen({ navigation, route }) {
  const { cartItems: initialItems, shop } = route.params;
  const [items, setItems] = useState(initialItems);
  const [editingQty, setEditingQty] = useState(null); // { itemId, text }

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Tip
  const [selectedTip, setSelectedTip] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [showCustomTip, setShowCustomTip] = useState(false);

  // GalliCoins redemption
  const [userCoins, setUserCoins] = useState(0);
  const [coinsApplied, setCoinsApplied] = useState(false);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;
    firestore().collection('users').doc(user.uid).get().then(snap => {
      if (snap.exists) setUserCoins(snap.data().galliCoins || 0);
    });
  }, []);

  // Calculations
  const subtotal = calculateOrderTotal(items);
  const deliveryFee = getDeliveryFee(subtotal);
  const freeDeliveryProgress = Math.min(subtotal / FREE_DELIVERY_THRESHOLD, 1);
  const remainingForFree = Math.max(FREE_DELIVERY_THRESHOLD - subtotal, 0);

  const gst = Math.round(subtotal * GST_RATE);

  const couponDiscount = appliedCoupon
    ? appliedCoupon.type === 'percent'
      ? Math.round(Math.min((subtotal * appliedCoupon.value) / 100, appliedCoupon.maxDiscount || Infinity))
      : appliedCoupon.value
    : 0;

  // Max coin redemption: up to 50% of subtotal, max what user has (10 coins = ₹1)
  const COINS_REDEEM_RATE = 10;
  const maxCoinDiscount = Math.floor(Math.min(userCoins / COINS_REDEEM_RATE, subtotal * 0.5));
  const coinDiscount = coinsApplied && maxCoinDiscount > 0 ? maxCoinDiscount : 0;
  const coinsUsed = coinDiscount * COINS_REDEEM_RATE;

  const tipAmount = showCustomTip
    ? parseInt(customTip, 10) || 0
    : selectedTip;

  const total = subtotal + deliveryFee + gst - couponDiscount - coinDiscount + tipAmount;
  const galliCoins = Math.floor(total * COINS_PER_RUPEE);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const updateQty = (itemId, delta) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const onQtyFocus = (item) => {
    setEditingQty({ itemId: item.id, text: String(item.quantity) });
  };

  const onQtyChange = (itemId, text) => {
    if (/^\d{0,2}$/.test(text)) setEditingQty({ itemId, text });
  };

  const onQtyBlur = (itemId) => {
    const num = parseInt(editingQty?.text, 10);
    if (!num || num < 1) {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } else {
      setItems((prev) => prev.map((item) => item.id === itemId ? { ...item, quantity: Math.min(num, 99) } : item));
    }
    setEditingQty(null);
  };

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const snap = await firestore().collection('coupons').doc(code).get();
      if (!snap.exists) {
        setCouponError('Invalid coupon code');
        setAppliedCoupon(null);
        return;
      }
      const data = snap.data();
      const now = new Date();
      if (data.expiresAt && data.expiresAt.toDate() < now) {
        setCouponError('This coupon has expired');
        setAppliedCoupon(null);
        return;
      }
      if (data.minOrder && subtotal < data.minOrder) {
        setCouponError(`Min order ₹${data.minOrder} required`);
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon({ code, ...data });
      setCouponError('');
    } catch {
      setCouponError('Unable to apply coupon. Try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Cart is Empty', 'Please add items to continue');
      return;
    }
    navigation.navigate('Checkout', {
      items,
      shop,
      subtotal,
      deliveryFee,
      gst,
      couponDiscount,
      couponCode: appliedCoupon?.code || null,
      coinDiscount,
      coinsUsed,
      tip: tipAmount,
      total,
    });
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyCart}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Cart is Empty</Text>
          <Text style={styles.emptySubtitle}>Add items from a shop to get started</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.shopBtnText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <Text style={styles.headerSub}>{totalItems} item{totalItems !== 1 ? 's' : ''} · {shop?.name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Shop Info */}
        <View style={styles.shopInfo}>
          <Ionicons name="storefront-outline" size={16} color={Colors.primary} />
          <Text style={styles.shopName}>{shop?.name}</Text>
          <Text style={styles.shopCategory}>{shop?.category}</Text>
        </View>

        {/* Free Delivery Progress Bar */}
        {deliveryFee > 0 && (
          <View style={styles.freeDeliveryBar}>
            <Text style={styles.freeDeliveryText}>
              Add <Text style={{ color: Colors.success, fontWeight: Fonts.weights.bold }}>₹{remainingForFree}</Text> more for free delivery 🚀
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${freeDeliveryProgress * 100}%` }]} />
            </View>
          </View>
        )}
        {deliveryFee === 0 && (
          <View style={[styles.freeDeliveryBar, { backgroundColor: Colors.successLight }]}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={[styles.freeDeliveryText, { color: Colors.success, marginLeft: 6 }]}>
              You've unlocked free delivery!
            </Text>
          </View>
        )}

        {/* Cart Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <View style={styles.itemLeft}>
                {item.isVeg !== undefined && (
                  <View style={[styles.vegBox, { borderColor: item.isVeg ? Colors.success : Colors.error }]}>
                    <View style={[styles.vegInner, { backgroundColor: item.isVeg ? Colors.success : Colors.error }]} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemPrice}>{formatPrice(item.price)} each</Text>
                </View>
              </View>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQty(item.id, -1)}
                >
                  <Ionicons
                    name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                    size={15}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
                <TextInput
                  style={styles.qtyInput}
                  value={editingQty?.itemId === item.id ? editingQty.text : String(item.quantity)}
                  onFocus={() => onQtyFocus(item)}
                  onChangeText={(t) => onQtyChange(item.id, t)}
                  onBlur={() => onQtyBlur(item.id)}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  maxLength={2}
                />
                <TouchableOpacity
                  style={[styles.qtyBtn, styles.qtyBtnAdd]}
                  onPress={() => updateQty(item.id, 1)}
                >
                  <Ionicons name="add" size={15} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.lineTotal}>{formatPrice(item.price * item.quantity)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Coupon Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apply Coupon</Text>
          {appliedCoupon ? (
            <View style={styles.couponApplied}>
              <Ionicons name="pricetag" size={16} color={Colors.success} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.couponAppliedCode}>{appliedCoupon.code}</Text>
                <Text style={styles.couponSavings}>
                  You save {formatPrice(couponDiscount)} on this order!
                </Text>
              </View>
              <TouchableOpacity onPress={removeCoupon}>
                <Ionicons name="close-circle" size={22} color={Colors.grey} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.couponRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter coupon code"
                  placeholderTextColor={Colors.lightGrey}
                  value={couponCode}
                  onChangeText={(t) => { setCouponCode(t); setCouponError(''); }}
                  autoCapitalize="characters"
                  returnKeyType="done"
                  onSubmitEditing={applyCoupon}
                />
                <TouchableOpacity
                  style={[styles.applyBtn, couponLoading && { opacity: 0.6 }]}
                  onPress={applyCoupon}
                  disabled={couponLoading}
                >
                  {couponLoading
                    ? <ActivityIndicator size="small" color={Colors.white} />
                    : <Text style={styles.applyBtnText}>Apply</Text>
                  }
                </TouchableOpacity>
              </View>
              {couponError ? (
                <Text style={styles.couponError}>{couponError}</Text>
              ) : null}
            </>
          )}
        </View>

        {/* GalliCoins Redemption */}
        {userCoins >= 10 && (
          <View style={styles.section}>
            <View style={styles.coinsRedeemRow}>
              <View style={styles.coinsRedeemLeft}>
                <Text style={styles.coinEmoji}>🪙</Text>
                <View>
                  <Text style={styles.coinsRedeemTitle}>Use GalliCoins</Text>
                  <Text style={styles.coinsRedeemSub}>
                    {userCoins} coins available · Save {maxCoinDiscount > 0 ? `₹${maxCoinDiscount}` : '₹0'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.coinsToggle, coinsApplied && styles.coinsToggleActive]}
                onPress={() => setCoinsApplied(v => !v)}
                disabled={maxCoinDiscount === 0}
              >
                <Text style={[styles.coinsToggleText, coinsApplied && { color: Colors.white }]}>
                  {coinsApplied ? 'Applied ✓' : 'Apply'}
                </Text>
              </TouchableOpacity>
            </View>
            {coinsApplied && (
              <Text style={styles.coinsUsedNote}>
                {coinsUsed} coins will be deducted from your balance
              </Text>
            )}
          </View>
        )}

        {/* Tip for Delivery Partner — only for UPI/Card payments */}
        <View style={styles.section}>
          <View style={styles.tipHeader}>
            <Text style={styles.sectionTitle}>Tip Your Delivery Partner</Text>
            <Text style={styles.tipSubtitle}>For UPI/Card orders · 100% goes to them 💛</Text>
          </View>
          <View style={styles.tipRow}>
            {TIP_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.tipChip,
                  !showCustomTip && selectedTip === t && styles.tipChipActive,
                ]}
                onPress={() => {
                  setSelectedTip(t);
                  setShowCustomTip(false);
                  setCustomTip('');
                }}
              >
                <Text style={[
                  styles.tipChipText,
                  !showCustomTip && selectedTip === t && styles.tipChipTextActive,
                ]}>₹{t}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.tipChip, showCustomTip && styles.tipChipActive]}
              onPress={() => {
                setShowCustomTip(true);
                setSelectedTip(0);
              }}
            >
              <Text style={[styles.tipChipText, showCustomTip && styles.tipChipTextActive]}>
                Custom
              </Text>
            </TouchableOpacity>
            {selectedTip > 0 && !showCustomTip && (
              <TouchableOpacity onPress={() => setSelectedTip(0)}>
                <Ionicons name="close-circle-outline" size={22} color={Colors.grey} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
          </View>
          {showCustomTip && (
            <View style={styles.customTipRow}>
              <Text style={styles.customTipPrefix}>₹</Text>
              <TextInput
                style={styles.customTipInput}
                placeholder="Enter amount"
                placeholderTextColor={Colors.lightGrey}
                keyboardType="numeric"
                value={customTip}
                onChangeText={setCustomTip}
              />
            </View>
          )}
        </View>

        {/* Bill Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          <View style={styles.bill}>
            <BillRow label="Item Total" value={formatPrice(subtotal)} />
            <BillRow
              label="Delivery Fee"
              value={deliveryFee === 0 ? 'FREE ✓' : formatPrice(deliveryFee)}
              valueColor={deliveryFee === 0 ? Colors.success : Colors.dark}
            />
            <BillRow
              label="GST & Charges (5%)"
              value={formatPrice(gst)}
              info
            />
            {couponDiscount > 0 && (
              <BillRow
                label={`Coupon (${appliedCoupon?.code})`}
                value={`-${formatPrice(couponDiscount)}`}
                valueColor={Colors.success}
              />
            )}
            {coinDiscount > 0 && (
              <BillRow
                label={`GalliCoins (${coinsUsed} coins)`}
                value={`-${formatPrice(coinDiscount)}`}
                valueColor={Colors.success}
              />
            )}
            {tipAmount > 0 && (
              <BillRow label="Delivery Partner Tip" value={formatPrice(tipAmount)} />
            )}
            <View style={styles.billDivider} />
            <BillRow label="Total Payable" value={formatPrice(total)} bold />
          </View>
        </View>

        {/* GalliCoins Preview */}
        <View style={styles.coinsPreview}>
          <Text style={styles.coinEmoji}>🪙</Text>
          <Text style={styles.coinsText}>
            You'll earn <Text style={styles.coinsBold}>{galliCoins} GalliCoins</Text> on this order
          </Text>
        </View>

        {/* Order Safety Note */}
        <View style={styles.safetyNote}>
          <Ionicons name="shield-checkmark-outline" size={14} color={Colors.grey} />
          <Text style={styles.safetyText}>Secure checkout · Cancel within 60 seconds of placing order</Text>
        </View>

      </ScrollView>

      {/* Checkout Bar */}
      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.totalLabel}>Total Payable</Text>
          <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
          {(couponDiscount + coinDiscount) > 0 && (
            <Text style={styles.savingsLabel}>Saved {formatPrice(couponDiscount + coinDiscount)}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.white} style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function BillRow({ label, value, bold, valueColor, info }) {
  return (
    <View style={styles.billRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={[styles.billLabel, bold && styles.billBold]}>{label}</Text>
        {info && <Ionicons name="information-circle-outline" size={12} color={Colors.lightGrey} />}
      </View>
      <Text style={[styles.billValue, bold && styles.billBold, valueColor && { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.dark },
  headerSub: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 1 },

  // Shop Info
  shopInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary + '10',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  shopName: { fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.semibold, color: Colors.primary },
  shopCategory: { fontSize: Fonts.sizes.xs, color: Colors.grey },

  // Free Delivery Bar
  freeDeliveryBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    gap: 0,
  },
  freeDeliveryText: {
    fontSize: Fonts.sizes.xs, color: Colors.dark,
    fontWeight: Fonts.weights.medium, flex: 1, marginBottom: 6,
  },
  progressTrack: {
    height: 4, backgroundColor: Colors.border,
    borderRadius: 4, marginTop: 4, overflow: 'hidden',
  },
  progressFill: {
    height: 4, backgroundColor: Colors.success,
    borderRadius: 4,
  },

  // Section
  section: {
    backgroundColor: Colors.white,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.bold,
    color: Colors.dark, marginBottom: Spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },

  // Cart Items
  cartItem: {
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.background,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  vegBox: {
    width: 13, height: 13, borderRadius: 2,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    marginTop: 3,
  },
  vegInner: { width: 6, height: 6, borderRadius: 3 },
  itemName: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold, color: Colors.dark },
  itemPrice: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 8,
    borderWidth: 1.5, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnAdd: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  qtyInput: {
    fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold,
    color: Colors.dark, minWidth: 36, textAlign: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 6, paddingVertical: 2,
  },
  lineTotal: {
    marginLeft: 'auto', fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold, color: Colors.dark,
  },

  // Coupon
  couponRow: { flexDirection: 'row', gap: 8 },
  couponInput: {
    flex: 1, height: 44, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md,
    fontSize: Fonts.sizes.sm, color: Colors.dark,
    letterSpacing: 1,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', height: 44,
  },
  applyBtnText: { color: Colors.white, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  couponError: { fontSize: Fonts.sizes.xs, color: Colors.error, marginTop: 6 },
  couponApplied: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.successLight, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.success + '40',
  },
  couponAppliedCode: {
    fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.bold,
    color: Colors.success, letterSpacing: 1,
  },
  couponSavings: { fontSize: Fonts.sizes.xs, color: Colors.dark, marginTop: 2 },

  // Tip
  tipHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  tipSubtitle: { fontSize: Fonts.sizes.xs, color: Colors.grey },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  tipChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  tipChipActive: { borderColor: Colors.warning, backgroundColor: Colors.warning + '15' },
  tipChipText: { fontSize: Fonts.sizes.sm, color: Colors.grey, fontWeight: Fonts.weights.medium },
  tipChipTextActive: { color: Colors.warning, fontWeight: Fonts.weights.bold },
  customTipRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.warning,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md,
    height: 44, marginTop: Spacing.sm,
  },
  customTipPrefix: { fontSize: Fonts.sizes.md, color: Colors.dark, marginRight: 4 },
  customTipInput: { flex: 1, fontSize: Fonts.sizes.md, color: Colors.dark },

  // Bill
  bill: { gap: 0 },
  billRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 8,
  },
  billLabel: { fontSize: Fonts.sizes.sm, color: Colors.grey },
  billValue: { fontSize: Fonts.sizes.sm, color: Colors.dark, fontWeight: Fonts.weights.medium },
  billBold: { fontWeight: Fonts.weights.bold, color: Colors.dark, fontSize: Fonts.sizes.md },
  billDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },

  // GalliCoins Preview
  coinsPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF8E7', marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: '#FFD700' + '40',
  },
  coinEmoji: { fontSize: 18 },
  coinsText: { fontSize: Fonts.sizes.sm, color: Colors.dark },
  coinsBold: { fontWeight: Fonts.weights.bold, color: '#B8860B' },

  // GalliCoins Redeem
  coinsRedeemRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  coinsRedeemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  coinsRedeemTitle: { fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.bold, color: Colors.dark },
  coinsRedeemSub: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 1 },
  coinsToggle: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.primary,
  },
  coinsToggleActive: { backgroundColor: Colors.primary },
  coinsToggleText: { fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.bold, color: Colors.primary },
  coinsUsedNote: {
    fontSize: Fonts.sizes.xs, color: Colors.success,
    marginTop: 6, fontWeight: Fonts.weights.medium,
  },

  // Safety Note
  safetyNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  safetyText: { fontSize: Fonts.sizes.xs, color: Colors.grey, flex: 1 },

  // Checkout Bar
  checkoutBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: Colors.border,
    ...Shadows.lg,
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  totalLabel: { fontSize: Fonts.sizes.xs, color: Colors.grey },
  totalAmount: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.dark },
  savingsLabel: { fontSize: 10, color: Colors.success, fontWeight: Fonts.weights.medium },
  checkoutBtn: {
    flex: 1, marginLeft: Spacing.lg,
    backgroundColor: Colors.primary, height: 52,
    borderRadius: Radius.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
  },
  checkoutBtnText: {
    fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.white,
  },

  // Empty Cart
  emptyCart: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji: { fontSize: 72 },
  emptyTitle: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.dark },
  emptySubtitle: { fontSize: Fonts.sizes.sm, color: Colors.grey },
  shopBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.md, marginTop: 8,
  },
  shopBtnText: { color: Colors.white, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
});
