// GalliExpress — Universal Search Screen

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator, SectionList, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { getCategoryEmoji, formatPrice } from '../../../../shared/utils';

const RECENT_KEY = '@galliexpress_recent_searches';
const MAX_RECENT = 8;

const POPULAR = ['Biryani', 'Idly Dosa', 'Chicken', 'Meals', 'Juice', 'Bakery'];

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ shops: [], items: [] });
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    loadRecent();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (query.trim().length >= 2) {
      const timer = setTimeout(() => doSearch(query.trim()), 300);
      return () => clearTimeout(timer);
    } else {
      setResults({ shops: [], items: [] });
    }
  }, [query]);

  const loadRecent = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  };

  const saveRecent = async (term) => {
    try {
      const updated = [term, ...recentSearches.filter(r => r !== term)].slice(0, MAX_RECENT);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearRecent = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_KEY);
  };

  const doSearch = async (term) => {
    setLoading(true);
    try {
      const lower = term.toLowerCase();

      // Search shops
      const shopsSnap = await firestore()
        .collection('shops')
        .where('isActive', '==', true)
        .where('town', '==', 'addanki')
        .get();
      const allShops = shopsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const matchedShops = allShops.filter(s =>
        s.name?.toLowerCase().includes(lower) ||
        s.category?.toLowerCase().includes(lower) ||
        s.tags?.some(t => t.toLowerCase().includes(lower))
      );

      // Search menu items
      const itemsSnap = await firestore()
        .collection('menuItems')
        .where('isAvailable', '==', true)
        .get();
      const allItems = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const matchedItems = allItems.filter(i =>
        i.name?.toLowerCase().includes(lower) ||
        i.category?.toLowerCase().includes(lower) ||
        i.description?.toLowerCase().includes(lower)
      ).slice(0, 20);

      setResults({ shops: matchedShops, items: matchedItems });
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (term) => {
    setQuery(term);
    saveRecent(term);
    Keyboard.dismiss();
  };

  const handleShopPress = (shop) => {
    saveRecent(shop.name);
    navigation.navigate('ShopDetail', { shopId: shop.id, shop });
  };

  const handleItemPress = async (item) => {
    saveRecent(item.name);
    // Navigate to shop detail
    try {
      const shopDoc = await firestore().collection('shops').doc(item.shopId).get();
      if (shopDoc.exists) {
        navigation.navigate('ShopDetail', { shopId: item.shopId, shop: { id: item.shopId, ...shopDoc.data() } });
      }
    } catch {}
  };

  const hasResults = results.shops.length > 0 || results.items.length > 0;
  const showEmpty = query.length >= 2 && !loading && !hasResults;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <View style={styles.inputWrapper}>
          <Ionicons name="search" size={18} color={Colors.grey} style={styles.inputIcon} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search food, shops, items..."
            placeholderTextColor={Colors.lightGrey}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => query.trim() && saveRecent(query.trim())}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.grey} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {/* Before typing — show recent + popular */}
      {query.length < 2 && !loading && (
        <FlatList
          data={[]}
          ListHeaderComponent={() => (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Searches</Text>
                    <TouchableOpacity onPress={clearRecent}>
                      <Text style={styles.clearText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.chipRow}>
                    {recentSearches.map((r, i) => (
                      <TouchableOpacity key={i} style={styles.chip} onPress={() => handleSelect(r)}>
                        <Ionicons name="time-outline" size={13} color={Colors.grey} />
                        <Text style={styles.chipText}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Popular Searches */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular in Addanki</Text>
                <View style={styles.chipRow}>
                  {POPULAR.map((p, i) => (
                    <TouchableOpacity key={i} style={[styles.chip, styles.chipPopular]} onPress={() => handleSelect(p)}>
                      <Text style={styles.chipEmoji}>{getCategoryEmoji(p)}</Text>
                      <Text style={[styles.chipText, styles.chipPopularText]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
          keyExtractor={(_, i) => i.toString()}
          renderItem={null}
        />
      )}

      {/* Empty state */}
      {showEmpty && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>No results for "{query}"</Text>
          <Text style={styles.emptySub}>Try different keywords or browse categories</Text>
        </View>
      )}

      {/* Results */}
      {hasResults && (
        <SectionList
          keyboardShouldPersistTaps="handled"
          sections={[
            ...(results.shops.length > 0 ? [{
              title: `🏪 Shops (${results.shops.length})`,
              data: results.shops,
              type: 'shop',
            }] : []),
            ...(results.items.length > 0 ? [{
              title: `🍽️ Menu Items (${results.items.length})`,
              data: results.items,
              type: 'item',
            }] : []),
          ]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderSectionHeader={({ section }) => (
            <View style={styles.resultSectionHeader}>
              <Text style={styles.resultSectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item, section }) => {
            if (section.type === 'shop') {
              return (
                <TouchableOpacity style={styles.shopResult} onPress={() => handleShopPress(item)}>
                  <View style={styles.shopResultEmoji}>
                    <Text style={{ fontSize: 28 }}>{getCategoryEmoji(item.category)}</Text>
                  </View>
                  <View style={styles.shopResultInfo}>
                    <Text style={styles.shopResultName}>{item.name}</Text>
                    <Text style={styles.shopResultMeta}>
                      {item.category} • ⭐ {item.rating || '4.2'} • {item.deliveryTime || '25'} min
                    </Text>
                    <View style={[styles.openBadge, { backgroundColor: item.isOpen ? Colors.successLight : Colors.errorLight }]}>
                      <Text style={[styles.openBadgeText, { color: item.isOpen ? Colors.success : Colors.error }]}>
                        {item.isOpen ? 'Open' : 'Closed'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.lightGrey} />
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity style={styles.itemResult} onPress={() => handleItemPress(item)}>
                <View style={styles.itemResultEmoji}>
                  <Text style={{ fontSize: 24 }}>{getCategoryEmoji(item.category)}</Text>
                </View>
                <View style={styles.itemResultInfo}>
                  <View style={styles.itemNameRow}>
                    <Text style={styles.itemResultName}>{item.name}</Text>
                    {item.isVeg !== undefined && (
                      <View style={[styles.vegBox, { borderColor: item.isVeg ? Colors.success : Colors.error }]}>
                        <View style={[styles.vegInner, { backgroundColor: item.isVeg ? Colors.success : Colors.error }]} />
                      </View>
                    )}
                  </View>
                  {item.description ? (
                    <Text style={styles.itemResultDesc} numberOfLines={1}>{item.description}</Text>
                  ) : null}
                  <Text style={styles.itemResultPrice}>{formatPrice(item.price)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.lightGrey} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.white, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  inputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm, height: 44, gap: 6,
  },
  inputIcon: { marginLeft: 4 },
  input: { flex: 1, fontSize: Fonts.sizes.md, color: Colors.dark },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.lg },
  loadingText: { fontSize: Fonts.sizes.sm, color: Colors.grey },
  section: { padding: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.bold, color: Colors.dark, textTransform: 'uppercase', letterSpacing: 0.5 },
  clearText: { fontSize: Fonts.sizes.sm, color: Colors.primary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.white, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  chipPopular: { backgroundColor: Colors.primary + '12', borderColor: Colors.primary + '30' },
  chipText: { fontSize: Fonts.sizes.sm, color: Colors.dark },
  chipPopularText: { color: Colors.primary, fontWeight: Fonts.weights.semibold },
  chipEmoji: { fontSize: 14 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.dark },
  emptySub: { fontSize: Fonts.sizes.sm, color: Colors.grey, marginTop: 4, textAlign: 'center' },
  resultSectionHeader: {
    backgroundColor: Colors.background, paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  resultSectionTitle: { fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.bold, color: Colors.dark },
  shopResult: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, paddingHorizontal: Spacing.lg,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  shopResultEmoji: {
    width: 52, height: 52, borderRadius: Radius.md,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  shopResultInfo: { flex: 1, gap: 3 },
  shopResultName: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.dark },
  shopResultMeta: { fontSize: Fonts.sizes.xs, color: Colors.grey },
  openBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  openBadgeText: { fontSize: 10, fontWeight: Fonts.weights.bold },
  itemResult: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, paddingHorizontal: Spacing.lg,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  itemResultEmoji: {
    width: 48, height: 48, borderRadius: Radius.md,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  itemResultInfo: { flex: 1, gap: 3 },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemResultName: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold, color: Colors.dark },
  itemResultDesc: { fontSize: Fonts.sizes.xs, color: Colors.grey },
  itemResultPrice: { fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.bold, color: Colors.primary },
  vegBox: { width: 13, height: 13, borderRadius: 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  vegInner: { width: 6, height: 6, borderRadius: 3 },
});
