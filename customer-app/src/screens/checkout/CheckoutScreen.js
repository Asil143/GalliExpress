// GalliExpress Customer — Checkout Screen v2

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal, FlatList,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors, Fonts, Spacing, Radius, Shadows, OrderStatus } from '../../../../shared/theme';
import {
  STATE_NAME, DISTRICTS, MANDALS_BY_DISTRICT, fetchVillagesForMandal,
} from '../../addressData';
import { formatPrice, generateOrderId } from '../../../../shared/utils';
import { awardCoinsForOrder } from '../../services/GalliCoinsService';
import { useCart } from '../../context/CartContext';

const GOOGLE_MAPS_KEY = 'AIzaSyAheicA9XT1Ndqyl34xhPBnOPv0lGWM0P0';
const MAX_DELIVERY_KM = 10;

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const PAYMENT_METHODS = [
  { id: 'upi',   label: 'UPI / GPay / PhonePe', emoji: '📲', desc: 'Instant · No charges' },
  { id: 'card',  label: 'Credit / Debit Card',   emoji: '💳', desc: 'Visa, Mastercard, Rupay' },
  { id: 'wallet',label: 'Wallets',               emoji: '👛', desc: 'Paytm, Amazon Pay...' },
  { id: 'cod',   label: 'Cash on Delivery',      emoji: '💵', desc: 'Pay cash at your door' },
];

const SCHEDULE_SLOTS = [
  { id: 'now',      label: 'Deliver Now',        sub: '25–35 min' },
  { id: 'slot1',    label: 'Today 12:00 – 1:00 PM',  sub: 'Lunch slot' },
  { id: 'slot2',    label: 'Today 7:00 – 8:00 PM',   sub: 'Dinner slot' },
  { id: 'tomorrow', label: 'Tomorrow Morning',   sub: '8:00 – 10:00 AM' },
];

export default function CheckoutScreen({ navigation, route }) {
  const {
    items, shop,
    subtotal, deliveryFee, gst = 0,
    couponDiscount = 0, couponCode = null,
    coinDiscount = 0, coinsUsed = 0,
    tip = 0, total,
  } = route.params;

  const user = auth().currentUser;
  const { clearCart } = useCart();

  // Address
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [district, setDistrict]   = useState('');
  const [mandal, setMandal]       = useState('');
  const [village, setVillage]     = useState('');
  const [pincode, setPincode]     = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [picker, setPicker]       = useState(null); // 'district'|'mandal'|'village'
  const [villages, setVillages]             = useState([]);
  const [villagesLoading, setVillagesLoading] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [pinningGps, setPinningGps] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  // Instructions
  const [cookingNote, setCookingNote] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');

  // Schedule
  const [scheduleSlot, setScheduleSlot] = useState('now');

  // Payment
  const [payment, setPayment] = useState('cod');

  // Placing order
  const [loading, setLoading] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  const loadVillages = async (mandalName) => {
    setVillagesLoading(true);
    setVillages([]);
    const result = await fetchVillagesForMandal(mandalName);
    setVillages(result);
    setVillagesLoading(false);
  };

  const pinMyLocation = async () => {
    setPinningGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to pin your exact location.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setSelectedCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch {
      Alert.alert('Error', 'Could not get location. Try again.');
    } finally {
      setPinningGps(false);
    }
  };

  useEffect(() => {
    if (!user?.uid) { setShowNewAddressForm(true); return; }
    const unsub = firestore()
      .collection('addresses')
      .where('userId', '==', user.uid)
      .limit(5)
      .onSnapshot(
        (snap) => {
          const addrs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setSavedAddresses(addrs);
          if (addrs.length > 0) {
            setSelectedAddressId(prev => prev || addrs[0].id);
            setShowNewAddressForm(false);
          } else {
            setShowNewAddressForm(true);
          }
        },
        (e) => {
          setShowNewAddressForm(true);
        }
      );
    return unsub;
  }, []);

  const detectGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to auto-fill address');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setSelectedCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setSelectedAddressId(null);
      setShowNewAddressForm(true);
    } catch {
      Alert.alert('Error', 'Could not detect location. Enter manually.');
    } finally {
      setGpsLoading(false);
    }
  };

  const getActiveAddress = () => {
    if (selectedAddressId) {
      const found = savedAddresses.find(a => a.id === selectedAddressId);
      if (found) return found.address || found.line1 || '';
    }
    const parts = [addressLine, village, mandal, district, STATE_NAME].filter(s => s?.trim());
    if (parts.length > 0) return parts.join(', ') + (pincode ? ' - ' + pincode : '');
    return manualAddress;
  };

  const handlePlaceOrder = async () => {
    const deliveryAddress = getActiveAddress();
    if (!deliveryAddress.trim()) {
      Alert.alert('Address Required', 'Please enter your delivery address to continue');
      return;
    }
    if (shop?.latitude && shop?.longitude && selectedCoords) {
      const dist = haversine(shop.latitude, shop.longitude, selectedCoords.latitude, selectedCoords.longitude);
      if (dist > MAX_DELIVERY_KM) {
        Alert.alert(
          'Outside Delivery Area',
          `Sorry, we don't deliver to this address. Your location is ${dist.toFixed(1)} km from the shop — our maximum delivery range is ${MAX_DELIVERY_KM} km.`,
          [{ text: 'Change Address', style: 'default' }]
        );
        return;
      }
    }
    if (payment !== 'cod') {
      setShowPaymentSheet(true);
      return;
    }
    await submitOrder();
  };

  const handlePaymentConfirm = async () => {
    setPaymentProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setPaymentProcessing(false);
    setPaymentDone(true);
    await new Promise(r => setTimeout(r, 1000));
    setShowPaymentSheet(false);
    setPaymentDone(false);
    await submitOrder();
  };

  const submitOrder = async () => {
    setLoading(true);
    try {
      // Re-fetch shop status from Firestore right before placing — catches closed shops
      const shopSnap = await firestore().collection('shops').doc(shop.id).get();
      if (shopSnap.exists && shopSnap.data().isOpen === false) {
        Alert.alert('Shop Closed', 'This shop has closed and is no longer accepting orders.');
        setLoading(false);
        return;
      }

      const orderId = generateOrderId();
      const selectedAddr = savedAddresses.find(a => a.id === selectedAddressId);

      const orderData = {
        orderId,
        customerId: user.uid,
        customerPhone: user.phoneNumber,
        shopId: shop.id,
        shopName: shop.name,
        shopPhone: shop.phone || null,
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          isVeg: i.isVeg ?? null,
        })),
        address: selectedAddr || {
          address:     getActiveAddress(),
          addressLine: addressLine.trim() || manualAddress,
          village:     village,
          mandal:      mandal,
          district:    district,
          state:       STATE_NAME,
          pincode:     pincode,
          ...(selectedCoords || {}),
        },
        paymentMethod: payment,
        subtotal,
        deliveryFee,
        gst,
        couponDiscount,
        couponCode,
        coinDiscount,
        coinsUsed,
        tip,
        total,
        cookingNote: cookingNote.trim() || null,
        deliveryNote: deliveryNote.trim() || null,
        scheduleSlot,
        status: OrderStatus.PENDING,
        riderId: null,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        town: 'addanki',
      };

      await firestore().collection('orders').doc(orderId).set(orderData);

      // Clear the persisted cart now that the order is placed
      clearCart();

      // Award GalliCoins (fire-and-forget — doesn't block checkout)
      awardCoinsForOrder(orderId, total).catch(() => {});

      // Deduct redeemed coins from user balance
      if (coinsUsed > 0) {
        try {
          await firestore().collection('users').doc(user.uid).update({
            galliCoins: firestore.FieldValue.increment(-coinsUsed),
          });
        } catch (_e) {}
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'OrderTracking', params: { orderId, order: orderData } }],
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeAddress = getActiveAddress();

  const deliveryDistKm = (() => {
    if (!shop?.latitude || !shop?.longitude || !selectedCoords) return null;
    return haversine(shop.latitude, shop.longitude, selectedCoords.latitude, selectedCoords.longitude);
  })();
  const isOutOfRange = deliveryDistKm !== null && deliveryDistKm > MAX_DELIVERY_KM;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >

          {/* ── Delivery Address ─────────────────────────────── */}
          <SectionCard title="📍 Delivery Address">
            {deliveryDistKm !== null && (
              <View style={[styles.distBanner, isOutOfRange ? styles.distBannerError : styles.distBannerOk]}>
                <Ionicons
                  name={isOutOfRange ? 'close-circle-outline' : 'checkmark-circle-outline'}
                  size={15}
                  color={isOutOfRange ? '#DC2626' : '#16A34A'}
                />
                <Text style={[styles.distBannerText, { color: isOutOfRange ? '#DC2626' : '#16A34A' }]}>
                  {isOutOfRange
                    ? `${deliveryDistKm.toFixed(1)} km from shop — outside ${MAX_DELIVERY_KM} km delivery zone`
                    : `${deliveryDistKm.toFixed(1)} km from shop — within delivery area ✓`
                  }
                </Text>
              </View>
            )}
            {/* Saved Addresses */}
            {savedAddresses.map(addr => (
              <TouchableOpacity
                key={addr.id}
                style={[styles.addrOption, selectedAddressId === addr.id && styles.addrOptionActive]}
                onPress={() => {
                  setSelectedAddressId(addr.id);
                  setManualAddress('');
                  setShowNewAddressForm(false);
                  setSelectedCoords(
                    addr.latitude && addr.longitude
                      ? { latitude: addr.latitude, longitude: addr.longitude }
                      : null
                  );
                }}
              >
                <Ionicons
                  name={addr.label?.toLowerCase() === 'work' || addr.type === 'work' ? 'business-outline' : 'home-outline'}
                  size={18}
                  color={selectedAddressId === addr.id ? Colors.primary : Colors.grey}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addrLabel, selectedAddressId === addr.id && { color: Colors.primary }]}>
                    {addr.label || (addr.type ? addr.type.charAt(0).toUpperCase() + addr.type.slice(1) : 'Saved')}
                  </Text>
                  <Text style={styles.addrLine} numberOfLines={2}>
                    {addr.address || addr.line1 || ''}
                  </Text>
                </View>
                {selectedAddressId === addr.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            {/* Add new address toggle */}
            <TouchableOpacity
              style={[styles.addNewAddrBtn, showNewAddressForm && { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' }]}
              onPress={() => {
                setShowNewAddressForm(v => !v);
                if (!showNewAddressForm) {
                  setSelectedAddressId(null);
                  setDistrict(''); setMandal(''); setVillage(''); setPincode('');
                  setAddressLine(''); setVillages([]);
                }
              }}
            >
              <Ionicons name={showNewAddressForm ? 'remove-circle-outline' : 'add-circle-outline'} size={18} color={Colors.primary} />
              <Text style={styles.addNewAddrText}>
                {showNewAddressForm ? 'Cancel new address' : '+ Add new address'}
              </Text>
            </TouchableOpacity>

            {/* New address structured form */}
            {showNewAddressForm && (
              <>
            {/* GPS pin shortcut */}
            <TouchableOpacity style={styles.gpsBtn} onPress={detectGPS} disabled={gpsLoading}>
              {gpsLoading
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <Ionicons name="locate-outline" size={16} color={Colors.primary} />
              }
              <Text style={styles.gpsBtnText}>Pin My GPS Location</Text>
            </TouchableOpacity>

            {/* State — fixed */}
            <Text style={styles.subLabel}>State</Text>
            <View style={[styles.pickerBtn, styles.pickerBtnDisabled, { marginBottom: 8 }]}>
              <Text style={styles.pickerBtnText}>{STATE_NAME}</Text>
              <Ionicons name="lock-closed-outline" size={13} color={Colors.lightGrey} />
            </View>

            {/* District */}
            <Text style={styles.subLabel}>District</Text>
            <TouchableOpacity
              style={[styles.pickerBtn, { marginBottom: 8 }]}
              onPress={() => setPicker('district')}
            >
              <Text style={[styles.pickerBtnText, !district && { color: Colors.lightGrey }]}>
                {district || 'Select district'}
              </Text>
              <Ionicons name="chevron-down" size={15} color={Colors.grey} />
            </TouchableOpacity>

            {/* Mandal */}
            <Text style={styles.subLabel}>Mandal / Tehsil</Text>
            <TouchableOpacity
              style={[styles.pickerBtn, !district && styles.pickerBtnDisabled, { marginBottom: 8 }]}
              onPress={() => district && setPicker('mandal')}
            >
              <Text style={[styles.pickerBtnText, !mandal && { color: Colors.lightGrey }]}>
                {mandal || (district ? 'Select mandal' : 'Select district first')}
              </Text>
              <Ionicons name="chevron-down" size={15} color={district ? Colors.grey : Colors.lightGrey} />
            </TouchableOpacity>

            {/* Village */}
            <Text style={styles.subLabel}>Village / Town</Text>
            <TouchableOpacity
              style={[styles.pickerBtn, !mandal && styles.pickerBtnDisabled, { marginBottom: 8 }]}
              onPress={() => mandal && setPicker('village')}
            >
              <Text style={[styles.pickerBtnText, !village && { color: Colors.lightGrey }]}>
                {village || (mandal ? 'Select village' : 'Select mandal first')}
              </Text>
              <Ionicons name="chevron-down" size={15} color={mandal ? Colors.grey : Colors.lightGrey} />
            </TouchableOpacity>

            {/* Pincode — auto-filled */}
            <Text style={styles.subLabel}>Pincode</Text>
            <TextInput
              style={[styles.input, pincode && { borderColor: Colors.success }]}
              placeholder="Auto-filled on village selection"
              placeholderTextColor={Colors.lightGrey}
              value={pincode}
              keyboardType="numeric"
              maxLength={6}
              onChangeText={setPincode}
            />

            {/* Address line */}
            <Text style={styles.subLabel}>Address Line</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="Door no., colony, near landmark..."
              placeholderTextColor={Colors.lightGrey}
              value={addressLine}
              onChangeText={setAddressLine}
              multiline
              numberOfLines={2}
            />

            {/* Pin exact location */}
            <TouchableOpacity
              style={[styles.gpsBtn, selectedCoords && !selectedAddressId && { backgroundColor: Colors.primary + '10', borderColor: Colors.primary }]}
              onPress={pinMyLocation}
              disabled={pinningGps}
            >
              {pinningGps
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <Ionicons name={selectedCoords && !selectedAddressId ? 'location' : 'locate'} size={16} color={Colors.primary} />
              }
              <Text style={styles.gpsBtnText}>
                {selectedCoords && !selectedAddressId ? 'Location Pinned ✓ — Tap to Re-pin' : 'Pin Exact Location on Map'}
              </Text>
            </TouchableOpacity>

            {/* Mini map preview */}
            {selectedCoords && !selectedAddressId && (
              <View style={{ borderRadius: Radius.md, overflow: 'hidden', marginTop: 6, marginBottom: 4, height: 120, borderWidth: 1, borderColor: Colors.border }}>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={{ flex: 1 }}
                  region={{ ...selectedCoords, latitudeDelta: 0.004, longitudeDelta: 0.004 }}
                  scrollEnabled={false} zoomEnabled={false} pitchEnabled={false} rotateEnabled={false}
                >
                  <Marker coordinate={selectedCoords}>
                    <Text style={{ fontSize: 20 }}>📍</Text>
                  </Marker>
                </MapView>
              </View>
            )}
              </>
            )}
          </SectionCard>

          {/* ── Special Instructions ─────────────────────────── */}
          <SectionCard title="📝 Special Instructions">
            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="Cooking notes — less spicy, no onion, extra sauce..."
              placeholderTextColor={Colors.lightGrey}
              value={cookingNote}
              onChangeText={setCookingNote}
              multiline
              maxLength={120}
            />
            <Text style={styles.charCount}>{cookingNote.length}/120</Text>
            <TextInput
              style={[styles.input, styles.noteInput, { marginTop: 8 }]}
              placeholder="Delivery note — call before coming, leave at door..."
              placeholderTextColor={Colors.lightGrey}
              value={deliveryNote}
              onChangeText={setDeliveryNote}
              multiline
              maxLength={100}
            />
          </SectionCard>

          {/* ── Schedule Delivery ────────────────────────────── */}
          <SectionCard title="🕐 Schedule Delivery">
            {SCHEDULE_SLOTS.map(slot => (
              <TouchableOpacity
                key={slot.id}
                style={[styles.slotRow, scheduleSlot === slot.id && styles.slotRowActive]}
                onPress={() => setScheduleSlot(slot.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.slotLabel, scheduleSlot === slot.id && { color: Colors.primary }]}>
                    {slot.label}
                  </Text>
                  <Text style={styles.slotSub}>{slot.sub}</Text>
                </View>
                <View style={[styles.radio, scheduleSlot === slot.id && styles.radioActive]}>
                  {scheduleSlot === slot.id && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </SectionCard>

          {/* ── Order Summary ─────────────────────────────────── */}
          <SectionCard title="🧾 Order Summary">
            <View style={styles.shopRow}>
              <Ionicons name="storefront-outline" size={15} color={Colors.primary} />
              <Text style={styles.shopLabel}>{shop.name}</Text>
            </View>
            {items.map((item) => (
              <View key={item.id} style={styles.orderItemRow}>
                <Text style={styles.orderItemQty}>{item.quantity}×</Text>
                <Text style={styles.orderItemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.orderItemPrice}>{formatPrice(item.price * item.quantity)}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <BillRow label="Item Total" value={formatPrice(subtotal)} />
            <BillRow label="Delivery" value={deliveryFee === 0 ? 'FREE ✓' : formatPrice(deliveryFee)} valueColor={deliveryFee === 0 ? Colors.success : null} />
            <BillRow label="GST (5%)" value={formatPrice(gst)} />
            {couponDiscount > 0 && <BillRow label={`Coupon (${couponCode})`} value={`-${formatPrice(couponDiscount)}`} valueColor={Colors.success} />}
            {coinDiscount > 0 && <BillRow label={`GalliCoins (${coinsUsed} coins)`} value={`-${formatPrice(coinDiscount)}`} valueColor={Colors.success} />}
            {tip > 0 && <BillRow label="Delivery Tip" value={formatPrice(tip)} />}
            <View style={styles.divider} />
            <BillRow label="Total Payable" value={formatPrice(total)} bold />
          </SectionCard>

          {/* ── Payment Method ────────────────────────────────── */}
          <SectionCard title="💳 Payment Method">
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[styles.paymentOption, payment === method.id && styles.paymentSelected]}
                onPress={() => setPayment(method.id)}
              >
                <Text style={styles.paymentEmoji}>{method.emoji}</Text>
                <View style={styles.paymentInfo}>
                  <Text style={[styles.paymentLabel, payment === method.id && { color: Colors.primary }]}>
                    {method.label}
                  </Text>
                  <Text style={styles.paymentDesc}>{method.desc}</Text>
                </View>
                <View style={[styles.radio, payment === method.id && styles.radioActive]}>
                  {payment === method.id && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
            {payment === 'cod' && (
              <View style={styles.codNote}>
                <Ionicons name="information-circle-outline" size={14} color={Colors.warning} />
                <Text style={styles.codNoteText}>Keep exact change ready for a smooth handover</Text>
              </View>
            )}
          </SectionCard>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Payment Sheet Modal */}
      <Modal visible={showPaymentSheet} transparent animationType="slide">
        <View style={styles.paySheetOverlay}>
          <View style={styles.paySheet}>
            {paymentDone ? (
              <View style={styles.paySuccess}>
                <Text style={{ fontSize: 56 }}>✅</Text>
                <Text style={styles.paySuccessText}>Payment Successful!</Text>
              </View>
            ) : (
              <>
                <View style={styles.paySheetHandle} />
                <Text style={styles.paySheetTitle}>
                  {payment === 'upi' ? '📲 UPI Payment' : payment === 'card' ? '💳 Card Payment' : '👛 Wallet Payment'}
                </Text>
                <Text style={styles.paySheetAmount}>{formatPrice(total)}</Text>
                <Text style={styles.paySheetSub}>
                  {payment === 'upi'
                    ? 'Pay via GPay, PhonePe, Paytm UPI, or any UPI app'
                    : payment === 'card'
                    ? 'Credit card, Debit card (Visa / Mastercard / RuPay)'
                    : 'Paytm Wallet, Amazon Pay, MobiKwik'}
                </Text>
                <View style={styles.paySheetNote}>
                  <Ionicons name="lock-closed-outline" size={13} color={Colors.success} />
                  <Text style={styles.paySheetNoteText}>100% Secure · Encrypted · Powered by Razorpay</Text>
                </View>
                {paymentProcessing ? (
                  <View style={styles.payProcessing}>
                    <ActivityIndicator color={Colors.primary} />
                    <Text style={styles.payProcessingText}>Processing your payment...</Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity style={styles.payBtn} onPress={handlePaymentConfirm}>
                      <Text style={styles.payBtnText}>Pay {formatPrice(total)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.payCancelBtn} onPress={() => setShowPaymentSheet(false)}>
                      <Text style={styles.payCancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Total Payable</Text>
          <Text style={styles.footerTotal}>{formatPrice(total)}</Text>
          {!activeAddress && (
            <Text style={styles.footerAddrWarn}>Add delivery address ↑</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.placeBtn, (loading || !activeAddress.trim() || isOutOfRange) && { opacity: 0.6 }]}
          onPress={handlePlaceOrder}
          disabled={loading || !activeAddress.trim() || isOutOfRange}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark || Colors.primary]}
            style={styles.placeBtnGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
                  <Text style={styles.placeBtnText}>Place Order</Text>
                </>
            }
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Picker Modals ──────────────────────────────────── */}
      <CPickerModal
        visible={picker === 'district'}
        title="Select District"
        items={DISTRICTS}
        selected={district}
        onSelect={d => { setDistrict(d); setMandal(''); setVillage(''); setPincode(''); setVillages([]); setPicker(null); }}
        onClose={() => setPicker(null)}
      />
      <CPickerModal
        visible={picker === 'mandal'}
        title="Select Mandal"
        items={MANDALS_BY_DISTRICT[district] || []}
        selected={mandal}
        onSelect={m => { setMandal(m); setVillage(''); setPincode(''); loadVillages(m); setPicker(null); }}
        onClose={() => setPicker(null)}
      />
      <CPickerModal
        visible={picker === 'village'}
        title="Select Village / Town"
        items={villages.map(v => v.name)}
        selected={village}
        loading={villagesLoading}
        onSelect={name => {
          const v = villages.find(x => x.name === name);
          setVillage(name);
          if (v?.pincode) setPincode(v.pincode);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    </SafeAreaView>
  );
}

// ── Picker modal ─────────────────────────────────────────────────────────────

function CPickerModal({ visible, title, items, selected, onSelect, onClose, loading = false }) {
  const [search, setSearch] = React.useState('');
  const filtered = items.filter(item => item.toLowerCase().includes(search.toLowerCase()));
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        <View style={pm.sheet}>
          <View style={pm.handle} />
          <Text style={pm.title}>{title}</Text>
          {!loading && (
            <View style={pm.searchBox}>
              <Ionicons name="search-outline" size={15} color={Colors.grey} />
              <TextInput
                style={pm.searchInput}
                placeholder={`Search ${title.toLowerCase()}...`}
                placeholderTextColor={Colors.lightGrey}
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color={Colors.lightGrey} />
                </TouchableOpacity>
              )}
            </View>
          )}
          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={{ fontSize: Fonts.sizes.sm, color: Colors.grey }}>Loading villages...</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item, i) => String(i)}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 340 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[pm.row, selected === item && pm.rowActive]}
                  onPress={() => { onSelect(item); setSearch(''); }}
                >
                  <Text style={[pm.rowText, selected === item && pm.rowTextActive]}>{item}</Text>
                  {selected === item && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={pm.empty}>
                  {items.length === 0 ? 'No villages found for this mandal' : `No results for "${search}"`}
                </Text>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  sheet:      { backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, paddingHorizontal: Spacing.lg },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginVertical: 12 },
  title:      { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.dark, marginBottom: 12 },
  searchBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, marginBottom: 8, height: 42 },
  searchInput:{ flex: 1, fontSize: Fonts.sizes.sm, color: Colors.dark },
  row:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.border + '60' },
  rowActive:  { backgroundColor: Colors.primary + '08' },
  rowText:    { fontSize: Fonts.sizes.sm, color: Colors.dark },
  rowTextActive: { color: Colors.primary, fontWeight: Fonts.weights.semibold },
  empty:      { textAlign: 'center', color: Colors.grey, paddingVertical: 24, fontSize: Fonts.sizes.sm },
});

// ── Reusable Components ──────────────────────────────────────────────────────

function SectionCard({ title, children }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BillRow({ label, value, bold, valueColor }) {
  return (
    <View style={styles.billRow}>
      <Text style={[styles.billLabel, bold && styles.billBold]}>{label}</Text>
      <Text style={[styles.billValue, bold && styles.billBold, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.dark },

  sectionCard: {
    backgroundColor: Colors.white,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold,
    color: Colors.dark, marginBottom: Spacing.md,
  },

  // Address
  addrOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: 8,
  },
  addrOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  addrLabel: { fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.bold, color: Colors.grey, textTransform: 'uppercase' },
  addrLine: { fontSize: Fonts.sizes.sm, color: Colors.dark, marginTop: 2 },
  addNewAddrBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: Radius.md, padding: Spacing.md, marginTop: 4, marginBottom: 8,
  },
  addNewAddrText: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: Fonts.weights.semibold },

  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: Radius.md, padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  gpsBtnText: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: Fonts.weights.semibold },

  input: {
    height: 44, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md,
    fontSize: Fonts.sizes.sm, color: Colors.dark,
    marginBottom: Spacing.sm, backgroundColor: Colors.white,
  },
  noteInput: { height: 70, textAlignVertical: 'top', paddingTop: Spacing.sm },
  charCount: { fontSize: 10, color: Colors.lightGrey, textAlign: 'right', marginTop: -6, marginBottom: 4 },

  subLabel: { fontSize: Fonts.sizes.xs, color: Colors.grey, fontWeight: Fonts.weights.medium, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },

  pickerBtn: {
    height: 44, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, backgroundColor: Colors.white,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  pickerBtnDisabled: { backgroundColor: Colors.background },
  pickerBtnText: { fontSize: Fonts.sizes.sm, color: Colors.dark, flex: 1 },

  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
  },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { fontSize: Fonts.sizes.xs, color: Colors.grey },
  typeChipTextActive: { color: Colors.white, fontWeight: Fonts.weights.bold },

  // Schedule
  slotRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: 8,
  },
  slotRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  slotLabel: { fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.semibold, color: Colors.dark },
  slotSub: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 2 },

  // Order Items
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  shopLabel: { fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.semibold, color: Colors.primary },
  orderItemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 5,
  },
  orderItemQty: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: Fonts.weights.bold, minWidth: 22 },
  orderItemName: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.dark },
  orderItemPrice: { fontSize: Fonts.sizes.sm, color: Colors.dark, fontWeight: Fonts.weights.medium },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },

  // Bill
  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  billLabel: { fontSize: Fonts.sizes.sm, color: Colors.grey },
  billValue: { fontSize: Fonts.sizes.sm, color: Colors.dark, fontWeight: Fonts.weights.medium },
  billBold: { fontWeight: Fonts.weights.bold, color: Colors.dark, fontSize: Fonts.sizes.md },

  // Payment
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: 8,
  },
  paymentSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  paymentEmoji: { fontSize: 26 },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold, color: Colors.dark },
  paymentDesc: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 2 },
  codNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF8E7', borderRadius: Radius.sm,
    padding: Spacing.sm, marginTop: 4,
  },
  codNoteText: { fontSize: Fonts.sizes.xs, color: Colors.dark, flex: 1 },

  // Distance banner
  distBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 7,
    marginBottom: Spacing.sm,
  },
  distBannerOk: { backgroundColor: '#F0FDF4' },
  distBannerError: { backgroundColor: '#FEF2F2' },
  distBannerText: { fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.medium, flex: 1 },

  // Radio
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.lightGrey,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.primary },

  // Footer
  footer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: Colors.border,
    ...Shadows.lg,
  },
  footerLabel: { fontSize: Fonts.sizes.xs, color: Colors.grey },
  footerTotal: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.dark },
  footerAddrWarn: { fontSize: 10, color: Colors.error, marginTop: 2 },
  placeBtn: { flex: 1, marginLeft: Spacing.lg, borderRadius: Radius.md, overflow: 'hidden' },
  placeBtnGradient: {
    height: 52, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  placeBtnText: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.white },

  // Payment Sheet
  paySheetOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  paySheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.xl, paddingBottom: 40,
    alignItems: 'center',
  },
  paySheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, marginBottom: Spacing.lg,
  },
  paySheetTitle: {
    fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold,
    color: Colors.dark, marginBottom: 4,
  },
  paySheetAmount: {
    fontSize: 32, fontWeight: Fonts.weights.heavy,
    color: Colors.primary, marginBottom: Spacing.sm,
  },
  paySheetSub: {
    fontSize: Fonts.sizes.sm, color: Colors.grey,
    textAlign: 'center', marginBottom: Spacing.md,
  },
  paySheetNote: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginBottom: Spacing.xl,
  },
  paySheetNoteText: { fontSize: Fonts.sizes.xs, color: Colors.success },
  payBtn: {
    backgroundColor: Colors.primary, width: '100%',
    paddingVertical: 16, borderRadius: Radius.lg,
    alignItems: 'center', marginBottom: Spacing.sm,
  },
  payBtnText: { color: Colors.white, fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold },
  payCancelBtn: { paddingVertical: 10 },
  payCancelText: { color: Colors.grey, fontSize: Fonts.sizes.md },
  payProcessing: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: Spacing.xl },
  payProcessingText: { fontSize: Fonts.sizes.md, color: Colors.dark },
  paySuccess: { alignItems: 'center', gap: 12, paddingVertical: Spacing.xl },
  paySuccessText: {
    fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.success,
  },
});
