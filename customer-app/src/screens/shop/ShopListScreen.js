// GalliExpress Customer — Shop List Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import ShopCard from '../../components/ShopCard';

export default function ShopListScreen({ navigation, route }) {
  const { category, categoryName, featured } = route.params || {};

  const [shops, setShops] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters
  const [openNow, setOpenNow] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'rating' | 'delivery' | 'minOrder'

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFiltered(shops);
    } else {
      setFiltered(
        shops.filter((s) =>
          s.name?.toLowerCase().includes(search.toLowerCase()) ||
          s.category?.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, shops]);

  const loadShops = async () => {
    try {
      let query = firestore()
        .collection('shops')
        .where('isActive', '==', true)
        .where('town', '==', 'addanki');

      if (category) query = query.where('category', '==', category);
      if (featured) query = query.where('isFeatured', '==', true);

      const snapshot = await query.get();
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isOpen: doc.data().isOpen !== false,
      }));
      setShops(data);
      setFiltered(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShops();
    setRefreshing(false);
  };

  const clearFilters = () => {
    setOpenNow(false);
    setVegOnly(false);
    setSortBy('default');
  };

  const hasActiveFilter = openNow || vegOnly || sortBy !== 'default';

  const displayed = filtered
    .filter(s => !openNow || s.isOpen)
    .filter(s => !vegOnly || s.isVeg)
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'delivery') return (parseInt(a.deliveryTime) || 30) - (parseInt(b.deliveryTime) || 30);
      if (sortBy === 'minOrder') return (a.minOrder || 0) - (b.minOrder || 0);
      // Default: open shops first
      if (a.isOpen && !b.isOpen) return -1;
      if (!a.isOpen && b.isOpen) return 1;
      return 0;
    });

  const title = categoryName
    ? `${categoryName} Shops`
    : featured
    ? '⭐ Featured Shops'
    : '🏪 All Shops';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{displayed.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.grey} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search shops or cuisine..."
          placeholderTextColor={Colors.lightGrey}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.grey} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter / Sort Chips */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.chip, openNow && styles.chipActive]}
            onPress={() => setOpenNow(!openNow)}
          >
            <Ionicons name="time-outline" size={13} color={openNow ? Colors.white : Colors.dark} />
            <Text style={[styles.chipText, openNow && styles.chipTextActive]}>Open Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, vegOnly && styles.chipActive]}
            onPress={() => setVegOnly(!vegOnly)}
          >
            <View style={[styles.vegDot, vegOnly && { backgroundColor: Colors.white, borderColor: Colors.white }]} />
            <Text style={[styles.chipText, vegOnly && styles.chipTextActive]}>Veg Only</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, sortBy === 'rating' && styles.chipActive]}
            onPress={() => setSortBy(sortBy === 'rating' ? 'default' : 'rating')}
          >
            <Ionicons name="star" size={13} color={sortBy === 'rating' ? Colors.white : Colors.secondary} />
            <Text style={[styles.chipText, sortBy === 'rating' && styles.chipTextActive]}>Top Rated</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, sortBy === 'delivery' && styles.chipActive]}
            onPress={() => setSortBy(sortBy === 'delivery' ? 'default' : 'delivery')}
          >
            <Ionicons name="flash-outline" size={13} color={sortBy === 'delivery' ? Colors.white : Colors.dark} />
            <Text style={[styles.chipText, sortBy === 'delivery' && styles.chipTextActive]}>Fastest</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, sortBy === 'minOrder' && styles.chipActive]}
            onPress={() => setSortBy(sortBy === 'minOrder' ? 'default' : 'minOrder')}
          >
            <Ionicons name="trending-down-outline" size={13} color={sortBy === 'minOrder' ? Colors.white : Colors.dark} />
            <Text style={[styles.chipText, sortBy === 'minOrder' && styles.chipTextActive]}>Low Min</Text>
          </TouchableOpacity>

          {hasActiveFilter && (
            <TouchableOpacity style={styles.clearChip} onPress={clearFilters}>
              <Ionicons name="close" size={13} color={Colors.error} />
              <Text style={styles.clearChipText}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading shops...</Text>
        </View>
      ) : displayed.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyText}>No shops found</Text>
          <Text style={styles.emptySub}>Try adjusting your filters</Text>
          {hasActiveFilter && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
              <Text style={styles.clearBtnText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          renderItem={({ item }) => (
            <ShopCard
              shop={item}
              onPress={() => navigation.navigate('ShopDetail', { shopId: item.id, shop: item })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.dark, flex: 1, textAlign: 'center' },
  countBadge: {
    backgroundColor: Colors.primary + '18', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: Radius.full,
  },
  countText: { fontSize: Fonts.sizes.xs, fontWeight: '700', color: Colors.primary },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    margin: Spacing.lg, marginBottom: Spacing.sm,
    borderRadius: Radius.xl, paddingHorizontal: Spacing.md, height: 48,
    gap: Spacing.sm, borderWidth: 1.5, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: Fonts.sizes.md, color: Colors.dark },
  filterRow: {
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  filterScroll: { paddingHorizontal: Spacing.lg, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Fonts.sizes.xs, fontWeight: '700', color: Colors.dark },
  chipTextActive: { color: Colors.white },
  vegDot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: Colors.success },
  clearChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: Radius.full, backgroundColor: Colors.error + '12',
    borderWidth: 1, borderColor: Colors.error + '30',
  },
  clearChipText: { fontSize: Fonts.sizes.xs, fontWeight: '700', color: Colors.error },
  list: { paddingTop: Spacing.md, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { color: Colors.grey, fontSize: Fonts.sizes.md },
  emptyEmoji: { fontSize: 52, marginBottom: 4 },
  emptyText: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.dark },
  emptySub: { fontSize: Fonts.sizes.sm, color: Colors.grey },
  clearBtn: {
    marginTop: Spacing.md, backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: Radius.md,
  },
  clearBtnText: { color: Colors.white, fontWeight: '700' },
});
