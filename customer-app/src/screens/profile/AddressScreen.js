// GalliExpress Customer — Address Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';

export default function AddressScreen({ navigation }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const uid = auth().currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const unsub = firestore()
      .collection('addresses')
      .where('userId', '==', uid)
      .onSnapshot((snap) => {
        setAddresses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
    return unsub;
  }, [uid]);

  const saveAddress = async () => {
    if (!label.trim() || !address.trim()) {
      Alert.alert('తప్పు', 'లేబుల్ మరియు చిరునామా నమోదు చేయండి');
      return;
    }
    setSaving(true);
    try {
      await firestore().collection('addresses').add({
        userId: uid,
        label: label.trim(),
        address: address.trim(),
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      setLabel('');
      setAddress('');
      setAdding(false);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = (id) => {
    Alert.alert('తొలగించు', 'ఈ చిరునామాను తొలగించాలా?', [
      { text: 'రద్దు', style: 'cancel' },
      {
        text: 'తొలగించు',
        style: 'destructive',
        onPress: () => firestore().collection('addresses').doc(id).delete(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>చిరునామాలు</Text>
        <TouchableOpacity onPress={() => setAdding(!adding)} style={styles.addBtn}>
          <Ionicons name={adding ? 'close' : 'add'} size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Add Address Form */}
      {adding && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="లేబుల్ (ఉదా: ఇల్లు, కార్యాలయం)"
            placeholderTextColor={Colors.lightGrey}
            value={label}
            onChangeText={setLabel}
          />
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="పూర్తి చిరునామా..."
            placeholderTextColor={Colors.lightGrey}
            value={address}
            onChangeText={setAddress}
            multiline
          />
          <TouchableOpacity style={styles.saveBtn} onPress={saveAddress} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>చిరునామా సేవ్ చేయి</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="location-outline" size={60} color={Colors.lightGrey} />
          <Text style={styles.emptyText}>చిరునామాలు లేవు</Text>
          <Text style={styles.emptySub}>పైన + నొక్కి చిరునామా జోడించండి</Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.addressCard}>
              <View style={styles.addressIcon}>
                <Ionicons
                  name={item.label?.toLowerCase() === 'ఇల్లు' ? 'home' : 'business'}
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.addressInfo}>
                <Text style={styles.addressLabel}>{item.label}</Text>
                <Text style={styles.addressText}>{item.address}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteAddress(item.id)}>
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
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
  addBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.dark },
  form: {
    backgroundColor: Colors.white,
    margin: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Fonts.sizes.md,
    color: Colors.dark,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: Colors.white, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
  list: { padding: Spacing.lg, gap: Spacing.md },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
    marginBottom: Spacing.md,
  },
  addressIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold, color: Colors.dark },
  addressText: { fontSize: Fonts.sizes.sm, color: Colors.grey, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.semibold, color: Colors.dark, marginTop: 12 },
  emptySub: { fontSize: Fonts.sizes.sm, color: Colors.grey },
});
