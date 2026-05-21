// GalliExpress Customer — Order History Screen

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Linking, TextInput, Share,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { formatPrice, formatDate, getStatusLabel, getStatusColor } from '../../../../shared/utils';
import { getCategoryEmoji } from '../../../../shared/utils';

const FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'pending',   label: 'Active' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

function MiniStars({ value, size = 14 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Ionicons key={s} name={s <= value ? 'star' : 'star-outline'} size={size} color={s <= value ? '#FFA726' : '#DDD'} />
      ))}
    </View>
  );
}

export default function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const user = auth().currentUser;

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    const unsub = firestore()
      .collection('orders')
      .where('customerId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        snap => { setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
        () => setLoading(false)
      );
    return unsub;
  }, []);

  const handleReorder = async (order) => {
    try {
      const shopSnap = await firestore().collection('shops').doc(order.shopId).get();
      if (!shopSnap?.exists) { Alert.alert('Shop Unavailable', 'This shop may no longer be active.'); return; }
      const shop = { id: shopSnap.id, ...shopSnap.data() };
      navigation.navigate('Cart', { cartItems: order.items || [], shop });
    } catch { Alert.alert('Error', 'Could not reorder. Try again.'); }
  };

  const handleShareOrder = async (order) => {
    try {
      await Share.share({ message: `I ordered from ${order.shopName} on GalliExpress! 🛵\nOrder #${order.orderId} — ${formatPrice(order.total)}` });
    } catch {}
  };

  const handleHelp = (order) => {
    const msg = encodeURIComponent(`Hi GalliExpress! I need help with order #${order.orderId} from ${order.shopName}.`);
    Linking.openURL(`https://wa.me/919727178763?text=${msg}`);
  };

  const filtered = orders
    .filter(o => !o.hiddenBy)
    .filter(o => {
      if (filter === 'all') return true;
      if (filter === 'pending') return !['delivered', 'cancelled'].includes(o.status);
      return o.status === filter;
    })
    .filter(o => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return o.shopName?.toLowerCase().includes(q) || o.items?.some(i => i.name?.toLowerCase().includes(q));
    });

  const renderOrder = ({ item: order }) => {
    const isDelivered = order.status === 'delivered';
    const emoji = getCategoryEmoji ? getCategoryEmoji(order.shopCategory || '') : '🏪';

    return (
      <View style={styles.card}>
        {/* ── Card Header ─────────────────────────────── */}
        <View style={styles.cardHeader}>
          <View style={styles.shopEmojiBg}>
            <Text style={{ fontSize: 22 }}>{emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shopName}>{order.shopName}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ShopDetail', { shopId: order.shopId, shop: { id: order.shopId, name: order.shopName, category: order.shopCategory } })}>
              <Text style={styles.viewMenu}>View menu ›</Text>
            </TouchableOpacity>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                {isDelivered ? '✓ Delivered' : getStatusLabel(order.status)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleShareOrder(order)} style={styles.shareBtn}>
              <Ionicons name="share-outline" size={18} color={Colors.grey} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Items ───────────────────────────────────── */}
        <View style={styles.itemsList}>
          {(order.items || []).map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={[styles.vegDot, { borderColor: item.isVeg === false ? Colors.error : Colors.success }]}>
                <View style={[styles.vegInner, { backgroundColor: item.isVeg === false ? Colors.error : Colors.success }]} />
              </View>
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyText}>{item.quantity}x</Text>
              </View>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* ── Date + Total ────────────────────────────── */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Ordered: {formatDate(order.createdAt)}
          </Text>
          <TouchableOpacity
            style={styles.totalRow}
            onPress={() => navigation.navigate('OrderTracking', { orderId: order.orderId || order.id, order })}
          >
            <Text style={styles.totalText}>{formatPrice(order.total)}</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.grey} />
          </TouchableOpacity>
        </View>

        {/* ── Ratings row (Swiggy-style split) ────────── */}
        {isDelivered && (
          <>
            <View style={styles.divider} />
            {order.rated ? (
              <View style={styles.ratedRow}>
                <View style={styles.ratingCol}>
                  <Text style={styles.ratingColLabel}>Food Rating</Text>
                  <MiniStars value={order.foodRating || 0} />
                </View>
                <View style={styles.ratingColDivider} />
                <View style={styles.ratingCol}>
                  <Text style={styles.ratingColLabel}>Delivery Rating</Text>
                  <MiniStars value={order.deliveryRating || 0} />
                </View>
              </View>
            ) : (
              <View style={styles.ratedRow}>
                <View style={styles.ratingCol}>
                  <Text style={styles.ratingColLabel}>Your Food Rating</Text>
                  <MiniStars value={0} />
                </View>
                <View style={styles.ratingColDivider} />
                <View style={styles.ratingCol}>
                  <Text style={styles.ratingColLabel}>Delivery Rating</Text>
                  <MiniStars value={0} />
                </View>
              </View>
            )}
          </>
        )}

        {/* ── Action buttons ──────────────────────────── */}
        <View style={styles.actions}>
          {!order.rated && isDelivered && (
            <TouchableOpacity
              style={styles.rateBtn}
              onPress={() => navigation.navigate('RateOrder', { order })}
            >
              <Ionicons name="star-outline" size={15} color={Colors.secondary} />
              <Text style={styles.rateBtnText}>Rate</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.helpBtn} onPress={() => handleHelp(order)}>
            <Ionicons name="help-circle-outline" size={15} color={Colors.grey} />
            <Text style={styles.helpBtnText}>Help</Text>
          </TouchableOpacity>
          {isDelivered && (
            <TouchableOpacity style={styles.reorderBtn} onPress={() => handleReorder(order)}>
              <Ionicons name="refresh" size={15} color={Colors.primary} />
              <Text style={styles.reorderBtnText}>REORDER</Text>
            </TouchableOpacity>
          )}
          {!isDelivered && order.status !== 'cancelled' && (
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => navigation.navigate('OrderTracking', { orderId: order.orderId || order.id, order })}
            >
              <Ionicons name="navigate-outline" size={15} color={Colors.white} />
              <Text style={styles.trackBtnText}>Track Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Orders</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.primary} style={{ marginLeft: 12 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by restaurant or dish"
          placeholderTextColor="#AAA"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={{ paddingRight: 12 }}>
            <Ionicons name="close-circle" size={18} color="#AAA" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterChip, filter === f.id && styles.filterChipOn]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[styles.filterText, filter === f.id && styles.filterTextOn]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 52 }}>📦</Text>
          <Text style={styles.emptyTitle}>{search ? 'No matching orders' : 'No orders yet'}</Text>
          <Text style={styles.emptySub}>{search ? 'Try a different search' : "You haven't placed any orders"}</Text>
          {!search && (
            <TouchableOpacity style={styles.orderNowBtn} onPress={() => navigation.navigate('HomeTab')}>
              <Text style={styles.orderNowText}>Order Now</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F5F5F5' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },

  searchWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 28, borderWidth: 1, borderColor: '#E8E8E8', ...Shadows.sm },
  searchInput: { flex: 1, paddingVertical: 11, paddingHorizontal: 10, fontSize: 14, color: '#1a1a1a' },

  filterRow:     { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginBottom: 4 },
  filterChip:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA' },
  filterChipOn:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText:    { fontSize: 12, color: '#888', fontWeight: '600' },
  filterTextOn:  { color: '#fff', fontWeight: '700' },

  // Card
  card:        { backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'visible', ...Shadows.sm },

  cardHeader:  { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  shopEmojiBg: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EBEBEB' },
  shopName:    { fontSize: 15, fontWeight: '800', color: '#1a1a1a' },
  viewMenu:    { fontSize: 12, color: Colors.primary, fontWeight: '700', marginTop: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText:  { fontSize: 11, fontWeight: '800' },
  shareBtn: { padding: 4 },

  // Items
  itemsList:  { paddingHorizontal: 14, paddingBottom: 12, gap: 7 },
  itemRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vegDot:     { width: 14, height: 14, borderRadius: 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  vegInner:   { width: 7, height: 7, borderRadius: 3.5 },
  qtyBadge:   { backgroundColor: '#F5F5F5', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  qtyText:    { fontSize: 12, fontWeight: '700', color: '#555' },
  itemName:   { fontSize: 13, color: '#444', flex: 1, fontWeight: '500' },

  divider:    { height: 1, backgroundColor: '#F5F5F5', marginHorizontal: 14 },

  // Meta
  metaRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  metaText:   { fontSize: 12, color: '#999' },
  totalRow:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  totalText:  { fontSize: 14, fontWeight: '800', color: '#1a1a1a' },

  // Ratings
  ratedRow:         { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12 },
  ratingCol:        { flex: 1, gap: 5 },
  ratingColLabel:   { fontSize: 11, color: '#999', fontWeight: '600' },
  ratingColDivider: { width: 1, backgroundColor: '#F0F0F0', marginHorizontal: 12 },

  // Actions
  actions:        { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  rateBtn:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.secondary + '15', borderWidth: 1, borderColor: Colors.secondary + '40' },
  rateBtnText:    { fontSize: 12, color: Colors.secondary, fontWeight: '700' },
  helpBtn:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F5F5F5' },
  helpBtnText:    { fontSize: 12, color: '#888', fontWeight: '600' },
  reorderBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 20, backgroundColor: Colors.primary + '15', borderWidth: 1.5, borderColor: Colors.primary + '40' },
  reorderBtnText: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  trackBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 20, backgroundColor: Colors.primary },
  trackBtnText:   { fontSize: 13, fontWeight: '800', color: '#fff' },

  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle:   { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  emptySub:     { fontSize: 14, color: '#999' },
  orderNowBtn:  { backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 24, marginTop: 8 },
  orderNowText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
