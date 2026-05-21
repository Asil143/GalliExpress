// GalliExpress Customer — Shop Detail Screen v2

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SectionList,
  StatusBar, ScrollView, Alert, Linking, Share, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { formatPrice, getCategoryEmoji } from '../../../../shared/utils';
import { useCart } from '../../context/CartContext';

const CART_ITEM_LIMIT = 20;
const GOOGLE_MAPS_KEY = 'AIzaSyAheicA9XT1Ndqyl34xhPBnOPv0lGWM0P0';

export default function ShopDetailScreen({ navigation, route }) {
  const { shopId, shop } = route.params;
  const { cart, cartShop, addToCart, removeFromCart, cartCount, cartItems, cartTotal } = useCart();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [vegFilter, setVegFilter] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const sectionListRef = useRef(null);
  const user = auth().currentUser;

  useEffect(() => {
    loadMenu();
    checkFavourite();
  }, []);

  const loadMenu = async () => {
    try {
      const snap = await firestore()
        .collection('menuItems')
        .where('shopId', '==', shopId)
        .where('isAvailable', '==', true)
        .get();
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMenuItems(items);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const checkFavourite = async () => {
    if (!user) return;
    try {
      const doc = await firestore()
        .collection('favourites')
        .doc(`${user.uid}_${shopId}`)
        .get();
      setIsFavourite(doc.exists);
    } catch {}
  };

  const toggleFavourite = async () => {
    if (!user) return;
    const ref = firestore().collection('favourites').doc(`${user.uid}_${shopId}`);
    try {
      if (isFavourite) {
        await ref.delete();
        setIsFavourite(false);
      } else {
        await ref.set({
          userId: user.uid,
          shopId,
          shopName: shop.name,
          shopCategory: shop.category,
          savedAt: firestore.FieldValue.serverTimestamp(),
        });
        setIsFavourite(true);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not update favourites.');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${shop.name} on GalliExpress! Order food & grocery in Addanki.\nDownload the app now.`,
        title: shop.name,
      });
    } catch {}
  };

  const handleDirections = () => {
    if (shop.latitude && shop.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`;
      Linking.openURL(url);
    } else {
      const url = `https://maps.google.com/?q=${encodeURIComponent(shop.name + ' ' + (shop.address || 'Addanki'))}`;
      Linking.openURL(url);
    }
  };

  const handleCall = () => {
    if (shop.phone) {
      Linking.openURL(`tel:${shop.phone}`);
    } else {
      Alert.alert('Not Available', 'Phone number not available for this shop.');
    }
  };

  // ─── Cart ─────────────────────────────────────────────────────────────────
  const handleAddToCart = (item) => {
    if (!shop.isOpen) {
      Alert.alert('Shop Closed', 'This shop is not accepting orders right now.');
      return;
    }
    if (cartCount >= CART_ITEM_LIMIT) {
      Alert.alert('Cart Full', `You can add maximum ${CART_ITEM_LIMIT} items in one order.`);
      return;
    }
    // Warn if user has items from a different shop
    if (cartShop && cartShop.id !== shopId && cartCount > 0) {
      Alert.alert(
        'Start New Cart?',
        `You have items from ${cartShop.name}. Starting a new cart will remove them.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start New', style: 'destructive', onPress: () => addToCart(item, { ...shop, id: shopId }) },
        ]
      );
      return;
    }
    addToCart(item, { ...shop, id: shopId });
  };

  const handleRemoveFromCart = (item) => removeFromCart(item.id);

  // Only show cart items for this shop
  const thisShopCartItems = cartShop?.id === shopId ? cartItems : [];
  const thisShopCartTotal = cartShop?.id === shopId ? cartTotal : 0;
  const thisShopCartCount = cartShop?.id === shopId ? cartCount : 0;

  // ─── Sections ─────────────────────────────────────────────────────────────
  const displayedItems = vegFilter ? menuItems.filter(i => i.isVeg) : menuItems;
  const categories = [...new Set(displayedItems.map(i => i.category))];
  const sections = categories.map(cat => {
    const items = displayedItems.filter(i => i.category === cat);
    const rows = [];
    for (let i = 0; i < items.length; i += 2) {
      rows.push({ id: items[i].id, row: [items[i], items[i + 1] || null] });
    }
    return { title: cat, data: rows };
  });

  const scrollToCategory = (cat, idx) => {
    setActiveCategory(cat);
    sectionListRef.current?.scrollToLocation({ sectionIndex: idx, itemIndex: 0, animated: true, viewOffset: 60 });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          {/* Top row: back | actions */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={handleDirections}>
                <Ionicons name="navigate-outline" size={21} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={handleCall}>
                <Ionicons name="call-outline" size={21} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={toggleFavourite}>
                <Ionicons name={isFavourite ? 'heart' : 'heart-outline'} size={21} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={21} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Shop info — compact single row */}
          <View style={styles.shopInfo}>
            <Text style={styles.shopEmoji}>{getCategoryEmoji(shop.category)}</Text>
            <View style={styles.shopText}>
              <View style={styles.nameStatusRow}>
                <Text style={styles.shopName} numberOfLines={1}>{shop.name}</Text>
                <View style={[styles.statusDot, { backgroundColor: shop.isOpen ? Colors.success : Colors.error }]} />
              </View>
              <Text style={styles.shopCat}>{shop.category}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="star" size={11} color={Colors.secondary} />
                <Text style={styles.metaTxt}>{shop.rating || '4.2'}</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaTxt}>{shop.deliveryTime || '25'} min</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaTxt}>Min ₹{shop.minOrder || 50}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Category filter tabs */}
      {categories.length > 1 && (
        <View style={styles.catTabsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catTabs}>
            {categories.map((cat, idx) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catTab, activeCategory === cat && styles.catTabActive]}
                onPress={() => scrollToCategory(cat, idx)}
              >
                <Text style={[styles.catTabTxt, activeCategory === cat && styles.catTabTxtActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Veg filter */}
          <TouchableOpacity
            style={[styles.vegToggle, vegFilter && styles.vegToggleActive]}
            onPress={() => setVegFilter(!vegFilter)}
          >
            <View style={[styles.vegDot, vegFilter && styles.vegDotActive]} />
            <Text style={[styles.vegToggleTxt, vegFilter && styles.vegToggleActiveTxt]}>Veg</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Menu */}
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingTxt}>Loading menu...</Text>
        </View>
      ) : (
        <SectionList
          ref={sectionListRef}
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: thisShopCartCount > 0 ? 110 : 32 }}
          stickySectionHeadersEnabled
          onViewableItemsChanged={({ viewableItems }) => {
            if (viewableItems.length > 0) {
              const first = viewableItems[0];
              if (first.section) setActiveCategory(first.section.title);
            }
          }}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{getCategoryEmoji(title)} {title}</Text>
            </View>
          )}
          renderItem={({ item: { row } }) => (
            <View style={styles.gridRow}>
              {row.map((item, idx) =>
                item ? (
                  <View key={item.id} style={[styles.gridCard, Shadows.sm]}>
                    {/* Image / emoji area */}
                    <View style={styles.gridImageBox}>
                      <Text style={styles.gridEmoji}>{getCategoryEmoji(item.subCategory || item.category)}</Text>
                      {item.isBestseller && (
                        <View style={styles.gridBestBadge}>
                          <Text style={styles.gridBestTxt}>🏆</Text>
                        </View>
                      )}
                    </View>

                    {/* Card body */}
                    <View style={styles.gridBody}>
                      {item.isVeg !== undefined && (
                        <View style={[styles.vegIndicator, { borderColor: item.isVeg ? Colors.success : Colors.error, marginBottom: 4 }]}>
                          <View style={[styles.vegInner, { backgroundColor: item.isVeg ? Colors.success : Colors.error }]} />
                        </View>
                      )}
                      <Text style={styles.gridName} numberOfLines={2}>{item.name}</Text>
                      {item.description ? (
                        <Text style={styles.gridDesc} numberOfLines={1}>{item.description}</Text>
                      ) : null}
                      <Text style={styles.gridPrice}>{formatPrice(item.price)}</Text>

                      {cart[item.id] && cartShop?.id === shopId ? (
                        <View style={styles.gridQtyControl}>
                          <TouchableOpacity style={styles.gridQtyBtn} onPress={() => handleRemoveFromCart(item)}>
                            <Text style={styles.gridQtyBtnTxt}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.gridQtyCount}>{cart[item.id]}</Text>
                          <TouchableOpacity style={[styles.gridQtyBtn, styles.gridQtyAdd]} onPress={() => handleAddToCart(item)}>
                            <Text style={styles.gridQtyBtnTxt}>+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity style={styles.gridAddBtn} onPress={() => handleAddToCart(item)}>
                          <Text style={styles.gridAddBtnTxt}>+ Add</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ) : (
                  <View key={`ph-${idx}`} style={styles.gridCard} />
                )
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyMenu}>
              <Text style={{ fontSize: 48 }}>🍽️</Text>
              <Text style={styles.emptyTxt}>
                {vegFilter ? 'No veg items available' : 'Menu not available'}
              </Text>
            </View>
          }
        />
      )}

      {/* Cart Footer */}
      {thisShopCartCount > 0 && (
        <View style={[styles.cartFooter, Shadows.lg]}>
          <View style={styles.cartLeft}>
            <Text style={styles.cartCountTxt}>{thisShopCartCount} {thisShopCartCount === 1 ? 'item' : 'items'}</Text>
            <Text style={styles.cartTotalTxt}>{formatPrice(thisShopCartTotal)}</Text>
          </View>
          <View style={styles.cartRight}>
            {thisShopCartCount < CART_ITEM_LIMIT ? (
              <Text style={styles.cartLimitTxt}>{CART_ITEM_LIMIT - thisShopCartCount} items left</Text>
            ) : (
              <Text style={[styles.cartLimitTxt, { color: Colors.error }]}>Cart full</Text>
            )}
            <TouchableOpacity
              style={styles.cartBtn}
              onPress={() => navigation.navigate('Cart', { cartItems: thisShopCartItems, shop })}
            >
              <Text style={styles.cartBtnTxt}>View Cart →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: Spacing.md },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, marginBottom: Spacing.md,
  },
  iconBtn: { padding: 6 },
  headerActions: { flexDirection: 'row', gap: 2 },
  shopInfo: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  shopEmoji: { fontSize: 36 },
  shopText: { flex: 1 },
  nameStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shopName: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.white, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  shopCat: { fontSize: Fonts.sizes.xs, color: 'rgba(255,255,255,0.75)', marginBottom: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt: { fontSize: Fonts.sizes.xs, color: 'rgba(255,255,255,0.9)' },
  metaDot: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  catTabsWrapper: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  catTabs: { paddingHorizontal: Spacing.md, gap: 4, paddingVertical: Spacing.sm },
  catTab: {
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
  },
  catTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catTabTxt: { fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.semibold, color: Colors.dark },
  catTabTxtActive: { color: Colors.white },
  vegToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: 7, marginRight: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.success,
    alignSelf: 'center',
  },
  vegToggleActive: { backgroundColor: Colors.success + '20' },
  vegDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: Colors.success },
  vegDotActive: { backgroundColor: Colors.success },
  vegToggleTxt: { fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.semibold, color: Colors.success },
  vegToggleActiveTxt: { color: Colors.success },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { fontSize: Fonts.sizes.md, color: Colors.grey },
  sectionHeader: {
    backgroundColor: Colors.background, paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sectionTitle: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.dark },
  vegIndicator: {
    width: 14, height: 14, borderRadius: 2, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  vegInner: { width: 6, height: 6, borderRadius: 3 },
  // ─── Grid layout ───────────────────────────────────────────────────────────
  gridRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, marginTop: Spacing.sm,
  },
  gridCard: {
    flex: 1, backgroundColor: Colors.white,
    borderRadius: Radius.md, overflow: 'hidden',
  },
  gridImageBox: {
    height: 100, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  gridEmoji: { fontSize: 44 },
  gridBestBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: Colors.secondary + '30',
    borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2,
  },
  gridBestTxt: { fontSize: 11 },
  gridBody: { padding: Spacing.sm, gap: 3 },
  gridName: { fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.bold, color: Colors.dark, lineHeight: 18 },
  gridDesc: { fontSize: 11, color: Colors.grey, lineHeight: 15 },
  gridPrice: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.primary, marginTop: 2 },
  gridAddBtn: {
    marginTop: 6, backgroundColor: Colors.white,
    borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: Radius.sm, paddingVertical: 5, alignItems: 'center',
  },
  gridAddBtnTxt: { fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.bold, color: Colors.primary },
  gridQtyControl: {
    marginTop: 6, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primary, borderRadius: Radius.sm, overflow: 'hidden',
  },
  gridQtyBtn: { flex: 1, paddingVertical: 6, backgroundColor: Colors.primaryDark, alignItems: 'center' },
  gridQtyAdd: { backgroundColor: Colors.primaryDark },
  gridQtyBtnTxt: { fontSize: 15, fontWeight: Fonts.weights.bold, color: Colors.white },
  gridQtyCount: { flex: 1, textAlign: 'center', fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.bold, color: Colors.white },
  emptyMenu: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTxt: { fontSize: Fonts.sizes.md, color: Colors.grey },
  cartFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.dark, paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md, paddingBottom: 28, gap: Spacing.md,
  },
  cartLeft: { flex: 1 },
  cartCountTxt: { fontSize: Fonts.sizes.xs, color: 'rgba(255,255,255,0.7)' },
  cartTotalTxt: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.white },
  cartRight: { alignItems: 'flex-end', gap: 4 },
  cartLimitTxt: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  cartBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md, borderRadius: Radius.md,
  },
  cartBtnTxt: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.white },
});
