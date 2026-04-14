// GalliExpress Rider — Active Delivery Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { formatPrice } from '../../../../shared/utils';
import { OrderStatus } from '../../../../shared/theme';

const DELIVERY_STEPS = [
  { key: 'pickup', label: 'షాప్‌లో పికప్ చేయి', emoji: '🏪', color: Colors.primary },
  { key: 'delivering', label: 'కస్టమర్‌కి డెలివర్ చేయి', emoji: '🛵', color: Colors.secondary },
  { key: 'done', label: 'డెలివర్ అయింది ✓', emoji: '✅', color: Colors.success },
];

export default function ActiveDeliveryScreen({ navigation, route }) {
  const { orderId, order: initialOrder } = route.params;
  const [order, setOrder] = useState(initialOrder);
  const [step, setStep] = useState('pickup');
  const [riderLocation, setRiderLocation] = useState(null);
  const [delivering, setDelivering] = useState(false);
  const user = auth().currentUser;

  useEffect(() => {
    // Listen to order updates
    const unsub = firestore()
      .collection('orders')
      .doc(orderId)
      .onSnapshot((snap) => {
        if (snap.exists) setOrder({ id: snap.id, ...snap.data() });
      });

    // Track rider location
    let locationSub;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        locationSub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
          (loc) => {
            setRiderLocation(loc.coords);
            // Update rider location in Firestore for customer tracking
            firestore().collection('orders').doc(orderId).update({
              riderLocation: {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              },
            });
          }
        );
      }
    })();

    return () => {
      unsub();
      locationSub?.remove();
    };
  }, [orderId]);

  const openNavigation = (address) => {
    const query = encodeURIComponent(address || 'Addanki, Andhra Pradesh');
    Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  const callCustomer = () => {
    if (order?.customerPhone) {
      Linking.openURL(`tel:${order.customerPhone}`);
    } else {
      Alert.alert('నంబర్ అందుబాటులో లేదు');
    }
  };

  const handlePickedUp = () => {
    setStep('delivering');
  };

  const handleMarkDelivered = () => {
    Alert.alert(
      'డెలివర్ అయిందా?',
      'ఆర్డర్ కస్టమర్‌కి అందించారా?',
      [
        { text: 'రద్దు', style: 'cancel' },
        {
          text: '✓ అవును, అందించాను',
          onPress: async () => {
            setDelivering(true);
            try {
              await firestore().collection('orders').doc(orderId).update({
                status: OrderStatus.DELIVERED,
                deliveredAt: firestore.FieldValue.serverTimestamp(),
                updatedAt: firestore.FieldValue.serverTimestamp(),
              });
              // Update rider earnings
              await firestore().collection('riders').doc(user?.uid).update({
                totalDeliveries: firestore.FieldValue.increment(1),
                totalEarnings: firestore.FieldValue.increment(30),
              });
              setStep('done');
              setTimeout(() => navigation.navigate('HomeTab'), 2000);
            } catch {
              Alert.alert('తప్పు జరిగింది');
            } finally {
              setDelivering(false);
            }
          },
        },
      ]
    );
  };

  const currentStep = DELIVERY_STEPS.find((s) => s.key === step);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Status Header */}
      <LinearGradient colors={[currentStep.color, currentStep.color + 'CC']} style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerEmoji}>{currentStep.emoji}</Text>
          <View style={styles.headerInfo}>
            <Text style={styles.headerLabel}>{currentStep.label}</Text>
            <Text style={styles.orderId}>#{order?.orderId}</Text>
          </View>
          <TouchableOpacity style={styles.helpBtn}>
            <Ionicons name="help-circle-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
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
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{ latitude: riderLocation.latitude, longitude: riderLocation.longitude }}
                title="మీరు ఇక్కడ ఉన్నారు"
              >
                <View style={styles.riderMarker}>
                  <Text style={{ fontSize: 20 }}>🛵</Text>
                </View>
              </Marker>
            </MapView>
          </View>
        )}

        {/* Pickup Card */}
        {step === 'pickup' && (
          <View style={[styles.locationCard, Shadows.md]}>
            <View style={styles.locationHeader}>
              <View style={[styles.locationDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.locationTitle}>పికప్ లొకేషన్</Text>
            </View>
            <Text style={styles.locationName}>{order?.shopName}</Text>
            <Text style={styles.locationAddress}>అడ్డంకి, ప్రకాశం జిల్లా</Text>
            <View style={styles.locationActions}>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => openNavigation(order?.shopName + ' Addanki')}
              >
                <Ionicons name="navigate" size={18} color={Colors.white} />
                <Text style={styles.navBtnText}>నావిగేట్</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Delivery Address Card */}
        <View style={[styles.locationCard, Shadows.md]}>
          <View style={styles.locationHeader}>
            <View style={[styles.locationDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.locationTitle}>డెలివరీ చిరునామా</Text>
          </View>
          <Text style={styles.locationAddress}>{order?.address?.line1}</Text>
          {order?.address?.landmark && (
            <Text style={styles.locationMeta}>లాండ్‌మార్క్: {order.address.landmark}</Text>
          )}
          <View style={styles.locationActions}>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => openNavigation(order?.address?.line1)}
            >
              <Ionicons name="navigate" size={18} color={Colors.white} />
              <Text style={styles.navBtnText}>నావిగేట్</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.callBtn} onPress={callCustomer}>
              <Ionicons name="call" size={18} color={Colors.primary} />
              <Text style={styles.callBtnText}>కాల్ చేయి</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Summary */}
        <View style={[styles.orderCard, Shadows.sm]}>
          <Text style={styles.orderCardTitle}>ఆర్డర్ వివరాలు</Text>
          {order?.items?.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemText}>{item.quantity}x {item.name}</Text>
              <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={styles.totalText}>చెల్లింపు పద్ధతి</Text>
            <Text style={[styles.itemPrice, { color: order?.paymentMethod === 'cod' ? Colors.warning : Colors.success }]}>
              {order?.paymentMethod === 'cod' ? '💵 COD — ₹' + order?.total + ' తీసుకోండి' : '📲 UPI చెల్లించారు'}
            </Text>
          </View>
          <View style={styles.earningsInfo}>
            <Text style={styles.earningsLabel}>మీ సంపాదన ఈ డెలివరీకి</Text>
            <Text style={styles.earningsValue}>₹30</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        {step === 'pickup' && (
          <TouchableOpacity style={styles.actionBtn} onPress={handlePickedUp}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={styles.actionText}>📦 పికప్ చేశాను — డెలివరీ మొదలు</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {step === 'delivering' && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleMarkDelivered}
            disabled={delivering}
          >
            <LinearGradient
              colors={[Colors.success, '#009940']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={styles.actionText}>✅ డెలివర్ చేశాను</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {step === 'done' && (
          <View style={styles.doneCard}>
            <Text style={styles.doneEmoji}>🎉</Text>
            <Text style={styles.doneText}>డెలివరీ పూర్తయింది! ₹30 సంపాదించారు</Text>
          </View>
        )}
      </View>
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
  helpBtn: { padding: 4 },
  mapContainer: { height: 200, marginHorizontal: Spacing.lg, marginTop: Spacing.lg, borderRadius: Radius.lg, overflow: 'hidden', ...Shadows.md },
  map: { flex: 1 },
  riderMarker: { backgroundColor: Colors.white, borderRadius: 20, padding: 4, ...Shadows.sm },
  locationCard: {
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg,
    marginTop: Spacing.md, borderRadius: Radius.lg, padding: Spacing.lg,
  },
  locationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  locationDot: { width: 10, height: 10, borderRadius: 5 },
  locationTitle: { fontSize: Fonts.sizes.xs, color: Colors.grey, fontWeight: '600', textTransform: 'uppercase' },
  locationName: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.dark, marginBottom: 4 },
  locationAddress: { fontSize: Fonts.sizes.sm, color: Colors.grey, marginBottom: Spacing.md },
  locationMeta: { fontSize: Fonts.sizes.xs, color: Colors.primary, marginBottom: Spacing.md },
  locationActions: { flexDirection: 'row', gap: Spacing.sm },
  navBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: Colors.primary, height: 42, borderRadius: Radius.md,
  },
  navBtnText: { color: Colors.white, fontWeight: '700', fontSize: Fonts.sizes.sm },
  callBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: Colors.primary, height: 42, borderRadius: Radius.md,
  },
  callBtnText: { color: Colors.primary, fontWeight: '700', fontSize: Fonts.sizes.sm },
  orderCard: {
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg,
    marginTop: Spacing.md, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: 100,
  },
  orderCardTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.dark, marginBottom: Spacing.md },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemText: { fontSize: Fonts.sizes.sm, color: Colors.darkGrey, flex: 1 },
  itemPrice: { fontSize: Fonts.sizes.sm, color: Colors.dark, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  totalText: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.dark },
  earningsInfo: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.success + '15', borderRadius: Radius.md,
    padding: Spacing.md, marginTop: Spacing.md,
  },
  earningsLabel: { fontSize: Fonts.sizes.sm, color: Colors.success, fontWeight: '600' },
  earningsValue: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.success },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.lg, paddingBottom: 28,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  actionBtn: { borderRadius: Radius.md, overflow: 'hidden' },
  actionGradient: { height: 56, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.white },
  doneCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: Colors.success + '20',
    padding: Spacing.md, borderRadius: Radius.md,
  },
  doneEmoji: { fontSize: 28 },
  doneText: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.success },
});
