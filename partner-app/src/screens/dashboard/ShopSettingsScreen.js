// GalliExpress Partner — Shop Settings Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { useShop } from '../../context/ShopContext';

export default function ShopSettingsScreen({ navigation }) {
  const { shopId: contextShopId, setShop: setContextShop } = useShop();
  const [shop, setShop] = useState(null);
  const [shopId, setShopId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const uid = auth().currentUser?.uid;

  useEffect(() => {
    const sid = contextShopId;
    if (!sid && !uid) return;
    const query = sid
      ? firestore().collection('shops').doc(sid).get().then(d => ({ docs: d.exists ? [d] : [], empty: !d.exists }))
      : firestore().collection('shops').where('partnerId', '==', uid).limit(1).get();

    query
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
        }
        setLoading(false);
      });
  }, [uid]);

  const saveSettings = async () => {
    if (!shopId) return;
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a shop name');
      return;
    }
    setSaving(true);
    try {
      await firestore().collection('shops').doc(shopId).update({
        name: name.trim(),
        description: description.trim(),
        minOrder: parseInt(minOrder) || 0,
        deliveryTime: deliveryTime.trim(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      setContextShop(prev => ({ ...prev, name: name.trim(), description: description.trim(), minOrder: parseInt(minOrder) || 0, deliveryTime: deliveryTime.trim() }));
      Alert.alert('Success', 'Shop settings updated successfully');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
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
        <Text style={styles.title}>Shop Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Shop Details Form */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Shop Details</Text>

          <Text style={styles.label}>Shop Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your shop name"
            placeholderTextColor={Colors.lightGrey}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description of your shop..."
            placeholderTextColor={Colors.lightGrey}
            multiline
          />

          <Text style={styles.label}>Minimum Order (₹)</Text>
          <TextInput
            style={styles.input}
            value={minOrder}
            onChangeText={setMinOrder}
            placeholder="50"
            placeholderTextColor={Colors.lightGrey}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Delivery Time</Text>
          <TextInput
            style={styles.input}
            value={deliveryTime}
            onChangeText={setDeliveryTime}
            placeholder="25-30 minutes"
            placeholderTextColor={Colors.lightGrey}
          />
        </View>

        {/* Save Button */}
        <View style={styles.saveContainer}>
          <TouchableOpacity style={styles.saveBtn} onPress={saveSettings} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Save Settings</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() =>
              Alert.alert('Logout', 'Are you sure you want to logout?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: () => auth().signOut() },
              ])
            }
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
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
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: Spacing.md, borderWidth: 1.5, borderColor: Colors.error,
    borderRadius: Radius.md, height: 52,
  },
  logoutText: { color: Colors.error, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
});
