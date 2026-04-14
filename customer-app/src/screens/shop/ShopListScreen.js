// GalliExpress Customer — Shop List Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl,
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

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFiltered(shops);
    } else {
      setFiltered(
        shops.filter((s) =>
          s.name?.toLowerCase().includes(search.toLowerCase())
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
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setShops(data);
      setFiltered(data);
    } catch (e) {
      console.error('Error loading shops:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShops();
    setRefreshing(false);
  };

  const title = categoryName
    ? `${categoryName} షాపులు`
    : featured
    ? '⭐ ప్రముఖ షాపులు'
    : '🏪 అన్ని షాపులు';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.grey} />
        <TextInput
          style={styles.searchInput}
          placeholder="షాప్ వెతకండి..."
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

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>లోడ్ అవుతోంది...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🏪</Text>
          <Text style={styles.emptyText}>షాపులు కనుగొనబడలేదు</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.dark },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    margin: Spacing.lg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 46,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  searchInput: { flex: 1, fontSize: Fonts.sizes.md, color: Colors.dark },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Colors.grey, fontSize: Fonts.sizes.md },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.semibold, color: Colors.dark },
});
