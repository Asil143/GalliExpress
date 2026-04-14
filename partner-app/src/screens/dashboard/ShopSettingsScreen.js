// GalliExpress Partner — Shop Settings Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../../shared/theme';

export default function ShopSettingsScreen({ navigation }) {
  const [shop, setShop] = useState(null);
  const [shopId, setShopId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const uid = auth().currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    firestore()
      .collection('shops')
      .where('partnerId', '==', uid)
      .limit(1)
      .get()
      .then((snap) => {
        if (!snap.empty) {
          const doc = snap.docs[0];
          const data = { id: doc.id, ...doc.data() };
          setShop(data);
          setShopId(doc.id);
          setName(data.name || '');
          setDescription(data.description || '');
          setMinOrder(String(data.minOrder || ''));
          setDeliveryTime(data.deliveryTime || '');
          setIsOpen(data.isOpen ?? true);
        }
        setLoading(false);
      });
  }, [uid]);

  const saveSettings = async () => {
    if (!shopId) return;
    if (!name.trim()) {
      Alert.alert('తప్పు', 'షాప్ పేరు నమోదు చేయండి');
      return;
    }
    setSaving(true);
    try {
      await firestore().collection('shops').doc(shopId).update({
        name: name.trim(),
        description: description.trim(),
        minOrder: parseInt(minOrder) || 0,
        deliveryTime: deliveryTime.trim(),
        isOpen,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      Alert.alert('విజయం', 'షాప్ సెట్టింగ్స్ అప్‌డేట్ అయ్యాయి');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleShopOpen = async (value) => {
    setIsOpen(value);
    if (shopId) {
      await firestore().collection('shops').doc(shopId).update({ isOpen: value });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>షాప్ సెట్టింగ్స్</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Open/Close Toggle */}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Text style={styles.toggleTitle}>షాప్ తెరిచి ఉంది</Text>
              <Text style={styles.toggleSub}>
                {isOpen ? 'కస్టమర్లు ఆర్డర్ చేయగలరు' : 'ఆర్డర్లు స్వీకరించడం లేదు'}
              </Text>
            </View>
            <Switch
              value={isOpen}
              onValueChange={toggleShopOpen}
              trackColor={{ false: Colors.lightGrey, true: Colors.successLight }}
              thumbColor={isOpen ? Colors.success : Colors.grey}
            />
          </View>
        </View>

        {/* Shop Details Form */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>షాప్ వివరాలు</Text>

          <Text style={styles.label}>షాప్ పేరు</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="మీ షాప్ పేరు"
            placeholderTextColor={Colors.lightGrey}
          />

          <Text style={styles.label}>వివరణ</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={description}
            onChangeText={setDescription}
            placeholder="మీ షాప్ గురించి చిన్న వివరణ..."
            placeholderTextColor={Colors.lightGrey}
            multiline
          />

          <Text style={styles.label}>కనీస ఆర్డర్ (₹)</Text>
          <TextInput
            style={styles.input}
            value={minOrder}
            onChangeText={setMinOrder}
            placeholder="50"
            placeholderTextColor={Colors.lightGrey}
            keyboardType="numeric"
          />

          <Text style={styles.label}>డెలివరీ సమయం</Text>
          <TextInput
            style={styles.input}
            value={deliveryTime}
            onChangeText={setDeliveryTime}
            placeholder="25-30 నిమిషాలు"
            placeholderTextColor={Colors.lightGrey}
          />
        </View>

        {/* Save Button */}
        <View style={styles.saveContainer}>
          <TouchableOpacity style={styles.saveBtn} onPress={saveSettings} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>సెట్టింగ్స్ సేవ్ చేయి</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
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
  card: {
    backgroundColor: Colors.white,
    margin: Spacing.lg,
    marginBottom: 0,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLeft: { flex: 1 },
  toggleTitle: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold, color: Colors.dark },
  toggleSub: { fontSize: Fonts.sizes.sm, color: Colors.grey, marginTop: 2 },
  sectionTitle: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
    color: Colors.dark,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.medium,
    color: Colors.darkGrey,
    marginBottom: 6,
    marginTop: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Fonts.sizes.md,
    color: Colors.dark,
    backgroundColor: Colors.background,
  },
  saveContainer: { padding: Spacing.lg },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: Colors.white, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
});
