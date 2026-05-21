// GalliExpress Customer — Order Tracking Screen v3 (Premium)

import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Linking, Alert, Share, Animated, Image,
  UIManager, Platform, LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import firestore from '@react-native-firebase/firestore';
import { Colors, Fonts, Spacing, Radius, Shadows, OrderStatus } from '../../../../shared/theme';
import { formatPrice, formatDate } from '../../../../shared/utils';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Config ───────────────────────────────────────────────────────────────────

const STEPPER_KEYS = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.ON_THE_WAY,
  OrderStatus.DELIVERED,
];

const STEPPER_LABELS = {
  [OrderStatus.PENDING]:    'Placed',
  [OrderStatus.CONFIRMED]:  'Confirmed',
  [OrderStatus.PREPARING]:  'Preparing',
  [OrderStatus.ON_THE_WAY]: 'On Way',
  [OrderStatus.DELIVERED]:  'Delivered',
};

const STATUS_CONFIG = {
  [OrderStatus.PENDING]: {
    emoji: '📋', title: 'Order Placed!',
    desc: 'Waiting for the shop to accept your order',
    eta: null, bg: ['#FF6B35', '#FF8C42'],
  },
  [OrderStatus.CONFIRMED]: {
    emoji: '✅', title: 'Confirmed!',
    desc: 'Shop accepted your order. Food will be prepared soon!',
    eta: null, bg: ['#FF6B35', '#FF8C42'],
  },
  [OrderStatus.PREPARING]: {
    emoji: '👨‍🍳', title: 'Being Prepared',
    desc: 'Your food is being freshly made with love',
    eta: '~20 min', bg: ['#F59E0B', '#EF8C0A'],
  },
  [OrderStatus.READY]: {
    emoji: '📦', title: 'Ready for Pickup!',
    desc: 'Packed & sealed. Waiting for a rider',
    eta: '~5 min', bg: ['#8B5CF6', '#7C3AED'],
  },
  [OrderStatus.ON_THE_WAY]: {
    emoji: '🛵', title: "On the Way!",
    desc: 'Your rider is heading to your doorstep',
    eta: '~10 min', bg: ['#3B82F6', '#2563EB'],
  },
  [OrderStatus.DELIVERED]: {
    emoji: '🎉', title: 'Delivered!',
    desc: 'Enjoy your delicious meal. Bon appétit!',
    eta: null, bg: ['#10B981', '#059669'],
  },
  [OrderStatus.CANCELLED]: {
    emoji: '❌', title: 'Order Cancelled',
    desc: 'Refund (if any) will be processed in 3–5 business days',
    eta: null, bg: ['#EF4444', '#DC2626'],
  },
};

const PAYMENT_LABELS = {
  cod: '💵 Cash on Delivery',
  upi: '📲 UPI / GPay',
  card: '💳 Credit / Debit Card',
  wallet: '👛 GalliExpress Wallet',
};

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function OrderTrackingScreen({ navigation, route }) {
  const { orderId, order: initialOrder } = route.params;
  const [order, setOrder] = useState(initialOrder);
  const [riderProfile, setRiderProfile] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const [shopLocation, setShopLocation] = useState(null);

  const pulseAnim    = useRef(new Animated.Value(1)).current;
  const riderAnim    = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const deliveredAnim = useRef(new Animated.Value(0)).current;
  const mapRef       = useRef(null);

  // ── Firestore listener ────────────────────────────────────────
  useEffect(() => {
    const unsub = firestore()
      .collection('orders')
      .doc(orderId)
      .onSnapshot(snap => {
        if (snap?.exists) {
          const data = { id: snap.id, ...snap.data() };
          setOrder(data);
          if (data.riderId) loadRider(data.riderId);
        }
      });
    return unsub;
  }, [orderId]);

  // ── Fetch shop GPS location ────────────────────────────────────
  useEffect(() => {
    if (!order?.shopId) return;
    firestore().collection('shops').doc(order.shopId).get().then(snap => {
      if (snap?.exists) {
        const d = snap.data();
        // coordinates stored as top-level latitude/longitude fields
        if (d?.latitude && d?.longitude) {
          setShopLocation({ latitude: d.latitude, longitude: d.longitude });
        }
      }
    }).catch(() => {});
  }, [order?.shopId]);

  // ── Auto-fit map when we have ≥2 points ───────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const coords = [];
    if (shopLocation) coords.push(shopLocation);
    if (order?.riderLocation) coords.push(order.riderLocation);
    const addrCoords = order?.address?.latitude
      ? { latitude: order.address.latitude, longitude: order.address.longitude }
      : null;
    if (addrCoords) coords.push(addrCoords);
    if (coords.length >= 2) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 70, right: 70, bottom: 70, left: 70 },
          animated: true,
        });
      }, 400);
    }
  }, [shopLocation, order?.riderLocation]);

  // ── Progress bar animation ─────────────────────────────────────
  useEffect(() => {
    const raw = order?.status;
    const idx  = STEPPER_KEYS.indexOf(raw === OrderStatus.READY ? OrderStatus.ON_THE_WAY : raw);
    const target = idx < 0 ? 0 : idx / (STEPPER_KEYS.length - 1);
    Animated.spring(progressAnim, { toValue: target, useNativeDriver: false, tension: 50, friction: 10 }).start();
    if (raw === OrderStatus.DELIVERED) {
      Animated.spring(deliveredAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
    }
  }, [order?.status]);

  // ── Pulse animation (active orders) ───────────────────────────
  useEffect(() => {
    if (order?.status === OrderStatus.DELIVERED || order?.status === OrderStatus.CANCELLED) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [order?.status]);

  const loadRider = async (riderId) => {
    try {
      const snap = await firestore().collection('riders').doc(riderId).get();
      if (snap?.exists) {
        const d = snap.data();
        setRiderProfile({
          name: d.name || `Rider ${(d.phone || '').slice(-4)}`,
          phone: d.phone,
          rating: d.rating || 5.0,
          totalDeliveries: d.totalDeliveries || 0,
          vehicle: d.vehicle || 'Bike',
        });
        Animated.spring(riderAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
      }
    } catch {}
  };

  const status = order?.status || OrderStatus.PENDING;
  const cfg    = STATUS_CONFIG[status] || STATUS_CONFIG[OrderStatus.PENDING];
  const isDelivered  = status === OrderStatus.DELIVERED;
  const isCancelled  = status === OrderStatus.CANCELLED;
  const isActive     = !isDelivered && !isCancelled;
  const stepIdx      = STEPPER_KEYS.indexOf(status === OrderStatus.READY ? OrderStatus.ON_THE_WAY : status);
  const canCancel    = isActive && [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(status);

  const canCallRider = order?.riderId && (() => {
    if (!isDelivered) return true;
    const ts = order?.deliveredAt?.seconds ? order.deliveredAt.seconds * 1000 : null;
    return ts ? (Date.now() - ts) < 2 * 60 * 60 * 1000 : false; // hide after 2 hours
  })();

  const handleCancel = () => {
    Alert.alert('Cancel Order', 'Are you sure? This cannot be undone.', [
      { text: 'No, Keep It', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        setCancelling(true);
        try {
          await firestore().collection('orders').doc(orderId).update({
            status: OrderStatus.CANCELLED,
            cancelledAt: firestore.FieldValue.serverTimestamp(),
          });
        } catch { Alert.alert('Error', 'Could not cancel. Try again.'); }
        finally { setCancelling(false); }
      }},
    ]);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I ordered from ${order?.shopName} on GalliExpress! 🛵\nOrder #${order?.orderId} — ${formatPrice(order?.total || 0)}\n\nDownload GalliExpress for hyperlocal delivery in Addanki.`,
      });
    } catch {}
  };

  const handleCallRider = () => {
    if (riderProfile?.phone) Linking.openURL(`tel:${riderProfile.phone}`);
    else Alert.alert('Rider Not Assigned', 'Rider details will appear once a rider picks up your order.');
  };

  const handleCallShop = () => {
    if (order?.shopPhone) Linking.openURL(`tel:${order.shopPhone}`);
    else Alert.alert('Not Available', 'Shop contact is not available.');
  };

  const toggleItems = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setItemsExpanded(v => !v);
  };

  const items       = order?.items || [];
  const PREVIEW_MAX = 2;
  const shownItems  = itemsExpanded ? items : items.slice(0, PREVIEW_MAX);
  const hiddenCount = items.length - PREVIEW_MAX;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      {isDelivered || isCancelled ? (

        /* Compact white bar for delivered / cancelled */
        <View style={styles.compactBar}>
          <TouchableOpacity
            style={styles.compactIconBtn}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })}
          >
            <Ionicons name="home-outline" size={20} color={Colors.dark} />
          </TouchableOpacity>
          <View style={styles.compactCenter}>
            <View style={[styles.compactBadge, { backgroundColor: isCancelled ? '#FEE2E2' : '#DCFCE7' }]}>
              <Text style={[styles.compactBadgeText, { color: isCancelled ? Colors.error : '#16a34a' }]}>
                {isCancelled ? '✕  Cancelled' : '✓  Delivered'}
              </Text>
            </View>
            <Text style={styles.compactOrderId}>Order #{order?.orderId}</Text>
          </View>
          <TouchableOpacity style={styles.compactIconBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={Colors.dark} />
          </TouchableOpacity>
        </View>

      ) : (

        /* Full gradient hero for active orders */
        <LinearGradient colors={cfg.bg} style={styles.hero}>
          <View style={styles.heroBar}>
            <TouchableOpacity
              style={styles.heroIconBtn}
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })}
            >
              <Ionicons name="home-outline" size={20} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
            <Text style={styles.heroOrderId}>Order #{order?.orderId}</Text>
            <TouchableOpacity style={styles.heroIconBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroBody}>
            <Animated.Text style={[styles.heroEmoji, { transform: [{ scale: pulseAnim }] }]}>
              {cfg.emoji}
            </Animated.Text>
            <Text style={styles.heroTitle}>{cfg.title}</Text>
            <Text style={styles.heroDesc}>{cfg.desc}</Text>
            {cfg.eta && (
              <View style={styles.etaBadge}>
                <Ionicons name="time-outline" size={13} color="#FFF" />
                <Text style={styles.etaText}>Arriving in {cfg.eta}</Text>
              </View>
            )}
          </View>

          {/* Stepper — active orders only */}
          <View style={styles.stepperWrap}>
            <View style={styles.trackContainer}>
              <View style={styles.trackBg} />
              <Animated.View style={[
                styles.trackFill,
                { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
              ]} />
            </View>
            <View style={styles.stepperDots}>
              {STEPPER_KEYS.map((key, i) => {
                const done   = i <= stepIdx;
                const active = i === stepIdx;
                const past   = done && !active;
                return (
                  <View key={key} style={styles.stepperItem}>
                    {active ? (
                      <Animated.View style={[styles.activePulse, { transform: [{ scale: pulseAnim }] }]}>
                        <View style={styles.activeRing}><View style={styles.activeCore} /></View>
                      </Animated.View>
                    ) : past ? (
                      <View style={styles.doneDot}>
                        <Ionicons name="checkmark" size={13} color="#FFF" />
                      </View>
                    ) : (
                      <View style={styles.futureDot} />
                    )}
                    <Text style={[styles.stepLabel, past && styles.stepLabelDone, active && styles.stepLabelActive]}>
                      {STEPPER_LABELS[key]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </LinearGradient>

      )}

        {/* ── Status stepper (delivered / cancelled — white card) ── */}
        {(isDelivered || isCancelled) && (
          <View style={styles.stepperCard}>
            {isCancelled ? (
              <View style={styles.cancelledRow}>
                <Ionicons name="close-circle" size={22} color={Colors.error} />
                <Text style={styles.cancelledText}>Order was cancelled</Text>
              </View>
            ) : (
              <>
                <View style={styles.stepperCardTrack}>
                  <View style={styles.stepperCardTrackBg} />
                  <View style={styles.stepperCardTrackFill} />
                </View>
                <View style={styles.stepperDots}>
                  {STEPPER_KEYS.map((key) => (
                    <View key={key} style={styles.stepperItem}>
                      <View style={styles.doneDotDark}>
                        <Ionicons name="checkmark" size={12} color="#FFF" />
                      </View>
                      <Text style={styles.stepLabelDark}>{STEPPER_LABELS[key]}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* ── Cancel (subtle link, only before confirming) ──────── */}
        {canCancel && (
          <TouchableOpacity style={styles.cancelLink} onPress={handleCancel} disabled={cancelling}>
            <Ionicons name="close-circle-outline" size={15} color={Colors.error} />
            <Text style={styles.cancelLinkText}>{cancelling ? 'Cancelling…' : 'Cancel this order'}</Text>
          </TouchableOpacity>
        )}

        {/* ── Rider Card ─────────────────────────────────────────── */}
        {order?.riderId && riderProfile && (
          <Animated.View style={[
            styles.riderCard,
            {
              opacity: riderAnim,
              transform: [{ translateY: riderAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
            },
          ]}>
            <LinearGradient colors={['#1C1C2E', '#2D2D44']} style={styles.riderInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.riderLeft}>
                <View style={styles.riderAvatar}>
                  <Text style={styles.riderAvatarText}>{riderProfile.name.charAt(0).toUpperCase()}</Text>
                  <View style={styles.riderOnlineDot} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.riderLabel}>Your delivery partner</Text>
                  <Text style={styles.riderName}>{riderProfile.name}</Text>
                  <View style={styles.riderMeta}>
                    <Text style={styles.riderStar}>★</Text>
                    <Text style={styles.riderRating}>{riderProfile.rating.toFixed(1)}</Text>
                    <View style={styles.riderDot} />
                    <Text style={styles.riderSub}>{riderProfile.totalDeliveries} deliveries</Text>
                    <View style={styles.riderDot} />
                    <Text style={styles.riderSub}>🛵 {riderProfile.vehicle}</Text>
                  </View>
                </View>
              </View>
              {canCallRider && (
                <TouchableOpacity style={styles.riderCallBtn} onPress={handleCallRider}>
                  <View style={styles.riderCallCircle}>
                    <Ionicons name="call" size={20} color="#1C1C2E" />
                  </View>
                  <Text style={styles.riderCallLabel}>Call</Text>
                </TouchableOpacity>
              )}
            </LinearGradient>
            <View style={styles.riderStrip}>
              <View style={[styles.stripDot, {
                backgroundColor: [OrderStatus.ON_THE_WAY, OrderStatus.DELIVERED].includes(status)
                  ? Colors.success : Colors.warning,
              }]} />
              <Text style={styles.stripText}>
                {status === OrderStatus.DELIVERED   ? `✅ Delivered by ${riderProfile.name}`
                : status === OrderStatus.ON_THE_WAY ? '🛵 Rider is on the way to you'
                : status === OrderStatus.READY      ? '🏪 Heading to pick up your order'
                : '🎉 Rider has been assigned to your order'}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── Route Map (Preparing → On the Way) ────────────────── */}
        {!isCancelled && shopLocation && (
          <View style={styles.mapCard}>
            {/* Header */}
            <View style={styles.mapHeader}>
              <View>
                <Text style={styles.mapTitle}>
                  {isDelivered        ? '✅ Delivered from here'
                  : status === OrderStatus.ON_THE_WAY ? '🛵 Rider is on the way'
                  : '🏪 Order location'}
                </Text>
                <Text style={styles.mapSub}>
                  {isDelivered
                    ? `${order.shopName} delivered your order`
                    : status === OrderStatus.ON_THE_WAY
                    ? `${order.shopName} → Your home`
                    : `Food being prepared at ${order.shopName}`}
                </Text>
              </View>
              {status === OrderStatus.ON_THE_WAY && (
                <View style={styles.liveChip}>
                  <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              )}
            </View>

            {/* Map */}
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: shopLocation.latitude,
                longitude: shopLocation.longitude,
                latitudeDelta: 0.025,
                longitudeDelta: 0.025,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              {/* Shop marker */}
              <Marker coordinate={shopLocation} title={order.shopName} anchor={{ x: 0.5, y: 1 }}>
                <View style={styles.shopMarker}>
                  <Text style={{ fontSize: 18 }}>🏪</Text>
                </View>
              </Marker>

              {/* Delivery home marker (if address has coords) */}
              {order?.address?.latitude && (
                <Marker
                  coordinate={{ latitude: order.address.latitude, longitude: order.address.longitude }}
                  title="Your Home"
                  anchor={{ x: 0.5, y: 1 }}
                >
                  <View style={styles.homeMarker}>
                    <Text style={{ fontSize: 18 }}>🏠</Text>
                  </View>
                </Marker>
              )}

              {/* Rider marker (live) */}
              {order?.riderLocation && (
                <Marker
                  coordinate={order.riderLocation}
                  title={riderProfile?.name || 'Your Rider'}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={styles.riderMapMarker}>
                    <Text style={{ fontSize: 22 }}>🛵</Text>
                  </View>
                </Marker>
              )}

              {/* Route line: shop → rider → home */}
              {order?.riderLocation && (
                <Polyline
                  coordinates={[
                    shopLocation,
                    order.riderLocation,
                    ...(order?.address?.latitude
                      ? [{ latitude: order.address.latitude, longitude: order.address.longitude }]
                      : []),
                  ]}
                  strokeColor={Colors.primary}
                  strokeWidth={3}
                  lineDashPattern={[10, 6]}
                />
              )}

              {/* Static shop→home line when no rider yet */}
              {!order?.riderLocation && order?.address?.latitude && (
                <Polyline
                  coordinates={[
                    shopLocation,
                    { latitude: order.address.latitude, longitude: order.address.longitude },
                  ]}
                  strokeColor="#CCC"
                  strokeWidth={2}
                  lineDashPattern={[8, 5]}
                />
              )}
            </MapView>

            {/* Footer */}
            <View style={styles.mapFooter}>
              {/* Legend */}
              <View style={styles.mapLegend}>
                <View style={styles.legendItem}>
                  <Text style={styles.legendEmoji}>🏪</Text>
                  <Text style={styles.legendLabel}>Restaurant</Text>
                </View>
                {order?.riderLocation && (
                  <View style={styles.legendItem}>
                    <Text style={styles.legendEmoji}>🛵</Text>
                    <Text style={styles.legendLabel}>Rider</Text>
                  </View>
                )}
                {order?.address?.latitude && (
                  <View style={styles.legendItem}>
                    <Text style={styles.legendEmoji}>🏠</Text>
                    <Text style={styles.legendLabel}>Your home</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.openMapsBtn}
                onPress={() => {
                  const loc = order?.riderLocation || shopLocation;
                  Linking.openURL(`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`);
                }}
              >
                <Ionicons name="navigate-outline" size={13} color={Colors.primary} />
                <Text style={styles.openMapsBtnText}>Open Maps</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Instructions ──────────────────────────────────────── */}
        {(order?.cookingNote || order?.deliveryNote) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📝 Your Instructions</Text>
            {order.cookingNote && (
              <View style={styles.noteRow}>
                <View style={styles.noteIcon}>
                  <Ionicons name="restaurant-outline" size={14} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.noteLabel}>Cooking Note</Text>
                  <Text style={styles.noteText}>{order.cookingNote}</Text>
                </View>
              </View>
            )}
            {order.deliveryNote && (
              <View style={[styles.noteRow, { marginTop: 10 }]}>
                <View style={styles.noteIcon}>
                  <Ionicons name="bicycle-outline" size={14} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.noteLabel}>Delivery Note</Text>
                  <Text style={styles.noteText}>{order.deliveryNote}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Order Items (collapsible) ──────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>🧾 Order Summary</Text>
            <View style={styles.shopTag}>
              <Ionicons name="storefront-outline" size={12} color={Colors.primary} />
              <Text style={styles.shopTagText}>{order?.shopName}</Text>
            </View>
          </View>

          {shownItems.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={[styles.vegDot, { borderColor: item.isVeg === false ? Colors.error : Colors.success }]}>
                <View style={[styles.vegInner, { backgroundColor: item.isVeg === false ? Colors.error : Colors.success }]} />
              </View>
              <Text style={styles.itemQty}>{item.quantity}×</Text>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}

          {items.length > PREVIEW_MAX && (
            <TouchableOpacity style={styles.expandBtn} onPress={toggleItems}>
              <Text style={styles.expandBtnText}>
                {itemsExpanded ? '▲ Show less' : `▼ ${hiddenCount} more item${hiddenCount > 1 ? 's' : ''}`}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          {/* Bill */}
          {order?.subtotal != null && <BillRow label="Item Total" value={formatPrice(order.subtotal)} />}
          {order?.deliveryFee != null && (
            <BillRow
              label="Delivery Fee"
              value={order.deliveryFee === 0 ? 'FREE 🎉' : formatPrice(order.deliveryFee)}
              valueColor={order.deliveryFee === 0 ? Colors.success : null}
            />
          )}
          {order?.gst > 0 && <BillRow label="GST (5%)" value={formatPrice(order.gst)} />}
          {order?.couponDiscount > 0 && (
            <BillRow
              label={`Coupon (${order.couponCode})`}
              value={`-${formatPrice(order.couponDiscount)}`}
              valueColor={Colors.success}
            />
          )}
          {order?.tip > 0 && <BillRow label="Rider Tip 💰" value={formatPrice(order.tip)} />}

          <View style={styles.divider} />
          <BillRow label="Total Paid" value={formatPrice(order?.total || 0)} bold />

          <View style={styles.payRow}>
            <Text style={styles.payText}>{PAYMENT_LABELS[order?.paymentMethod] || order?.paymentMethod}</Text>
          </View>
        </View>

        {/* ── Delivery Address ──────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Delivery Address</Text>
          <Text style={styles.addrMain}>{order?.address?.address || order?.address?.line1}</Text>
          {order?.address?.landmark ? <Text style={styles.addrSub}>Near {order.address.landmark}</Text> : null}
          {order?.address?.pincode  ? <Text style={styles.addrSub}>Pincode: {order.address.pincode}</Text> : null}
        </View>

        {/* ── Rate Order ────────────────────────────────────────── */}
        {isDelivered && !order?.rated && (
          <TouchableOpacity
            style={styles.rateCard}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('RateOrder', { order })}
          >
            <LinearGradient
              colors={['#FFF8F0', '#FFF3E8']}
              style={styles.rateCardInner}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={styles.rateLeft}>
                <Text style={styles.rateEmoji}>⭐</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rateTitle}>Rate your experience</Text>
                  <Text style={styles.rateSub}>Tap to rate food, delivery & more</Text>
                  <View style={styles.rateStars}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Ionicons key={s} name="star-outline" size={18} color={Colors.secondary} />
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.rateArrow}>
                <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {isDelivered && order?.rated && (
          <View style={[styles.card, styles.ratedCard]}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.ratedTitle}>Thanks for rating!</Text>
              <Text style={styles.ratedSub}>Your feedback helps us serve Addanki better 🙏</Text>
            </View>
          </View>
        )}

        {/* ── Delivery Proof ────────────────────────────────────── */}
        {isDelivered && order?.deliveryPhotoUrl && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📸 Delivery Proof</Text>
            <Text style={styles.proofSub}>Photo taken by rider at your doorstep</Text>
            <Image
              source={{ uri: order.deliveryPhotoUrl }}
              style={styles.proofImg}
              resizeMode="cover"
            />
          </View>
        )}

        {/* ── Reorder ───────────────────────────────────────────── */}
        {isDelivered && (
          <TouchableOpacity
            style={styles.reorderBtn}
            onPress={async () => {
              try {
                const shopSnap = await firestore().collection('shops').doc(order.shopId).get();
                if (!shopSnap?.exists) { Alert.alert('Shop Unavailable', 'This shop may no longer be active.'); return; }
                navigation.navigate('Cart', { cartItems: order.items || [], shop: { id: shopSnap.id, ...shopSnap.data() } });
              } catch { Alert.alert('Error', 'Could not reorder. Try again.'); }
            }}
          >
            <Ionicons name="refresh" size={18} color={Colors.primary} />
            <Text style={styles.reorderText}>REORDER</Text>
          </TouchableOpacity>
        )}

        {/* ── Help section (Zomato-style rows) ─────────────────── */}
        <View style={styles.helpCard}>
          <Text style={styles.helpHeader}>Need help?</Text>

          {order?.shopPhone && (
            <HelpRow
              icon="call-outline"
              label="Call the restaurant"
              sub={order.shopPhone}
              onPress={handleCallShop}
            />
          )}

          <HelpRow
            icon="logo-whatsapp"
            label="Chat with support"
            sub="Typically replies in minutes"
            color="#22c55e"
            last
            onPress={() => {
              const msg = encodeURIComponent(`Hi GalliExpress! I need help with order #${order?.orderId} from ${order?.shopName}.`);
              Linking.openURL(`https://wa.me/919727178763?text=${msg}`);
            }}
          />

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function HelpRow({ icon, label, sub, color = Colors.primary, last = false, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.helpRow, !last && styles.helpRowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.helpRowIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.helpRowLabel}>{label}</Text>
        {sub ? <Text style={styles.helpRowSub}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#CCC" />
    </TouchableOpacity>
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F4' },

  // ── Hero ─────────────────────────────────────────────────────
  hero: { paddingBottom: 0 },
  heroBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12,
  },
  heroIconBtn: { padding: 8 },
  heroOrderId: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '700', letterSpacing: 0.3 },

  heroBody: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 20, gap: 6 },
  heroEmoji: { fontSize: 64, marginBottom: 4 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#FFF', textAlign: 'center' },
  heroDesc:  { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },

  etaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  etaText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  // ── Horizontal Stepper ────────────────────────────────────────
  stepperWrap: {
    marginHorizontal: 16, marginBottom: 0,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, padding: 16, position: 'relative',
    marginBottom: 16,
  },
  trackContainer: {
    position: 'absolute', top: 29, left: 44, right: 44, height: 3,
  },
  trackBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 2,
  },
  trackFill: {
    position: 'absolute', left: 0, top: 0,
    height: 3, backgroundColor: '#FFF', borderRadius: 2,
  },
  stepperDots: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  stepperItem: { alignItems: 'center', gap: 6, flex: 1 },

  /* completed step */
  doneDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#22c55e',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22c55e', shadowOpacity: 0.5, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  /* active step: pulsing outer glow + solid ring + core */
  activePulse: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  activeRing: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#FFF',
    borderWidth: 0,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FFF', shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  activeCore: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  /* upcoming step */
  futureDot: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'transparent',
  },

  stepLabel:       { fontSize: 9.5, color: 'rgba(255,255,255,0.6)', fontWeight: '600', textAlign: 'center' },
  stepLabelDone:   { color: 'rgba(255,255,255,0.85)' },
  stepLabelActive: { color: '#FFF', fontWeight: '800' },

  // ── White stepper card (delivered/cancelled) ─────────────────
  stepperCard: {
    backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    borderRadius: 20, padding: 20, ...Shadows.sm, position: 'relative',
  },
  stepperCardTrack: {
    position: 'absolute', top: 31, left: 52, right: 52, height: 3,
  },
  stepperCardTrackBg:   { ...StyleSheet.absoluteFillObject, backgroundColor: '#E5E7EB', borderRadius: 2 },
  stepperCardTrackFill: { ...StyleSheet.absoluteFillObject, backgroundColor: '#22c55e', borderRadius: 2 },
  doneDotDark: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22c55e', shadowOpacity: 0.4, shadowRadius: 5, shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  stepLabelDark: { fontSize: 9.5, color: '#555', fontWeight: '700', textAlign: 'center', marginTop: 2 },
  cancelledRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cancelledText: { fontSize: 15, fontWeight: '700', color: Colors.error },

  // ── Compact bar (delivered / cancelled) ──────────────────────
  compactBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  compactIconBtn: { padding: 8 },
  compactCenter: { alignItems: 'center', gap: 3 },
  compactBadge: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20,
  },
  compactBadgeText: { fontSize: 13, fontWeight: '800' },
  compactOrderId:   { fontSize: 11, color: '#AAA', fontWeight: '500' },

  // ── Cancel link ───────────────────────────────────────────────
  cancelLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, marginTop: 4,
  },
  cancelLinkText: { fontSize: 13, color: Colors.error, fontWeight: '600' },

  // ── Rider Card ────────────────────────────────────────────────
  riderCard: {
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 20, overflow: 'hidden', ...Shadows.md,
  },
  riderInner: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16,
  },
  riderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  riderAvatar: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  riderAvatarText: { fontSize: 22, fontWeight: '900', color: '#FFF' },
  riderOnlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#1C1C2E',
  },
  riderLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  riderName:    { fontSize: 18, fontWeight: '900', color: '#FFF', marginTop: 1, marginBottom: 4 },
  riderMeta:    { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  riderStar:    { fontSize: 11, color: '#FFD700' },
  riderRating:  { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  riderDot:     { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.3)' },
  riderSub:     { fontSize: 10, color: 'rgba(255,255,255,0.55)' },

  riderCallBtn:   { alignItems: 'center', gap: 5 },
  riderCallCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
  },
  riderCallLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '700' },

  riderStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10,
  },
  stripDot:  { width: 8, height: 8, borderRadius: 4 },
  stripText: { fontSize: 12, color: '#333', fontWeight: '600' },

  // ── Map ───────────────────────────────────────────────────────
  mapCard: {
    backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 20, overflow: 'hidden', ...Shadows.md,
  },
  mapHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  mapTitle: { fontSize: 15, fontWeight: '800', color: '#111' },
  mapSub:   { fontSize: 12, color: '#888', marginTop: 2 },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FEE2E2', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#EF4444' },
  liveText: { fontSize: 10, fontWeight: '900', color: '#EF4444', letterSpacing: 0.8 },
  map: { height: 220, width: '100%' },

  shopMarker: {
    backgroundColor: '#FFF3E8', borderRadius: 20, padding: 6,
    borderWidth: 2, borderColor: Colors.primary,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  homeMarker: {
    backgroundColor: '#E8F5E9', borderRadius: 20, padding: 6,
    borderWidth: 2, borderColor: '#22c55e',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  riderMapMarker: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 5,
    borderWidth: 2.5, borderColor: Colors.primary,
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },

  mapFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  mapLegend: { flexDirection: 'row', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendEmoji: { fontSize: 13 },
  legendLabel: { fontSize: 11, color: '#666', fontWeight: '600' },
  openMapsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primary + '12', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  openMapsBtnText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },

  // ── Card ──────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 20, padding: 16, ...Shadows.sm,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cardTitle:    { fontSize: 15, fontWeight: '800', color: '#111', marginBottom: 14 },
  shopTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary + '12', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  shopTagText: { fontSize: 11, color: Colors.primary, fontWeight: '700' },

  // ── Items ──────────────────────────────────────────────────────
  itemRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  vegDot:   { width: 14, height: 14, borderRadius: 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  vegInner: { width: 7, height: 7, borderRadius: 3.5 },
  itemQty:  { fontSize: 13, color: Colors.primary, fontWeight: '800', minWidth: 26 },
  itemName: { flex: 1, fontSize: 13, color: '#333', fontWeight: '500' },
  itemPrice:{ fontSize: 13, color: '#111', fontWeight: '700' },

  expandBtn: { marginTop: 6, paddingVertical: 8, alignItems: 'center' },
  expandBtnText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },

  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },

  billRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  billLabel: { fontSize: 13, color: '#666' },
  billValue: { fontSize: 13, color: '#111', fontWeight: '600' },
  billBold:  { fontWeight: '900', color: '#111', fontSize: 15 },

  payRow:  { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  payText: { fontSize: 12, color: '#888', fontWeight: '500' },

  // ── Address ────────────────────────────────────────────────────
  addrMain: { fontSize: 15, color: '#111', fontWeight: '600', lineHeight: 22 },
  addrSub:  { fontSize: 12, color: '#888', marginTop: 4 },

  // ── Notes ─────────────────────────────────────────────────────
  noteRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  noteIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  noteLabel: { fontSize: 10, color: '#999', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  noteText:  { fontSize: 13, color: '#333', marginTop: 2 },

  // ── Rate Order ────────────────────────────────────────────────
  rateCard: {
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 20, overflow: 'hidden', ...Shadows.sm,
    borderWidth: 1.5, borderColor: '#FDDCB5',
  },
  rateCardInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  rateLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rateEmoji: { fontSize: 36 },
  rateTitle: { fontSize: 15, fontWeight: '800', color: '#111' },
  rateSub:   { fontSize: 12, color: '#888', marginTop: 2 },
  rateStars: { flexDirection: 'row', gap: 3, marginTop: 6 },
  rateArrow: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },

  ratedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  ratedTitle: { fontSize: 14, fontWeight: '800', color: '#111' },
  ratedSub:   { fontSize: 12, color: '#888', marginTop: 2 },

  // ── Proof ─────────────────────────────────────────────────────
  proofSub: { fontSize: 12, color: '#888', marginTop: -10, marginBottom: 10 },
  proofImg: { width: '100%', height: 220, borderRadius: 12 },

  // ── Reorder ───────────────────────────────────────────────────
  reorderBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 12, paddingVertical: 14,
    borderRadius: 20, borderWidth: 2, borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  reorderText: { fontSize: 15, fontWeight: '900', color: Colors.primary },

  // ── Help ──────────────────────────────────────────────────────
  helpCard: {
    backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 20,
    borderRadius: 20, overflow: 'hidden', ...Shadows.sm,
  },
  helpHeader: {
    fontSize: 13, fontWeight: '800', color: '#999',
    textTransform: 'uppercase', letterSpacing: 0.6,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
  },
  helpRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  helpRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  helpRowIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  helpRowLabel: { fontSize: 14, fontWeight: '600', color: '#111' },
  helpRowSub:   { fontSize: 12, color: '#888', marginTop: 1 },
});
