// GalliExpress Customer — Home Screen v2

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, RefreshControl, Dimensions, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import * as Location from 'expo-location';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import ShopCard from '../../components/ShopCard';
import LocationPickerModal from '../../components/LocationPickerModal';

const { width } = Dimensions.get('window');

// ─── Categories (matches Firestore categories) ───────────────────────────────
const CATEGORIES = [
  { id: 'tiffin',      name: 'Tiffin',      emoji: '🍽️', match: ['Tiffin & Breakfast'],                                           color: '#FFF0E8', accent: '#FF6B35' },
  { id: 'meals',       name: 'Meals',       emoji: '🍱', match: ['Meals & Fast Food'],                                            color: '#FFF3EE', accent: '#FF7043' },
  { id: 'biryani',     name: 'Biryani',     emoji: '🍚', match: ['Biryani'],                                                      color: '#FFF8E1', accent: '#FFA000' },
  { id: 'restaurant',  name: 'Restaurant',  emoji: '🍴', match: ['Restaurant'],                                                   color: '#EDE7F6', accent: '#7C4DFF' },
  { id: 'chicken',     name: 'Chicken',     emoji: '🐔', match: ['Chicken & Meat'],                                               color: '#FFEBEE', accent: '#EF5350' },
  { id: 'bakery',      name: 'Bakery',      emoji: '🍰', match: ['Bakery & Sweets', 'Bakery & Beverages'],                        color: '#FCE4EC', accent: '#EC407A' },
  { id: 'beverages',   name: 'Drinks',      emoji: '🥤', match: ['Juice & Beverages', 'Tea & Beverages', 'Bakery & Beverages'],  color: '#E8F5E9', accent: '#43A047' },
  { id: 'grocery',     name: 'Grocery',     emoji: '🛒', match: ['Grocery & Provisions'],                                        color: '#E0F7FA', accent: '#00ACC1' },
  { id: 'gifts',       name: 'Gifts',       emoji: '🎁', match: ['Gifts & Stationery', 'Stationery & Print'],                    color: '#F3E5F5', accent: '#AB47BC' },
  { id: 'electronics', name: 'Electronics', emoji: '💻', match: ['Electronics & Computers'],                                     color: '#E3F2FD', accent: '#1E88E5' },
];

// ─── Dynamic banners based on time of day ─────────────────────────────────────
function getDynamicBanners() {
  const hour = new Date().getHours();
  const base = [
    { id: 'refer', title: 'Refer & Earn ₹50!', sub: 'Share GalliExpress with friends', color: ['#5856D6', '#007AFF'], emoji: '🎁' },
    { id: 'free',  title: 'Free Delivery above ₹300', sub: 'On all orders from Addanki shops', color: ['#00C851', '#00A042'], emoji: '🛵' },
  ];
  if (hour >= 6 && hour < 11) return [
    { id: 'breakfast', title: 'Good Morning! 🌅', sub: 'Fresh tiffin delivered hot to you', color: ['#FF6B35', '#FF8C5A'], emoji: '🍽️' },
    { id: 'offer1',    title: '20% off Breakfast Orders', sub: 'Valid 6AM–11AM today only', color: ['#FFB800', '#FF6B35'], emoji: '⏰' },
    ...base,
  ];
  if (hour >= 11 && hour < 15) return [
    { id: 'lunch', title: 'Lunch Time! 🍱', sub: 'Order meals & biryani now', color: ['#FF6B35', '#E55A25'], emoji: '🍚' },
    { id: 'offer2', title: 'Biryani Deals Today', sub: 'Up to 15% off on biryani orders', color: ['#FFB800', '#FF6B35'], emoji: '🔥' },
    ...base,
  ];
  if (hour >= 15 && hour < 18) return [
    { id: 'snack', title: 'Snack Time ☕', sub: 'Tea, coffee & bakery delivered', color: ['#5856D6', '#7B79FF'], emoji: '🍰' },
    ...base,
  ];
  if (hour >= 18 && hour < 23) return [
    { id: 'dinner', title: 'Dinner Time! 🌙', sub: 'Restaurants open late for you', color: ['#1C1C2E', '#3D3D4E'], emoji: '🍴' },
    { id: 'offer3', title: 'Weekend Special 🎉', sub: 'Extra 10% off on dinner orders', color: ['#FF6B35', '#FF8C5A'], emoji: '🎊' },
    ...base,
  ];
  return [
    { id: 'late', title: 'Late Night Cravings? 🌙', sub: 'Some shops still open for you', color: ['#1C1C2E', '#3D3D4E'], emoji: '🌙' },
    ...base,
  ];
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

// ─── Sort Options ──────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'rating',    label: 'Rating' },
  { id: 'delivery',  label: 'Fastest Delivery' },
  { id: 'minOrder',  label: 'Low Min Order' },
];

export default function HomeScreen({ navigation }) {
  const [shops, setShops] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [vegOnly, setVegOnly] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [showSort, setShowSort] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const [userName, setUserName] = useState('');
  const [location, setLocation] = useState({ label: 'Addanki', address: 'Addanki, Prakasam District' });
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [banners] = useState(getDynamicBanners());

  const user = auth().currentUser;

  useEffect(() => {
    loadUserName();
    const timer = setInterval(() => setActiveBanner(p => (p + 1) % banners.length), 4000);

    // Real-time listener so isOpen changes in partner app reflect immediately
    const unsub = firestore()
      .collection('shops')
      .where('isActive', '==', true)
      .where('town', '==', 'addanki')
      .onSnapshot(
        (snap) => {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data(), isOpen: d.data().isOpen !== false }));
          setShops(data);
          setFeatured(data.filter(s => s.isFeatured));
        },
        () => {}
      );

    return () => { clearInterval(timer); unsub(); };
  }, []);

  const loadUserName = () => {
    if (user?.displayName) setUserName(user.displayName.split(' ')[0]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // snapshot listener already keeps data fresh; just simulate a brief refresh
    setTimeout(() => setRefreshing(false), 600);
  };

  // ─── Filter + Sort ────────────────────────────────────────────────────────
  const filteredShops = shops
    .filter(shop => {
      const matchCat = selectedCategory
        ? CATEGORIES.find(c => c.id === selectedCategory)?.match?.includes(shop.category)
        : true;
      const matchOpen = openNow ? shop.isOpen : true;
      const matchVeg = vegOnly ? shop.isVeg : true;
      return matchCat && matchOpen && matchVeg;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'delivery') return (parseInt(a.deliveryTime) || 30) - (parseInt(b.deliveryTime) || 30);
      if (sortBy === 'minOrder') return (a.minOrder || 0) - (b.minOrder || 0);
      return 0;
    });

  const handleLocationSelect = (loc) => {
    setLocation(loc);
    setShowLocationPicker(false);
  };

  const banner = banners[activeBanner];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={handleLocationSelect}
        currentLocation={location}
      />

      {/* Sort Bottom Sheet */}
      {showSort && (
        <TouchableOpacity style={styles.sortOverlay} activeOpacity={1} onPress={() => setShowSort(false)}>
          <View style={styles.sortSheet}>
            <Text style={styles.sortTitle}>Sort By</Text>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={styles.sortOption}
                onPress={() => { setSortBy(opt.id); setShowSort(false); }}
              >
                <Text style={[styles.sortOptionText, sortBy === opt.id && styles.sortOptionActive]}>
                  {opt.label}
                </Text>
                {sortBy === opt.id && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}

      <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.white }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.locationBtn} onPress={() => setShowLocationPicker(true)}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={Colors.primary} />
              <View style={styles.locationText}>
                <Text style={styles.locationLabel}>Delivery to</Text>
                <View style={styles.locationName}>
                  <Text style={styles.locationValue} numberOfLines={1}>{location.label}</Text>
                  <Ionicons name="chevron-down" size={14} color={Colors.dark} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color={Colors.dark} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person-circle-outline" size={30} color={Colors.dark} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        stickyHeaderIndices={[2]}
      >
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>{getGreeting()}{userName ? `, ${userName}` : ''} 👋</Text>
          <Text style={styles.greetingSub}>What are you craving today?</Text>
        </View>

        {/* Search Bar — taps to Universal Search */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={20} color={Colors.grey} />
          <Text style={styles.searchPlaceholder}>Search food, shops, items...</Text>
          <View style={styles.searchFilter}>
            <Ionicons name="options-outline" size={18} color={Colors.white} />
          </View>
        </TouchableOpacity>

        {/* Sticky Filter Row */}
        <View style={styles.filterRow}>
          {/* Veg Toggle */}
          <TouchableOpacity
            style={[styles.filterChip, vegOnly && styles.filterChipActive]}
            onPress={() => setVegOnly(!vegOnly)}
          >
            <View style={[styles.vegDot, vegOnly && styles.vegDotActive]} />
            <Text style={[styles.filterChipText, vegOnly && styles.filterChipTextActive]}>Pure Veg</Text>
          </TouchableOpacity>

          {/* Open Now */}
          <TouchableOpacity
            style={[styles.filterChip, openNow && styles.filterChipActive]}
            onPress={() => setOpenNow(!openNow)}
          >
            <Ionicons name="time-outline" size={13} color={openNow ? Colors.white : Colors.dark} />
            <Text style={[styles.filterChipText, openNow && styles.filterChipTextActive]}>Open Now</Text>
          </TouchableOpacity>

          {/* Sort */}
          <TouchableOpacity
            style={[styles.filterChip, sortBy !== 'relevance' && styles.filterChipActive]}
            onPress={() => setShowSort(true)}
          >
            <Ionicons name="swap-vertical-outline" size={13} color={sortBy !== 'relevance' ? Colors.white : Colors.dark} />
            <Text style={[styles.filterChipText, sortBy !== 'relevance' && styles.filterChipTextActive]}>
              {SORT_OPTIONS.find(o => o.id === sortBy)?.label || 'Sort'}
            </Text>
            <Ionicons name="chevron-down" size={11} color={sortBy !== 'relevance' ? Colors.white : Colors.dark} />
          </TouchableOpacity>
        </View>

        {/* Dynamic Banner */}
        <View style={styles.bannerContainer}>
          <LinearGradient colors={banner.color} style={styles.banner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>{banner.title}</Text>
              <Text style={styles.bannerSub}>{banner.sub}</Text>
            </View>
            <Text style={styles.bannerEmoji}>{banner.emoji}</Text>
          </LinearGradient>
          {/* Dots */}
          <View style={styles.bannerDots}>
            {banners.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setActiveBanner(i)}>
                <View style={[styles.dot, i === activeBanner && styles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
            {CATEGORIES.map(cat => {
              const active = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catBtn, active && { backgroundColor: cat.accent, borderColor: cat.accent }]}
                  onPress={() => setSelectedCategory(active ? null : cat.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.catEmojiBox, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : cat.color }]}>
                    <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  </View>
                  <Text style={[styles.catName, active && styles.catNameActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Featured Shops */}
        {featured.length > 0 && !selectedCategory && !vegOnly && !openNow && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⭐ Featured</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ShopList', { featured: true })}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={featured.slice(0, 6)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingLeft: Spacing.lg, paddingRight: Spacing.sm }}
              renderItem={({ item }) => (
                <ShopCard
                  shop={item}
                  horizontal
                  onPress={() => navigation.navigate('ShopDetail', { shopId: item.id, shop: item })}
                />
              )}
            />
          </View>
        )}

        {/* All / Filtered Shops */}
        <View style={[styles.section, { marginBottom: 32 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory
                ? `${CATEGORIES.find(c => c.id === selectedCategory)?.emoji} ${CATEGORIES.find(c => c.id === selectedCategory)?.name}`
                : '🏪 All Shops'}
            </Text>
            <Text style={styles.shopCount}>{filteredShops.length} shops</Text>
          </View>

          {filteredShops.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>No shops found</Text>
              <Text style={styles.emptySub}>Try changing filters or check back later</Text>
              <TouchableOpacity style={styles.clearBtn} onPress={() => {
                setSelectedCategory(null); setVegOnly(false); setOpenNow(false); setSortBy('relevance');
              }}>
                <Text style={styles.clearBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredShops.map(shop => (
              <ShopCard
                key={shop.id}
                shop={shop}
                onPress={() => navigation.navigate('ShopDetail', { shopId: shop.id, shop })}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  locationBtn: { flex: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { flex: 1 },
  locationLabel: { fontSize: Fonts.sizes.xs, color: Colors.grey },
  locationName: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationValue: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.dark, maxWidth: 200 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifBtn: { position: 'relative', padding: 4 },
  profileBtn: { padding: 2 },
  notifDot: {
    position: 'absolute', top: 4, right: 4,
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error,
  },
  greetingRow: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  greeting: { fontSize: Fonts.sizes.xxl, fontWeight: '900', color: Colors.dark, letterSpacing: -0.5 },
  greetingSub: { fontSize: Fonts.sizes.md, color: Colors.grey, marginTop: 4, fontWeight: '400' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl, paddingHorizontal: Spacing.md,
    height: 52, gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.border,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: Spacing.sm,
  },
  searchPlaceholder: { flex: 1, fontSize: Fonts.sizes.md, color: Colors.lightGrey },
  searchFilter: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    padding: 8,
  },
  filterRow: {
    flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: Fonts.sizes.xs, fontWeight: '700', color: Colors.dark },
  filterChipTextActive: { color: Colors.white },
  vegDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: Colors.success },
  vegDotActive: { backgroundColor: Colors.white, borderColor: Colors.white },
  bannerContainer: { marginHorizontal: Spacing.lg, marginVertical: Spacing.md },
  banner: {
    borderRadius: Radius.xl, padding: Spacing.xl,
    flexDirection: 'row', alignItems: 'center', minHeight: 116, overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: Fonts.sizes.xl, fontWeight: '900', color: Colors.white, marginBottom: 6, letterSpacing: -0.3 },
  bannerSub: { fontSize: Fonts.sizes.sm, color: 'rgba(255,255,255,0.88)', lineHeight: 20 },
  bannerEmoji: { fontSize: 56, marginLeft: 12 },
  bannerDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.lightGrey },
  dotActive: { width: 22, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  section: { marginBottom: Spacing.md },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm,
  },
  sectionTitle: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.dark, letterSpacing: -0.2 },
  seeAll: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '700' },
  shopCount: {
    fontSize: Fonts.sizes.xs, color: Colors.grey,
    backgroundColor: Colors.background, paddingHorizontal: 10,
    paddingVertical: 3, borderRadius: Radius.full, fontWeight: '600',
  },
  catRow: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.sm },
  catBtn: {
    alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
    borderRadius: Radius.lg, backgroundColor: Colors.white,
    borderWidth: 1.5, borderColor: Colors.border, minWidth: 68,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  catEmojiBox: {
    width: 44, height: 44, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', marginBottom: 5,
  },
  catEmoji: { fontSize: 22 },
  catName: { fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.semibold, color: Colors.dark },
  catNameActive: { color: Colors.white },
  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyText: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.dark },
  emptySub: { fontSize: Fonts.sizes.sm, color: Colors.grey, marginTop: 4, textAlign: 'center' },
  clearBtn: {
    marginTop: Spacing.lg, backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: Radius.md,
  },
  clearBtnText: { color: Colors.white, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  sortOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 999, justifyContent: 'flex-end',
  },
  sortSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl, padding: Spacing.xl, paddingBottom: 36,
  },
  sortTitle: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.dark, marginBottom: Spacing.md },
  sortOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sortOptionText: { fontSize: Fonts.sizes.md, color: Colors.dark },
  sortOptionActive: { color: Colors.primary, fontWeight: Fonts.weights.bold },
});
