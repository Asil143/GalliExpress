// GalliExpress Customer — Address Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import {
  STATE_NAME, DISTRICTS,
  MANDALS_BY_DISTRICT, fetchVillagesForMandal,
} from '../../addressData';

const GOOGLE_MAPS_KEY = 'AIzaSyAheicA9XT1Ndqyl34xhPBnOPv0lGWM0P0';
const ADDANKI_CENTER  = { latitude: 15.8068, longitude: 79.9746 };
const MAX_DELIVERY_KM = 10;

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Reusable picker modal ────────────────────────────────────────────────────
function PickerModal({ visible, title, items, selected, onSelect, onClose, labelKey = null, loading = false }) {
  const [search, setSearch] = useState('');
  const filtered = items.filter(item => {
    const label = labelKey ? item[labelKey] : item;
    return label.toLowerCase().includes(search.toLowerCase());
  });
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={pm.overlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        <View style={pm.sheet}>
          <View style={pm.handle} />
          <Text style={pm.title}>{title}</Text>
          {!loading && (
            <View style={pm.searchBox}>
              <Ionicons name="search-outline" size={16} color={Colors.grey} />
              <TextInput
                style={pm.searchInput}
                placeholder={`Search ${title.toLowerCase()}...`}
                placeholderTextColor={Colors.lightGrey}
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color={Colors.lightGrey} />
                </TouchableOpacity>
              )}
            </View>
          )}
          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={{ fontSize: Fonts.sizes.sm, color: Colors.grey }}>Loading villages...</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item, i) => String(i)}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 340 }}
              renderItem={({ item }) => {
                const label = labelKey ? item[labelKey] : item;
                const isSelected = (labelKey ? selected?.[labelKey] : selected) === label;
                return (
                  <TouchableOpacity
                    style={[pm.row, isSelected && pm.rowActive]}
                    onPress={() => { onSelect(item); setSearch(''); onClose(); }}
                  >
                    <Text style={[pm.rowText, isSelected && pm.rowTextActive]}>{label}</Text>
                    {isSelected && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={pm.empty}>
                  {items.length === 0 ? 'No villages found for this mandal' : `No results for "${search}"`}
                </Text>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:    { backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, paddingHorizontal: Spacing.lg },
  handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginVertical: 12 },
  title:    { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.dark, marginBottom: 12 },
  searchBox:{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, marginBottom: 8, height: 42 },
  searchInput: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.dark },
  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.border + '80' },
  rowActive:{ backgroundColor: Colors.primary + '08' },
  rowText:  { fontSize: Fonts.sizes.sm, color: Colors.dark },
  rowTextActive: { color: Colors.primary, fontWeight: Fonts.weights.semibold },
  empty:    { textAlign: 'center', color: Colors.grey, paddingVertical: 24, fontSize: Fonts.sizes.sm },
});

// ── Cascade picker field ─────────────────────────────────────────────────────
function PickerField({ label, value, placeholder, onPress, disabled }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.pickerBtn, disabled && styles.pickerBtnDisabled]}
        onPress={disabled ? undefined : onPress}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text style={[styles.pickerText, !value && styles.pickerPlaceholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={disabled ? Colors.lightGrey : Colors.grey} />
      </TouchableOpacity>
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function AddressScreen({ navigation }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [adding, setAdding]       = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving]       = useState(false);

  // Form
  const [label, setLabel]         = useState('');
  const [district, setDistrict]   = useState('');
  const [mandal, setMandal]       = useState('');
  const [village, setVillage]     = useState('');
  const [pincode, setPincode]     = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [coords, setCoords]       = useState(null);
  const [pinningGps, setPinningGps] = useState(false);

  // Pickers
  const [picker, setPicker] = useState(null); // 'district' | 'mandal' | 'village'

  const uid = auth().currentUser?.uid;

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    const unsub = firestore()
      .collection('addresses')
      .where('userId', '==', uid)
      .onSnapshot(
        snap => { setAddresses(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
        () => setLoading(false)
      );
    return unsub;
  }, [uid]);

  const [villages, setVillages]             = useState([]);
  const [villagesLoading, setVillagesLoading] = useState(false);

  const mandals = MANDALS_BY_DISTRICT[district] || [];

  const loadVillages = async (mandalName) => {
    setVillagesLoading(true);
    setVillages([]);
    const result = await fetchVillagesForMandal(mandalName);
    setVillages(result);
    setVillagesLoading(false);
  };

  const openAdd = () => {
    setEditingId(null); setLabel(''); setDistrict(''); setMandal('');
    setVillage(''); setPincode(''); setAddressLine(''); setCoords(null);
    setAdding(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setLabel(item.label || '');
    setDistrict(item.district || '');
    setMandal(item.mandal || '');
    setVillage(item.village || '');
    setPincode(item.pincode || '');
    setAddressLine(item.addressLine || item.address || '');
    setCoords(item.latitude && item.longitude ? { latitude: item.latitude, longitude: item.longitude } : null);
    setAdding(true);
  };

  const closeForm = () => {
    setAdding(false); setEditingId(null); setLabel(''); setDistrict('');
    setMandal(''); setVillage(''); setPincode(''); setAddressLine(''); setCoords(null);
  };

  const pinLocation = async () => {
    setPinningGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to pin your exact location.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch {
      Alert.alert('Error', 'Could not get location. Try again.');
    } finally {
      setPinningGps(false);
    }
  };

  const composeAddress = () => {
    const parts = [addressLine.trim(), village, mandal, district, STATE_NAME].filter(Boolean);
    return parts.join(', ') + (pincode ? ' - ' + pincode : '');
  };

  const saveAddress = async () => {
    if (!label.trim()) { Alert.alert('Required', 'Please enter a label like Home or Office'); return; }
    if (!district)     { Alert.alert('Required', 'Please select a district'); return; }
    if (!mandal)       { Alert.alert('Required', 'Please select a mandal'); return; }
    if (!village)      { Alert.alert('Required', 'Please select a village'); return; }
    if (!addressLine.trim()) { Alert.alert('Required', 'Please enter your address line (door no., colony, etc.)'); return; }

    if (coords) {
      const dist = haversine(ADDANKI_CENTER.latitude, ADDANKI_CENTER.longitude, coords.latitude, coords.longitude);
      if (dist > MAX_DELIVERY_KM) {
        Alert.alert(
          'Outside Delivery Area',
          `This location is ${dist.toFixed(1)} km from Addanki. We currently deliver within ${MAX_DELIVERY_KM} km only.`
        );
        return;
      }
    }

    setSaving(true);
    try {
      const composed = composeAddress();
      const data = {
        label:       label.trim(),
        state:       STATE_NAME,
        district,
        mandal,
        village,
        pincode,
        addressLine: addressLine.trim(),
        address:     composed,
        updatedAt:   firestore.FieldValue.serverTimestamp(),
        ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
      };
      if (editingId) {
        await firestore().collection('addresses').doc(editingId).update(data);
      } else {
        await firestore().collection('addresses').add({
          userId: uid,
          createdAt: firestore.FieldValue.serverTimestamp(),
          ...data,
        });
      }
      closeForm();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = (id) => {
    Alert.alert('Delete Address', 'Remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => firestore().collection('addresses').doc(id).delete() },
    ]);
  };

  const distKm = coords
    ? haversine(ADDANKI_CENTER.latitude, ADDANKI_CENTER.longitude, coords.latitude, coords.longitude)
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => adding ? closeForm() : navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name={adding ? 'close' : 'arrow-back'} size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>{adding ? (editingId ? 'Edit Address' : 'New Address') : 'My Addresses'}</Text>
        {!adding ? (
          <TouchableOpacity onPress={openAdd} style={styles.headerBtn}>
            <Ionicons name="add" size={24} color={Colors.primary} />
          </TouchableOpacity>
        ) : <View style={{ width: 40 }} />}
      </View>

      {adding ? (
        /* ── Add / Edit Form ────────────────────────────────────── */
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.formScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* Label */}
            <Text style={styles.fieldLabel}>Address Label</Text>
            <View style={styles.chipRow}>
              {['Home', 'Office', 'Other'].map(l => (
                <TouchableOpacity
                  key={l}
                  style={[styles.chip, label === l && styles.chipActive]}
                  onPress={() => setLabel(l)}
                >
                  <Text style={[styles.chipText, label === l && styles.chipTextActive]}>
                    {l === 'Home' ? '🏠' : l === 'Office' ? '🏢' : '📍'} {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Or type a custom label..."
              placeholderTextColor={Colors.lightGrey}
              value={['Home', 'Office', 'Other'].includes(label) ? '' : label}
              onChangeText={setLabel}
            />

            {/* State — fixed */}
            <Text style={[styles.fieldLabel, { marginTop: 8 }]}>State</Text>
            <View style={[styles.pickerBtn, styles.pickerBtnDisabled, { marginBottom: 12 }]}>
              <Text style={styles.pickerText}>{STATE_NAME}</Text>
              <Ionicons name="lock-closed-outline" size={14} color={Colors.lightGrey} />
            </View>

            {/* District */}
            <PickerField
              label="District"
              value={district}
              placeholder="Select district"
              onPress={() => setPicker('district')}
            />

            {/* Mandal */}
            <PickerField
              label="Mandal / Tehsil"
              value={mandal}
              placeholder={district ? 'Select mandal' : 'Select district first'}
              onPress={() => setPicker('mandal')}
              disabled={!district}
            />

            {/* Village */}
            <PickerField
              label="Village / Town"
              value={village}
              placeholder={mandal ? 'Select village' : 'Select mandal first'}
              onPress={() => setPicker('village')}
              disabled={!mandal}
            />

            {/* Pincode — auto-filled */}
            <Text style={styles.fieldLabel}>Pincode</Text>
            <TextInput
              style={[styles.input, pincode && { borderColor: Colors.success }]}
              placeholder="Auto-filled on village selection"
              placeholderTextColor={Colors.lightGrey}
              value={pincode}
              keyboardType="numeric"
              maxLength={6}
              onChangeText={setPincode}
            />

            {/* Address Line */}
            <Text style={styles.fieldLabel}>Address Line</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Door no., street, colony, near landmark..."
              placeholderTextColor={Colors.lightGrey}
              value={addressLine}
              onChangeText={setAddressLine}
              multiline
              numberOfLines={2}
            />

            {/* Pin Location */}
            <Text style={styles.fieldLabel}>Pin Exact Location (optional)</Text>
            <TouchableOpacity
              style={[styles.pinBtn, coords && styles.pinBtnActive]}
              onPress={pinLocation}
              disabled={pinningGps}
            >
              {pinningGps
                ? <ActivityIndicator size="small" color={coords ? Colors.white : Colors.primary} />
                : <Ionicons name={coords ? 'location' : 'locate-outline'} size={17} color={coords ? Colors.white : Colors.primary} />
              }
              <Text style={[styles.pinBtnText, coords && { color: Colors.white }]}>
                {coords ? 'Location Pinned ✓  —  Tap to Re-pin' : 'Pin My Exact Location on Map'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.pinHint}>
              Pinning helps us find your door precisely and verify you're in our delivery area.
            </Text>

            {/* Map preview */}
            {coords && (
              <View style={styles.mapCard}>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.mapPreview}
                  region={{ ...coords, latitudeDelta: 0.004, longitudeDelta: 0.004 }}
                  scrollEnabled={false} zoomEnabled={false} pitchEnabled={false} rotateEnabled={false}
                >
                  <Marker coordinate={coords}>
                    <Text style={{ fontSize: 22 }}>📍</Text>
                  </Marker>
                </MapView>
                <TouchableOpacity style={styles.clearPin} onPress={() => setCoords(null)}>
                  <Ionicons name="close-circle" size={22} color={Colors.grey} />
                </TouchableOpacity>
              </View>
            )}

            {/* Distance banner */}
            {distKm !== null && (
              <View style={[styles.distBanner, distKm > MAX_DELIVERY_KM ? styles.distError : styles.distOk]}>
                <Ionicons
                  name={distKm > MAX_DELIVERY_KM ? 'close-circle-outline' : 'checkmark-circle-outline'}
                  size={15}
                  color={distKm > MAX_DELIVERY_KM ? '#DC2626' : '#16A34A'}
                />
                <Text style={[styles.distText, { color: distKm > MAX_DELIVERY_KM ? '#DC2626' : '#16A34A' }]}>
                  {distKm > MAX_DELIVERY_KM
                    ? `${distKm.toFixed(1)} km from Addanki — outside our ${MAX_DELIVERY_KM} km delivery zone`
                    : `${distKm.toFixed(1)} km from Addanki — within delivery area ✓`}
                </Text>
              </View>
            )}

            {/* Save */}
            <TouchableOpacity
              style={[styles.saveBtn, (saving || (distKm !== null && distKm > MAX_DELIVERY_KM)) && { opacity: 0.55 }]}
              onPress={saveAddress}
              disabled={saving || (distKm !== null && distKm > MAX_DELIVERY_KM)}
            >
              {saving
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.saveBtnText}>{editingId ? 'Update Address' : 'Save Address'}</Text>
              }
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>

      ) : loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>

      ) : addresses.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="location-outline" size={60} color={Colors.lightGrey} />
          <Text style={styles.emptyText}>No Addresses Saved</Text>
          <Text style={styles.emptySub}>Tap + above to add your delivery address</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={openAdd}>
            <Text style={styles.emptyBtnText}>+ Add Address</Text>
          </TouchableOpacity>
        </View>

      ) : (
        <FlatList
          data={addresses}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const icon = item.label?.toLowerCase() === 'home' ? 'home' :
                         item.label?.toLowerCase() === 'office' ? 'business' : 'location';
            return (
              <View style={styles.addrCard}>
                <View style={styles.addrIcon}>
                  <Ionicons name={icon} size={20} color={Colors.primary} />
                </View>
                <View style={styles.addrInfo}>
                  <View style={styles.addrLabelRow}>
                    <Text style={styles.addrLabel}>{item.label || 'Address'}</Text>
                    {item.latitude && (
                      <View style={styles.pinnedBadge}>
                        <Ionicons name="location" size={9} color={Colors.success} />
                        <Text style={styles.pinnedText}>pinned</Text>
                      </View>
                    )}
                  </View>
                  {item.addressLine
                    ? <Text style={styles.addrLine1} numberOfLines={1}>{item.addressLine}</Text>
                    : null}
                  <Text style={styles.addrLine2} numberOfLines={1}>
                    {[item.village, item.mandal, item.district].filter(Boolean).join(', ')}
                    {item.pincode ? ' - ' + item.pincode : ''}
                  </Text>
                </View>
                <View style={{ gap: 14 }}>
                  <TouchableOpacity onPress={() => openEdit(item)}>
                    <Ionicons name="pencil-outline" size={19} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteAddress(item.id)}>
                    <Ionicons name="trash-outline" size={19} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ── Picker Modals ─────────────────────────────────────────── */}
      <PickerModal
        visible={picker === 'district'}
        title="Select District"
        items={DISTRICTS}
        selected={district}
        onSelect={d => { setDistrict(d); setMandal(''); setVillage(''); setPincode(''); setVillages([]); }}
        onClose={() => setPicker(null)}
      />
      <PickerModal
        visible={picker === 'mandal'}
        title="Select Mandal"
        items={mandals}
        selected={mandal}
        onSelect={m => { setMandal(m); setVillage(''); setPincode(''); loadVillages(m); }}
        onClose={() => setPicker(null)}
      />
      <PickerModal
        visible={picker === 'village'}
        title="Select Village / Town"
        items={villages}
        selected={village ? villages.find(v => v.name === village) : null}
        onSelect={v => { setVillage(v.name); setPincode(v.pincode); }}
        onClose={() => setPicker(null)}
        labelKey="name"
        loading={villagesLoading}
      />
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.dark },

  formScroll: { padding: Spacing.lg, paddingBottom: 60 },
  fieldLabel: {
    fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.bold, color: Colors.grey,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7,
  },

  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  chipText:       { fontSize: Fonts.sizes.sm, color: Colors.grey, fontWeight: Fonts.weights.medium },
  chipTextActive: { color: Colors.primary, fontWeight: Fonts.weights.bold },

  pickerBtn: {
    height: 46, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, backgroundColor: Colors.white,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  pickerBtnDisabled: { backgroundColor: Colors.background, borderColor: Colors.border },
  pickerText:       { fontSize: Fonts.sizes.sm, color: Colors.dark, flex: 1 },
  pickerPlaceholder:{ color: Colors.lightGrey },

  input: {
    height: 46, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, fontSize: Fonts.sizes.sm, color: Colors.dark,
    backgroundColor: Colors.white, marginBottom: 12,
  },
  multilineInput: { height: 70, textAlignVertical: 'top', paddingTop: 12 },

  pinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 13, marginBottom: 5,
  },
  pinBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pinBtnText:   { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: Fonts.weights.semibold, flex: 1 },
  pinHint:      { fontSize: 11, color: Colors.grey, marginBottom: 14 },

  mapCard:    { borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, marginBottom: 14 },
  mapPreview: { height: 140 },
  clearPin:   { position: 'absolute', top: 8, right: 8, backgroundColor: Colors.white, borderRadius: 12 },

  distBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: 16 },
  distOk:     { backgroundColor: '#F0FDF4' },
  distError:  { backgroundColor: '#FEF2F2' },
  distText:   { fontSize: 12, fontWeight: Fonts.weights.medium, flex: 1 },

  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  saveBtnText: { color: Colors.white, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },

  // List
  list: { padding: Spacing.lg, gap: Spacing.md },
  addrCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.md, ...Shadows.sm,
  },
  addrIcon:     { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center' },
  addrInfo:     { flex: 1 },
  addrLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  addrLabel:    { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.dark },
  addrLine1:    { fontSize: Fonts.sizes.sm, color: Colors.dark },
  addrLine2:    { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 2 },
  pinnedBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.success + '15', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  pinnedText:   { fontSize: 10, color: Colors.success, fontWeight: Fonts.weights.bold },

  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText:    { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.dark },
  emptySub:     { fontSize: Fonts.sizes.sm, color: Colors.grey },
  emptyBtn:     { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.full, marginTop: 8 },
  emptyBtnText: { color: Colors.white, fontWeight: Fonts.weights.bold },
});
