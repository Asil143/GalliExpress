// GalliExpress — Location Picker Modal

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../shared/theme';

const GOOGLE_API_KEY = 'AIzaSyAheicA9XT1Ndqyl34xhPBnOPv0lGWM0P0';

const RECENT_DEFAULTS = [
  { id: '1', label: 'Home', address: 'Addanki, Prakasam District', icon: 'home' },
  { id: '2', label: 'Market', address: 'Addanki Main Road, Prakasam', icon: 'storefront' },
];

export default function LocationPickerModal({ visible, onClose, onSelect, currentLocation }) {
  const [detecting, setDetecting] = useState(false);
  const autocompleteRef = useRef(null);

  const detectCurrentLocation = async () => {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to auto-detect your location.');
        setDetecting(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;

      // Reverse geocode using Google
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
      );
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const components = result.address_components;
        const area = components.find(c => c.types.includes('sublocality') || c.types.includes('locality'));
        const city = components.find(c => c.types.includes('administrative_area_level_3') || c.types.includes('locality'));
        const label = area?.long_name || city?.long_name || 'Current Location';
        const address = result.formatted_address;
        onSelect({ label, address, latitude, longitude });
      }
    } catch (e) {
      Alert.alert('Error', 'Could not detect location. Please search manually.');
    } finally {
      setDetecting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.dark} />
          </TouchableOpacity>
          <Text style={styles.title}>Select Delivery Location</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Google Places Autocomplete */}
        <View style={styles.autocompleteWrapper}>
          <GooglePlacesAutocomplete
            ref={autocompleteRef}
            placeholder="Search area, street, landmark..."
            onPress={(data, details = null) => {
              const label = data.structured_formatting?.main_text || data.description;
              const address = data.description;
              const lat = details?.geometry?.location?.lat;
              const lng = details?.geometry?.location?.lng;
              onSelect({ label, address, latitude: lat, longitude: lng });
            }}
            query={{
              key: GOOGLE_API_KEY,
              language: 'en',
              components: 'country:in',
            }}
            fetchDetails
            styles={{
              container: { flex: 0 },
              textInput: styles.searchInput,
              listView: styles.listView,
              row: styles.suggestionRow,
              description: styles.suggestionText,
            }}
            renderLeftButton={() => (
              <View style={styles.searchIcon}>
                <Ionicons name="search" size={18} color={Colors.grey} />
              </View>
            )}
            enablePoweredByContainer={false}
          />
        </View>

        {/* Detect Current Location */}
        <TouchableOpacity style={styles.detectBtn} onPress={detectCurrentLocation} disabled={detecting}>
          {detecting ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="navigate" size={20} color={Colors.primary} />
          )}
          <View>
            <Text style={styles.detectTitle}>Use Current Location</Text>
            <Text style={styles.detectSub}>Auto-detect using GPS</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Recent / Saved Locations */}
        <Text style={styles.sectionTitle}>Saved Locations</Text>
        <FlatList
          data={RECENT_DEFAULTS}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.recentRow}
              onPress={() => onSelect({ label: item.label, address: item.address })}
            >
              <View style={styles.recentIcon}>
                <Ionicons name={item.icon} size={18} color={Colors.primary} />
              </View>
              <View style={styles.recentInfo}>
                <Text style={styles.recentLabel}>{item.label}</Text>
                <Text style={styles.recentAddress} numberOfLines={1}>{item.address}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.lightGrey} />
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.dark },
  autocompleteWrapper: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, zIndex: 10 },
  searchInput: {
    fontSize: Fonts.sizes.md, color: Colors.dark,
    backgroundColor: Colors.background, borderRadius: Radius.md,
    paddingLeft: 40, height: 48,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchIcon: { position: 'absolute', left: 12, top: 14, zIndex: 1 },
  listView: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    marginTop: 4, ...Shadows.md,
  },
  suggestionRow: { paddingVertical: 12, paddingHorizontal: Spacing.md },
  suggestionText: { fontSize: Fonts.sizes.sm, color: Colors.dark },
  detectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border, marginTop: Spacing.sm,
  },
  detectTitle: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold, color: Colors.primary },
  detectSub: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 2 },
  divider: { height: 8, backgroundColor: Colors.background },
  sectionTitle: {
    fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.bold,
    color: Colors.grey, paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  recentRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  recentIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  recentInfo: { flex: 1 },
  recentLabel: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold, color: Colors.dark },
  recentAddress: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 2 },
});
