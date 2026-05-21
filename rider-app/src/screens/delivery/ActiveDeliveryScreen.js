// GalliExpress Rider — Active Delivery Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, Alert,
  ScrollView, Image, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { formatPrice } from '../../../../shared/utils';
import { OrderStatus } from '../../../../shared/theme';

const DELIVERY_STEPS = [
  { key: 'waiting',    label: 'Food being prepared', emoji: '👨‍🍳', color: Colors.warning },
  { key: 'pickup',    label: 'Ready — Pick up now',  emoji: '🏪',  color: Colors.primary },
  { key: 'delivering', label: 'On the way',          emoji: '🛵',  color: Colors.secondary },
  { key: 'done',      label: 'Delivered ✓',          emoji: '✅',  color: Colors.success },
];

function getStep(status) {
  switch (status) {
    case OrderStatus.CONFIRMED:
    case OrderStatus.PREPARING:  return 'waiting';
    case OrderStatus.READY:      return 'pickup';
    case OrderStatus.ON_THE_WAY: return 'delivering';
    case OrderStatus.DELIVERED:  return 'done';
    default:                     return 'waiting';
  }
}

export default function ActiveDeliveryScreen({ navigation, route }) {
  const { orderId, order: initialOrder } = route.params;
  const [order, setOrder] = useState(initialOrder);
  const [riderLocation, setRiderLocation] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [cashCollected, setCashCollected] = useState(false);

  // Photo confirmation state
  const [photoModal, setPhotoModal] = useState(null); // 'pickup' | 'delivery' | null
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  const user = auth().currentUser;
  const step = getStep(order?.status);

  useEffect(() => {
    const unsub = firestore()
      .collection('orders')
      .doc(orderId)
      .onSnapshot((snap) => {
        if (snap?.exists) setOrder({ id: snap.id, ...snap.data() });
      });

    let locationSub;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        locationSub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
          (loc) => {
            setRiderLocation(loc.coords);
            firestore().collection('orders').doc(orderId).update({
              riderLocation: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
            });
          }
        );
      }
    })();

    return () => { unsub(); locationSub?.remove(); };
  }, [orderId]);

  // ── Photo helpers ────────────────────────────────────────────────────────────

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Required', 'Please allow camera access to take a proof photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      allowsEditing: false,
    });
    if (!result.canceled) setCapturedPhoto(result.assets[0].uri);
  };

  const uploadPhoto = async (uri, type) => {
    const path = `orders/${orderId}/${type}_${Date.now()}.jpg`;
    const ref = storage().ref(path);
    await ref.putFile(uri);
    return ref.getDownloadURL();
  };

  // ── Pickup flow ──────────────────────────────────────────────────────────────

  const startPickupPhoto = () => {
    setCapturedPhoto(null);
    setPhotoModal('pickup');
  };

  const confirmPickup = async () => {
    if (!capturedPhoto) { Alert.alert('Photo Required', 'Please take a photo of the items first.'); return; }
    setUploading(true);
    try {
      const url = await uploadPhoto(capturedPhoto, 'pickup');
      await firestore().collection('orders').doc(orderId).update({
        status: OrderStatus.ON_THE_WAY,
        pickupPhotoUrl: url,
        pickedUpAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      setPhotoModal(null);
      setCapturedPhoto(null);
    } catch (e) {
      Alert.alert('Error', 'Could not confirm pickup. Try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Delivery flow ────────────────────────────────────────────────────────────

  const startDeliveryPhoto = () => {
    setCapturedPhoto(null);
    setPhotoModal('delivery');
  };

  const confirmDelivery = async () => {
    if (!capturedPhoto) { Alert.alert('Photo Required', 'Please take a proof of delivery photo first.'); return; }
    setUploading(true);
    try {
      const url = await uploadPhoto(capturedPhoto, 'delivery');
      await firestore().collection('orders').doc(orderId).update({
        status: OrderStatus.DELIVERED,
        deliveryPhotoUrl: url,
        deliveredAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      await firestore().collection('riders').doc(user?.uid).update({
        totalDeliveries: firestore.FieldValue.increment(1),
        totalEarnings: firestore.FieldValue.increment(30),
      });
      setPhotoModal(null);
      setCapturedPhoto(null);
      setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'HomeTab' }] }), 2000);
    } catch (e) {
      Alert.alert('Error', 'Could not confirm delivery. Try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Misc ─────────────────────────────────────────────────────────────────────

  const openNavigation = (address) => {
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address || 'Addanki')}`);
  };

  const callCustomer = () => {
    if (order?.customerPhone) Linking.openURL(`tel:${order.customerPhone}`);
    else Alert.alert('Number not available');
  };

  const currentStep = DELIVERY_STEPS.find((s) => s.key === step);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={[currentStep.color, currentStep.color + 'CC']} style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerEmoji}>{currentStep.emoji}</Text>
          <View style={styles.headerInfo}>
            <Text style={styles.headerLabel}>{currentStep.label}</Text>
            <Text style={styles.orderId}>#{order?.orderId}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView>
        {/* Map */}
        {riderLocation && (
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: riderLocation.latitude,
                longitude: riderLocation.longitude,
                latitudeDelta: 0.01, longitudeDelta: 0.01,
              }}
            >
              <Marker coordinate={riderLocation} title="You">
                <View style={styles.riderMarker}><Text style={{ fontSize: 20 }}>🛵</Text></View>
              </Marker>
            </MapView>
          </View>
        )}

        {/* Pickup Location */}
        {step === 'pickup' && (
          <View style={[styles.locationCard, Shadows.md]}>
            <View style={styles.locationHeader}>
              <View style={[styles.locationDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.locationTitle}>Pickup Location</Text>
            </View>
            <Text style={styles.locationName}>{order?.shopName}</Text>
            <Text style={styles.locationAddress}>Addanki, Prakasam District</Text>
            <View style={styles.locationActions}>
              <TouchableOpacity style={styles.navBtn} onPress={() => openNavigation(order?.shopName + ' Addanki')}>
                <Ionicons name="navigate" size={18} color={Colors.white} />
                <Text style={styles.navBtnText}>Navigate</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Delivery Address */}
        <View style={[styles.locationCard, Shadows.md]}>
          <View style={styles.locationHeader}>
            <View style={[styles.locationDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.locationTitle}>Delivery Address</Text>
          </View>
          <Text style={styles.locationAddress}>{order?.address?.address || order?.address?.line1 || 'Address not set'}</Text>
          {order?.address?.landmark && <Text style={styles.locationMeta}>Landmark: {order.address.landmark}</Text>}
          <View style={styles.locationActions}>
            <TouchableOpacity style={styles.navBtn} onPress={() => openNavigation(order?.address?.address || order?.address?.line1)}>
              <Ionicons name="navigate" size={18} color={Colors.white} />
              <Text style={styles.navBtnText}>Navigate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.callBtn} onPress={callCustomer}>
              <Ionicons name="call" size={18} color={Colors.primary} />
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Items */}
        <View style={[styles.orderCard, Shadows.sm]}>
          <Text style={styles.orderCardTitle}>Order Details</Text>
          {order?.items?.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemText}>{item.quantity}x {item.name}</Text>
              <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={styles.totalText}>Payment</Text>
            <Text style={[styles.itemPrice, { color: order?.paymentMethod === 'cod' ? Colors.warning : Colors.success }]}>
              {order?.paymentMethod === 'cod' ? '💵 COD — Collect ₹' + order?.total : '📲 UPI Paid'}
            </Text>
          </View>
          <View style={styles.earningsInfo}>
            <Text style={styles.earningsLabel}>Your earning</Text>
            <Text style={styles.earningsValue}>₹30</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Action */}
      <View style={styles.footer}>
        {step === 'waiting' && (
          <View style={styles.waitingFooter}>
            <Text style={styles.waitingFooterEmoji}>👨‍🍳</Text>
            <View>
              <Text style={styles.waitingFooterTitle}>Food is being prepared</Text>
              <Text style={styles.waitingFooterSub}>Head to the shop — tap when you arrive to pick up</Text>
            </View>
          </View>
        )}
        {step === 'pickup' && (
          <TouchableOpacity style={styles.actionBtn} onPress={startPickupPhoto}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.actionGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="camera" size={20} color={Colors.white} />
              <Text style={styles.actionText}>  📦 Take Photo & Confirm Pickup</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {step === 'delivering' && (
          <View style={{ gap: 10, width: '100%' }}>
            {order?.paymentMethod === 'cod' && !cashCollected && (
              <TouchableOpacity
                style={styles.cashBtn}
                onPress={() =>
                  Alert.alert(
                    'Confirm Cash Collection',
                    `Have you collected ₹${order?.total} from the customer?`,
                    [
                      { text: 'Not Yet', style: 'cancel' },
                      { text: 'Yes, Collected', onPress: () => setCashCollected(true) },
                    ]
                  )
                }
              >
                <Text style={styles.cashBtnText}>💵 Mark Cash Collected — ₹{order?.total}</Text>
              </TouchableOpacity>
            )}
            {order?.paymentMethod === 'cod' && cashCollected && (
              <View style={styles.cashCollectedBadge}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.cashCollectedText}>Cash collected ✓</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, order?.paymentMethod === 'cod' && !cashCollected && { opacity: 0.45 }]}
              onPress={startDeliveryPhoto}
              disabled={order?.paymentMethod === 'cod' && !cashCollected}
            >
              <LinearGradient colors={[Colors.success, '#009940']} style={styles.actionGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="camera" size={20} color={Colors.white} />
                <Text style={styles.actionText}>  📸 Take Photo & Mark Delivered</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
        {step === 'done' && (
          <View style={styles.doneCard}>
            <Text style={styles.doneEmoji}>🎉</Text>
            <Text style={styles.doneText}>Delivery complete! ₹30 earned</Text>
          </View>
        )}
      </View>

      {/* ── Photo Confirmation Modal ─────────────────────────────── */}
      <Modal visible={photoModal !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Title */}
            <Text style={styles.modalTitle}>
              {photoModal === 'pickup' ? '📦 Confirm Pickup' : '📸 Proof of Delivery'}
            </Text>
            <Text style={styles.modalSub}>
              {photoModal === 'pickup'
                ? 'Take a clear photo of the packed items before you leave the restaurant.'
                : 'Take a photo at the delivery location as proof of delivery.'}
            </Text>

            {/* Photo preview or camera prompt */}
            {capturedPhoto ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
                <TouchableOpacity style={styles.retakeBtn} onPress={openCamera}>
                  <Ionicons name="camera-reverse" size={16} color={Colors.primary} />
                  <Text style={styles.retakeBtnText}>Retake</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.cameraPrompt} onPress={openCamera}>
                <Ionicons name="camera" size={48} color={Colors.primary} />
                <Text style={styles.cameraPromptText}>Tap to open camera</Text>
              </TouchableOpacity>
            )}

            {/* Action buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => { setPhotoModal(null); setCapturedPhoto(null); }}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmModalBtn, !capturedPhoto && { opacity: 0.4 }]}
                onPress={photoModal === 'pickup' ? confirmPickup : confirmDelivery}
                disabled={!capturedPhoto || uploading}
              >
                {uploading
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.confirmModalText}>
                      {photoModal === 'pickup' ? 'Confirm Pickup ✓' : 'Confirm Delivery ✓'}
                    </Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerEmoji: { fontSize: 40 },
  headerInfo: { flex: 1 },
  headerLabel: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.white },
  orderId: { fontSize: Fonts.sizes.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  mapContainer: { height: 200, marginHorizontal: Spacing.lg, marginTop: Spacing.lg, borderRadius: Radius.lg, overflow: 'hidden', ...Shadows.md },
  map: { flex: 1 },
  riderMarker: { backgroundColor: Colors.white, borderRadius: 20, padding: 4, ...Shadows.sm },
  locationCard: { backgroundColor: Colors.white, marginHorizontal: Spacing.lg, marginTop: Spacing.md, borderRadius: Radius.lg, padding: Spacing.lg },
  locationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  locationDot: { width: 10, height: 10, borderRadius: 5 },
  locationTitle: { fontSize: Fonts.sizes.xs, color: Colors.grey, fontWeight: '600', textTransform: 'uppercase' },
  locationName: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.dark, marginBottom: 4 },
  locationAddress: { fontSize: Fonts.sizes.sm, color: Colors.grey, marginBottom: Spacing.md },
  locationMeta: { fontSize: Fonts.sizes.xs, color: Colors.primary, marginBottom: Spacing.md },
  locationActions: { flexDirection: 'row', gap: Spacing.sm },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, height: 42, borderRadius: Radius.md },
  navBtnText: { color: Colors.white, fontWeight: '700', fontSize: Fonts.sizes.sm },
  callBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: Colors.primary, height: 42, borderRadius: Radius.md },
  callBtnText: { color: Colors.primary, fontWeight: '700', fontSize: Fonts.sizes.sm },
  orderCard: { backgroundColor: Colors.white, marginHorizontal: Spacing.lg, marginTop: Spacing.md, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: 100 },
  orderCardTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.dark, marginBottom: Spacing.md },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemText: { fontSize: Fonts.sizes.sm, color: Colors.darkGrey, flex: 1 },
  itemPrice: { fontSize: Fonts.sizes.sm, color: Colors.dark, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  totalText: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.dark },
  earningsInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.success + '15', borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.md },
  earningsLabel: { fontSize: Fonts.sizes.sm, color: Colors.success, fontWeight: '600' },
  earningsValue: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.success },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, paddingBottom: 28, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
  actionBtn: { borderRadius: Radius.md, overflow: 'hidden' },
  actionGradient: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.white },
  waitingFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.warning + '15', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.warning + '40' },
  waitingFooterEmoji: { fontSize: 28 },
  waitingFooterTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.dark },
  waitingFooterSub: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 2 },
  doneCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.success + '20', padding: Spacing.md, borderRadius: Radius.md },
  doneEmoji: { fontSize: 28 },
  doneText: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.success },
  cashBtn: {
    backgroundColor: Colors.warning + '20', borderWidth: 1.5, borderColor: Colors.warning,
    borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center',
  },
  cashBtnText: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.dark },
  cashCollectedBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.success + '15', borderRadius: Radius.md, paddingVertical: 10,
  },
  cashCollectedText: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.success },

  // Photo Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, gap: Spacing.md },
  modalTitle: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.dark },
  modalSub: { fontSize: Fonts.sizes.sm, color: Colors.grey, lineHeight: 20 },
  cameraPrompt: { height: 180, backgroundColor: Colors.background, borderRadius: Radius.xl, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 10 },
  cameraPromptText: { fontSize: Fonts.sizes.md, color: Colors.grey, fontWeight: '600' },
  photoPreview: { borderRadius: Radius.xl, overflow: 'hidden', position: 'relative' },
  previewImage: { width: '100%', height: 200, borderRadius: Radius.xl },
  retakeBtn: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.white, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, ...Shadows.sm },
  retakeBtnText: { fontSize: Fonts.sizes.xs, color: Colors.primary, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: Spacing.md },
  cancelModalBtn: { flex: 1, height: 50, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  cancelModalText: { fontSize: Fonts.sizes.md, color: Colors.grey, fontWeight: '600' },
  confirmModalBtn: { flex: 2, height: 50, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  confirmModalText: { fontSize: Fonts.sizes.md, color: Colors.white, fontWeight: '800' },
});
