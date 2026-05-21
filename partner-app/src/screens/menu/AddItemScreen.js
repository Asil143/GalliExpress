// GalliExpress Partner — Add / Edit Menu Item Screen

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { isValidPrice } from '../../../../shared/utils';
import { useShop } from '../../context/ShopContext';

const CATEGORIES = [
  'Food', 'Grocery', 'Vegetables', 'Fruits',
  'Dairy', 'Meat', 'Bakery', 'Sweets',
  'Beverages', 'Stationery', 'Personal Care', 'Pooja Items',
];

export default function AddItemScreen({ navigation, route }) {
  const { item: existingItem } = route.params || {};
  const isEditing = !!existingItem;
  const { shopId } = useShop();

  const [name, setName] = useState(existingItem?.name || '');
  const [price, setPrice] = useState(existingItem?.price?.toString() || '');
  const [description, setDescription] = useState(existingItem?.description || '');
  const [category, setCategory] = useState(existingItem?.category || '');
  const [isAvailable, setIsAvailable] = useState(existingItem?.isAvailable !== false);
  const [isVeg, setIsVeg] = useState(existingItem?.isVeg ?? true);
  const [isBestSeller, setIsBestSeller] = useState(existingItem?.isBestSeller || false);
  const [loading, setLoading] = useState(false);

  const isValid = name.trim().length > 0 && isValidPrice(price) && category.length > 0;

  const handleSave = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        price: parseFloat(price),
        description: description.trim(),
        category,
        isAvailable,
        isVeg,
        isBestSeller,
        shopId: shopId,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      if (isEditing) {
        await firestore().collection('menuItems').doc(existingItem.id).update(data);
      } else {
        await firestore().collection('menuItems').add({
          ...data,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Item' : 'Add Item'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Item Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Veg Biryani"
              placeholderTextColor={Colors.lightGrey}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Price */}
          <View style={styles.field}>
            <Text style={styles.label}>Price (₹) *</Text>
            <View style={styles.priceInput}>
              <Text style={styles.rupeeSign}>₹</Text>
              <TextInput
                style={[styles.input, { flex: 1, borderWidth: 0 }]}
                placeholder="0"
                placeholderTextColor={Colors.lightGrey}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description about the item..."
              placeholderTextColor={Colors.lightGrey}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, category === cat && styles.catChipSelected]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catText, category === cat && styles.catTextSelected]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Veg / Non-Veg */}
          <View style={styles.field}>
            <Text style={styles.label}>Food Type *</Text>
            <View style={styles.foodTypeRow}>
              <TouchableOpacity
                style={[styles.foodTypeBtn, isVeg && styles.vegBtnActive]}
                onPress={() => setIsVeg(true)}
              >
                <Text style={styles.foodTypeBtnText}>🟢 Pure Veg</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.foodTypeBtn, !isVeg && styles.nonVegBtnActive]}
                onPress={() => setIsVeg(false)}
              >
                <Text style={styles.foodTypeBtnText}>🔴 Non-Veg</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Best Seller */}
          <View style={[styles.field, styles.availabilityRow]}>
            <View>
              <Text style={styles.label}>⭐ Mark as Best Seller?</Text>
              <Text style={styles.availSub}>
                {isBestSeller ? 'Highlighted prominently in menu' : 'Standard listing'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, { backgroundColor: isBestSeller ? Colors.secondary : Colors.lightGrey }]}
              onPress={() => setIsBestSeller(!isBestSeller)}
            >
              <Text style={styles.toggleText}>{isBestSeller ? 'Yes' : 'No'}</Text>
            </TouchableOpacity>
          </View>

          {/* Availability Toggle */}
          <View style={[styles.field, styles.availabilityRow]}>
            <View>
              <Text style={styles.label}>Available?</Text>
              <Text style={styles.availSub}>
                {isAvailable ? '✅ Customers can order' : '❌ Not orderable'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, { backgroundColor: isAvailable ? Colors.success : Colors.error }]}
              onPress={() => setIsAvailable(!isAvailable)}
            >
              <Text style={styles.toggleText}>{isAvailable ? 'Yes' : 'No'}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, (!isValid || loading) && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={!isValid || loading}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.saveGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.saveText}>{isEditing ? '✓ Update' : '+ Add'}</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  headerTitle: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.dark },
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  field: { gap: 8 },
  label: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.dark },
  input: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    fontSize: Fonts.sizes.md, color: Colors.dark,
    ...Shadows.sm,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  priceInput: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingLeft: Spacing.md, ...Shadows.sm,
  },
  rupeeSign: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: Colors.dark },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 50, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  catChipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  catText: { fontSize: Fonts.sizes.sm, color: Colors.darkGrey },
  catTextSelected: { color: Colors.primary, fontWeight: '700' },
  foodTypeRow: { flexDirection: 'row', gap: Spacing.sm },
  foodTypeBtn: {
    flex: 1, paddingVertical: 13, borderRadius: Radius.md,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  vegBtnActive: { borderColor: Colors.success, backgroundColor: Colors.success + '12' },
  nonVegBtnActive: { borderColor: Colors.error, backgroundColor: Colors.error + '12' },
  foodTypeBtnText: { fontSize: Fonts.sizes.md, fontWeight: '700' },
  availabilityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  availSub: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 2 },
  toggle: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: Radius.full,
  },
  toggleText: { color: Colors.white, fontWeight: '700', fontSize: Fonts.sizes.sm },
  footer: {
    padding: Spacing.lg, paddingBottom: 28,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  saveBtn: { borderRadius: Radius.md, overflow: 'hidden' },
  saveGradient: { height: 52, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.white },
});
