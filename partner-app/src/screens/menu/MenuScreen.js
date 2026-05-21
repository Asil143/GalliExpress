// GalliExpress Partner — Menu Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Switch, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { formatPrice, getCategoryEmoji } from '../../../../shared/utils';
import { useShop } from '../../context/ShopContext';

export default function MenuScreen({ navigation }) {
  const { shopId } = useShop();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (!shopId) return;
    const unsub = firestore()
      .collection('menuItems')
      .where('shopId', '==', shopId)
      .onSnapshot(
        (snap) => {
          if (!snap) { setLoading(false); return; }
          const sorted = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.category || '').localeCompare(b.category || ''));
          setItems(sorted);
          setLoading(false);
        },
        () => { setLoading(false); }
      );
    return unsub;
  }, []);

  const toggleAvailability = async (itemId, current) => {
    setUpdating(itemId);
    try {
      await firestore().collection('menuItems').doc(itemId).update({ isAvailable: !current });
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Item?',
      `Remove "${item.name}" from menu?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await firestore().collection('menuItems').doc(item.id).delete();
          },
        },
      ]
    );
  };

  // Group by category
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const renderItem = (item) => (
    <View key={item.id} style={[styles.menuItem, Shadows.sm]}>
      <View style={styles.itemImageBox}>
        <Text style={styles.itemEmoji}>{getCategoryEmoji(item.category)}</Text>
      </View>
      <View style={styles.itemInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          {item.isVeg !== undefined && (
            <View style={[styles.vegBox, { borderColor: item.isVeg ? Colors.success : Colors.error }]}>
              <View style={[styles.vegDot, { backgroundColor: item.isVeg ? Colors.success : Colors.error }]} />
            </View>
          )}
        </View>
        {item.isBestSeller && (
          <View style={styles.bestSellerBadge}>
            <Text style={styles.bestSellerText}>⭐ Best Seller</Text>
          </View>
        )}
        {item.description ? (
          <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
        ) : null}
        <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
      </View>
      <View style={styles.itemActions}>
        <Switch
          value={item.isAvailable !== false}
          onValueChange={() => toggleAvailability(item.id, item.isAvailable !== false)}
          disabled={updating === item.id}
          trackColor={{ false: Colors.error + '40', true: Colors.success + '60' }}
          thumbColor={item.isAvailable !== false ? Colors.success : Colors.error}
        />
        <View style={styles.iconBtns}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('AddItem', { item })}
          >
            <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { borderColor: Colors.error + '40' }]}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Menu</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddItem', {})}
        >
          <LinearGradientText />
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statItem}>
          <Text style={styles.statNum}>{items.length}</Text> items
        </Text>
        <Text style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.success }]}>
            {items.filter((i) => i.isAvailable !== false).length}
          </Text> available
        </Text>
        <Text style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.error }]}>
            {items.filter((i) => i.isAvailable === false).length}
          </Text> unavailable
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyTitle}>Menu is Empty</Text>
          <Text style={styles.emptySub}>Add items to your menu</Text>
          <TouchableOpacity
            style={styles.addFirstBtn}
            onPress={() => navigation.navigate('AddItem', {})}
          >
            <Text style={styles.addFirstBtnText}>+ Add First Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={Object.keys(grouped)}
          keyExtractor={(cat) => cat}
          contentContainerStyle={{ padding: Spacing.lg }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: category }) => (
            <View style={styles.categorySection}>
              <Text style={styles.categoryTitle}>
                {getCategoryEmoji(category)} {category}
              </Text>
              {grouped[category].map(renderItem)}
            </View>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddItem', {})}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function LinearGradientText() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.primary, borderRadius: Radius.md }}>
      <Ionicons name="add" size={18} color={Colors.white} />
      <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 13 }}>Add</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.dark },
  addBtn: {},
  statsBar: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: Colors.white, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  statItem: { fontSize: Fonts.sizes.xs, color: Colors.grey },
  statNum: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.dark },
  categorySection: { marginBottom: Spacing.xl },
  categoryTitle: {
    fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.dark,
    marginBottom: Spacing.sm,
    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm,
  },
  itemImageBox: {
    width: 56, height: 56, borderRadius: Radius.md,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  itemEmoji: { fontSize: 28 },
  itemInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  itemName: { flex: 1, fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.dark },
  vegBox: { width: 14, height: 14, borderRadius: 3, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  bestSellerBadge: {
    backgroundColor: '#FFF8E1', borderRadius: 4, paddingHorizontal: 6,
    paddingVertical: 2, marginBottom: 4, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: '#FFD54F',
  },
  bestSellerText: { fontSize: 9, color: '#E65100', fontWeight: '700' },
  itemDesc: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginBottom: 4 },
  itemPrice: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.primary },
  itemActions: { alignItems: 'flex-end', gap: 8 },
  iconBtns: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 30, height: 30, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: Colors.dark },
  emptySub: { fontSize: Fonts.sizes.sm, color: Colors.grey },
  addFirstBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md, borderRadius: Radius.md, marginTop: 8,
  },
  addFirstBtnText: { color: Colors.white, fontWeight: '700', fontSize: Fonts.sizes.md },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8,
  },
});
