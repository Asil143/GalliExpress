// GalliExpress Customer — Shop Detail Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SectionList, StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { formatPrice, getCategoryEmoji } from '../../../../shared/utils';

export default function ShopDetailScreen({ navigation, route }) {
  const { shopId, shop } = route.params;
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const snap = await firestore()
        .collection('menuItems')
        .where('shopId', '==', shopId)
        .where('isAvailable', '==', true)
        .get();
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMenuItems(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Group items by category
  const sections = menuItems.reduce((acc, item) => {
    const existing = acc.find((s) => s.title === item.category);
    if (existing) {
      existing.data.push(item);
    } else {
      acc.push({ title: item.category, data: [item] });
    }
    return acc;
  }, []);

  const addToCart = (item) => {
    setCart((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));
  };

  const removeFromCart = (item) => {
    setCart((prev) => {
      const qty = prev[item.id] || 0;
      if (qty <= 1) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: qty - 1 };
    });
  };

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = menuItems.reduce((sum, item) => {
    return sum + (cart[item.id] || 0) * item.price;
  }, 0);
  const cartItems = menuItems
    .filter((item) => cart[item.id])
    .map((item) => ({ ...item, quantity: cart[item.id] }));

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn}>
              <Ionicons name="share-social-outline" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.shopHeaderInfo}>
            <Text style={styles.shopEmoji}>{getCategoryEmoji(shop.category)}</Text>
            <View style={styles.shopHeaderText}>
              <Text style={styles.shopName}>{shop.name}</Text>
              <Text style={styles.shopCategory}>{shop.category}</Text>
              <View style={styles.shopMeta}>
                <Ionicons name="star" size={12} color={Colors.secondary} />
                <Text style={styles.shopMetaText}>{shop.rating || '4.2'}</Text>
                <Text style={styles.shopMetaDot}>•</Text>
                <Text style={styles.shopMetaText}>{shop.deliveryTime || '25'} నిమి.</Text>
                <Text style={styles.shopMetaDot}>•</Text>
                <Text style={styles.shopMetaText}>Min ₹{shop.minOrder || 50}</Text>
              </View>
            </View>
          </View>
          {/* Open/Closed indicator */}
          <View style={[styles.statusBadge, { backgroundColor: shop.isOpen ? Colors.success : Colors.error }]}>
            <Text style={styles.statusBadgeText}>{shop.isOpen ? '🟢 తెరవబడి ఉంది' : '🔴 మూసివేయబడింది'}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Menu */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: cartCount > 0 ? 100 : 24 }}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {getCategoryEmoji(title)} {title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[styles.menuItem, Shadows.sm]}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
              ) : null}
              <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
            </View>
            <View style={styles.menuItemRight}>
              <View style={styles.itemImageBox}>
                <Text style={styles.itemEmoji}>{getCategoryEmoji(item.subCategory || item.category)}</Text>
              </View>
              {cart[item.id] ? (
                <View style={styles.qtyControl}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item)}>
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyCount}>{cart[item.id]}</Text>
                  <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => addToCart(item)}>
                    <Text style={[styles.qtyBtnText, styles.qtyBtnAddText]}>+</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                  <Text style={styles.addBtnText}>+ జోడించు</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyMenu}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyText}>మెనూ లోడ్ అవుతోంది...</Text>
          </View>
        }
      />

      {/* Cart Footer */}
      {cartCount > 0 && (
        <View style={[styles.cartFooter, Shadows.lg]}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartCount}>{cartCount} వస్తువులు</Text>
            <Text style={styles.cartTotal}>{formatPrice(cartTotal)}</Text>
          </View>
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => navigation.navigate('Cart', { cartItems, shop })}
          >
            <Text style={styles.cartBtnText}>కార్ట్ చూడండి →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: Spacing.lg },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  backBtn: { padding: 4 },
  shareBtn: { padding: 4 },
  shopHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  shopEmoji: { fontSize: 48 },
  shopHeaderText: { flex: 1 },
  shopName: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.white,
    marginBottom: 2,
  },
  shopCategory: { fontSize: Fonts.sizes.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  shopMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shopMetaText: { fontSize: Fonts.sizes.xs, color: 'rgba(255,255,255,0.9)' },
  shopMetaDot: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  statusBadge: {
    alignSelf: 'flex-start',
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: 4,
  },
  statusBadgeText: { fontSize: Fonts.sizes.xs, color: Colors.white, fontWeight: Fonts.weights.semibold },
  sectionHeader: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
    color: Colors.dark,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  menuItemLeft: { flex: 1, paddingRight: Spacing.sm },
  itemName: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold, color: Colors.dark, marginBottom: 4 },
  itemDesc: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginBottom: 6, lineHeight: 16 },
  itemPrice: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.primary },
  menuItemRight: { alignItems: 'center', gap: 8 },
  itemImageBox: {
    width: 70,
    height: 70,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: { fontSize: 36 },
  addBtn: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  addBtnText: { fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.bold, color: Colors.primary },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  qtyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.primaryDark,
  },
  qtyBtnAdd: { backgroundColor: Colors.primaryDark },
  qtyBtnText: { fontSize: 16, fontWeight: Fonts.weights.bold, color: Colors.white },
  qtyBtnAddText: { color: Colors.white },
  qtyCount: { paddingHorizontal: 12, fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.white },
  emptyMenu: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: Fonts.sizes.md, color: Colors.grey },
  cartFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark,
    padding: Spacing.lg,
    paddingBottom: 28,
    gap: Spacing.md,
  },
  cartInfo: { flex: 1 },
  cartCount: { fontSize: Fonts.sizes.xs, color: 'rgba(255,255,255,0.7)' },
  cartTotal: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.white },
  cartBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  cartBtnText: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.white },
});
