// GalliExpress Customer — Home Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { getGreeting, getCategoryEmoji } from '../../../../shared/strings';
import ShopCard from '../../components/ShopCard';
import CategoryButton from '../../components/CategoryButton';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'food', name: 'ఆహారం', emoji: '🍱' },
  { id: 'grocery', name: 'కిరాణా', emoji: '🛒' },
  { id: 'vegetables', name: 'కూరగాయలు', emoji: '🥦' },
  { id: 'fruits', name: 'పండ్లు', emoji: '🍎' },
  { id: 'dairy', name: 'పాల పదార్థాలు', emoji: '🥛' },
  { id: 'meat', name: 'మాంసం', emoji: '🐔' },
  { id: 'bakery', name: 'బేకరీ', emoji: '🍰' },
  { id: 'sweets', name: 'మిఠాయిలు', emoji: '🍬' },
  { id: 'beverages', name: 'పానీయాలు', emoji: '🥤' },
  { id: 'pooja', name: 'పూజా సామాను', emoji: '🪔' },
];

const BANNERS = [
  { id: 1, title: 'మొదటి ఆర్డర్‌పై 20% తగ్గింపు!', sub: 'GALLI20 కోడ్ వాడండి', color: ['#FF6B35', '#FF8C5A'] },
  { id: 2, title: '₹300 పైన ఉచిత డెలివరీ', sub: 'అన్ని ఆర్డర్లకు వర్తిస్తుంది', color: ['#FFB800', '#FF6B35'] },
  { id: 3, title: 'స్థానిక షాపులు, మెరుగైన ధరలు', sub: 'అడ్డంకిలో 50+ పార్టనర్లు', color: ['#5856D6', '#007AFF'] },
];

export default function HomeScreen({ navigation }) {
  const [shops, setShops] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const [userName, setUserName] = useState('');

  const user = auth().currentUser;

  useEffect(() => {
    loadShops();
    loadUserName();
    const bannerTimer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % BANNERS.length);
    }, 3000);
    return () => clearInterval(bannerTimer);
  }, []);

  const loadUserName = async () => {
    if (user?.displayName) {
      setUserName(user.displayName.split(' ')[0]);
    }
  };

  const loadShops = async () => {
    try {
      const snapshot = await firestore()
        .collection('shops')
        .where('isActive', '==', true)
        .where('town', '==', 'addanki')
        .get();
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setShops(data);
      setFeatured(data.filter((s) => s.isFeatured));
    } catch (e) {
      console.error('Error loading shops:', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShops();
    setRefreshing(false);
  };

  const filteredShops = shops.filter((shop) => {
    const matchSearch = search
      ? shop.name?.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchCategory = selectedCategory
      ? shop.category === selectedCategory
      : true;
    return matchSearch && matchCategory;
  });

  const greeting = getGreeting();
  const banner = BANNERS[activeBanner];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.locationLabel}>📍 డెలివరీ లొకేషన్</Text>
            <TouchableOpacity style={styles.locationRow}>
              <Text style={styles.locationText}>అడ్డంకి, ప్రకాశం</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.dark} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={24} color={Colors.dark} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>
            {greeting}{userName ? `, ${userName}` : ''} 👋
          </Text>
          <Text style={styles.greetingSub}>ఏమి కావాలి ఈరోజు?</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.grey} />
          <TextInput
            style={styles.searchInput}
            placeholder="ఆహారం, కిరాణా వెతకండి..."
            placeholderTextColor={Colors.lightGrey}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={Colors.grey} />
            </TouchableOpacity>
          )}
        </View>

        {/* Banner */}
        <LinearGradient
          colors={banner.color}
          style={styles.banner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>{banner.title}</Text>
            <Text style={styles.bannerSub}>{banner.sub}</Text>
          </View>
          <Text style={styles.bannerEmoji}>🎉</Text>
          {/* Dots */}
          <View style={styles.bannerDots}>
            {BANNERS.map((_, i) => (
              <View key={i} style={[styles.dot, i === activeBanner && styles.dotActive]} />
            ))}
          </View>
        </LinearGradient>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>కేటగరీలు</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
            {CATEGORIES.map((cat) => (
              <CategoryButton
                key={cat.id}
                emoji={cat.emoji}
                name={cat.name}
                isSelected={selectedCategory === cat.id}
                onPress={() => setSelectedCategory(
                  selectedCategory === cat.id ? null : cat.id
                )}
              />
            ))}
          </ScrollView>
        </View>

        {/* Featured Shops */}
        {featured.length > 0 && !search && !selectedCategory && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⭐ ప్రముఖ షాపులు</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ShopList', { featured: true })}>
                <Text style={styles.seeAll}>అన్నీ చూడు</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={featured.slice(0, 5)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingLeft: Spacing.lg }}
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

        {/* All Shops */}
        <View style={[styles.section, { marginBottom: 24 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory
                ? `${CATEGORIES.find((c) => c.id === selectedCategory)?.name} షాపులు`
                : '🏪 అన్ని షాపులు'}
            </Text>
            <Text style={styles.shopCount}>{filteredShops.length} షాపులు</Text>
          </View>
          {filteredShops.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🏪</Text>
              <Text style={styles.emptyText}>షాపులు కనుగొనబడలేదు</Text>
              <Text style={styles.emptySubText}>త్వరలో మరిన్ని షాపులు వస్తాయి!</Text>
            </View>
          ) : (
            filteredShops.map((shop) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                onPress={() => navigation.navigate('ShopDetail', { shopId: shop.id, shop })}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {},
  locationLabel: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginBottom: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.dark },
  notifBtn: { position: 'relative', padding: 4 },
  notifDot: {
    position: 'absolute', top: 4, right: 4,
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error,
  },
  greetingRow: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  greeting: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.dark },
  greetingSub: { fontSize: Fonts.sizes.sm, color: Colors.grey, marginTop: 2 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: Spacing.sm,
    ...Shadows.sm,
    marginBottom: Spacing.lg,
  },
  searchInput: { flex: 1, fontSize: Fonts.sizes.md, color: Colors.dark },
  banner: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    minHeight: 90,
    overflow: 'hidden',
  },
  bannerContent: { flex: 1 },
  bannerTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.white,
    marginBottom: 4,
  },
  bannerSub: { fontSize: Fonts.sizes.sm, color: 'rgba(255,255,255,0.85)' },
  bannerEmoji: { fontSize: 40, marginLeft: 12 },
  bannerDots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { width: 18, backgroundColor: Colors.white },
  section: { marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.dark,
  },
  seeAll: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: Fonts.weights.semibold },
  shopCount: { fontSize: Fonts.sizes.sm, color: Colors.grey },
  categoriesRow: { paddingHorizontal: Spacing.lg, gap: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.semibold, color: Colors.dark },
  emptySubText: { fontSize: Fonts.sizes.sm, color: Colors.grey, marginTop: 4 },
});
