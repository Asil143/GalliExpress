// GalliExpress Partner — Shop Setup / Claim Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { useShop } from '../../context/ShopContext';

export default function ShopSetupScreen() {
  const { linkShop } = useShop();
  const [shops, setShops] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(null);

  useEffect(() => {
    firestore()
      .collection('shops')
      .where('town', '==', 'addanki')
      .where('isActive', '==', true)
      .get()
      .then((snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setShops(data);
        setFiltered(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!query.trim()) { setFiltered(shops); return; }
    const q = query.toLowerCase();
    setFiltered(shops.filter(s => s.name.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q)));
  }, [query, shops]);

  const handleSelect = (shop) => {
    Alert.alert(
      'Claim This Shop?',
      `Is "${shop.name}" your shop?\n\nThis will link your account to this shop.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, This is My Shop',
          onPress: async () => {
            setLinking(shop.id);
            try {
              await linkShop(shop.id);
            } catch (e) {
              Alert.alert('Error', e?.message || 'Could not link shop. Please try again.');
            } finally {
              setLinking(null);
            }
          },
        },
      ]
    );
  };

  const renderShop = ({ item }) => (
    <TouchableOpacity
      style={[styles.shopCard, Shadows.sm]}
      onPress={() => handleSelect(item)}
      disabled={linking === item.id}
      activeOpacity={0.8}
    >
      <View style={styles.shopEmoji}>
        <Text style={{ fontSize: 28 }}>{item.emoji || '🏪'}</Text>
      </View>
      <View style={styles.shopInfo}>
        <Text style={styles.shopName}>{item.name}</Text>
        <Text style={styles.shopCategory}>{item.category}</Text>
        <Text style={styles.shopAddress} numberOfLines={1}>{item.address}</Text>
      </View>
      {linking === item.id ? (
        <ActivityIndicator color={Colors.primary} />
      ) : (
        <View style={styles.selectBtn}>
          <Text style={styles.selectBtnText}>Select</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#1C1C2E', '#3D3D5C']} style={styles.header}>
        <Text style={styles.headerEmoji}>🏪</Text>
        <Text style={styles.headerTitle}>Select Your Shop</Text>
        <Text style={styles.headerSub}>Find and claim your shop to start receiving orders</Text>
      </LinearGradient>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={Colors.grey} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by shop name or category..."
          placeholderTextColor={Colors.lightGrey}
          value={query}
          onChangeText={setQuery}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.lightGrey} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading shops...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={renderShop}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ fontSize: 40 }}>🔍</Text>
              <Text style={styles.emptyText}>No shops found</Text>
              <Text style={styles.emptySub}>Try a different search term</Text>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don't see your shop? Contact us at{' '}
          <Text style={styles.footerLink}>support@galliexpress.in</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: Spacing.xl, paddingBottom: Spacing.xxl, alignItems: 'center', gap: 6, paddingHorizontal: Spacing.lg },
  headerEmoji: { fontSize: 44, marginBottom: 4 },
  headerTitle: { fontSize: Fonts.sizes.xxl, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: Fonts.sizes.sm, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: Spacing.lg, marginTop: -20,
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    ...Shadows.md,
  },
  searchInput: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.dark },
  shopCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  shopEmoji: {
    width: 56, height: 56, borderRadius: Radius.md,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  shopInfo: { flex: 1 },
  shopName: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.dark },
  shopCategory: { fontSize: Fonts.sizes.xs, color: Colors.primary, marginTop: 2 },
  shopAddress: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 2 },
  selectBtn: {
    backgroundColor: Colors.primary + '15', borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  selectBtnText: { fontSize: Fonts.sizes.xs, fontWeight: '700', color: Colors.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 60 },
  loadingText: { fontSize: Fonts.sizes.sm, color: Colors.grey },
  emptyText: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.dark },
  emptySub: { fontSize: Fonts.sizes.sm, color: Colors.grey },
  footer: { padding: Spacing.lg, alignItems: 'center' },
  footerText: { fontSize: Fonts.sizes.xs, color: Colors.grey, textAlign: 'center' },
  footerLink: { color: Colors.primary, fontWeight: '600' },
});
