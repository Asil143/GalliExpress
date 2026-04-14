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

const CATEGORIES = [
  'ఆహారం', 'కిరాణా', 'కూరగాయలు', 'పండ్లు',
  'పాల పదార్థాలు', 'మాంసం', 'బేకరీ', 'మిఠాయిలు',
  'పానీయాలు', 'స్టేషనరీ', 'వ్యక్తిగత', 'పూజా సామాను',
];

export default function AddItemScreen({ navigation, route }) {
  const { item: existingItem } = route.params || {};
  const isEditing = !!existingItem;
  const user = auth().currentUser;

  const [name, setName] = useState(existingItem?.name || '');
  const [price, setPrice] = useState(existingItem?.price?.toString() || '');
  const [description, setDescription] = useState(existingItem?.description || '');
  const [category, setCategory] = useState(existingItem?.category || '');
  const [isAvailable, setIsAvailable] = useState(existingItem?.isAvailable !== false);
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
        shopId: user?.uid,
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
      Alert.alert('తప్పు జరిగింది', 'సేవ్ చేయడంలో వైఫల్యం');
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
        <Text style={styles.headerTitle}>{isEditing ? 'వస్తువు మార్చు' : 'వస్తువు జోడించు'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.label}>వస్తువు పేరు *</Text>
            <TextInput
              style={styles.input}
              placeholder="ఉదా: వెజ్ బిర్యాని"
              placeholderTextColor={Colors.lightGrey}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Price */}
          <View style={styles.field}>
            <Text style={styles.label}>ధర (₹) *</Text>
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
            <Text style={styles.label}>వివరణ (ఐచ్ఛికం)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="వస్తువు గురించి వివరణ..."
              placeholderTextColor={Colors.lightGrey}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={styles.label}>కేటగరీ *</Text>
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

          {/* Availability Toggle */}
          <View style={[styles.field, styles.availabilityRow]}>
            <View>
              <Text style={styles.label}>అందుబాటులో ఉందా?</Text>
              <Text style={styles.availSub}>
                {isAvailable ? '✅ కస్టమర్లు ఆర్డర్ చేయవచ్చు' : '❌ ఆర్డర్ చేయలేరు'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, { backgroundColor: isAvailable ? Colors.success : Colors.error }]}
              onPress={() => setIsAvailable(!isAvailable)}
            >
              <Text style={styles.toggleText}>{isAvailable ? 'అవును' : 'కాదు'}</Text>
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
              : <Text style={styles.saveText}>{isEditing ? '✓ అప్‌డేట్ చేయి' : '+ జోడించు'}</Text>}
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
