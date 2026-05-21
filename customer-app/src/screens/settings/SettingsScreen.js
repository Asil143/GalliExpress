// GalliExpress Customer — Settings Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';

export default function SettingsScreen({ navigation }) {
  const user = auth().currentUser;
  const [darkMode, setDarkMode] = useState(false);
  const [orderNotifs, setOrderNotifs] = useState(true);
  const [promoNotifs, setPromoNotifs] = useState(true);
  const [soundNotifs, setSoundNotifs] = useState(true);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const dm = await AsyncStorage.getItem('@galliexpress_darkmode');
      const on = await AsyncStorage.getItem('@galliexpress_order_notifs');
      const pn = await AsyncStorage.getItem('@galliexpress_promo_notifs');
      const sn = await AsyncStorage.getItem('@galliexpress_sound_notifs');
      if (dm) setDarkMode(dm === 'true');
      if (on !== null) setOrderNotifs(on !== 'false');
      if (pn !== null) setPromoNotifs(pn !== 'false');
      if (sn !== null) setSoundNotifs(sn !== 'false');
    } catch {}
  };

  const savePref = async (key, val) => {
    await AsyncStorage.setItem(key, String(val));
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, order history, and GalliCoins. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => Alert.alert('Request Sent', 'Your account deletion request has been submitted. We will process it within 7 days.'),
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => auth().signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Account */}
        <SectionHeader label="Account" />
        <View style={styles.group}>
          <SettingRow
            icon="person-outline" label="Edit Profile"
            onPress={() => navigation.navigate('Profile')}
          />
          <SettingRow
            icon="location-outline" label="Manage Addresses"
            onPress={() => navigation.navigate('Address')}
          />
          <SettingRow
            icon="card-outline" label="Payment Methods"
            onPress={() => Alert.alert('Coming Soon', 'Save UPI IDs and cards for faster checkout.')}
          />
          <SettingRow
            icon="star-outline" label="GalliCoins & Rewards"
            onPress={() => navigation.navigate('Profile')}
          />
          <SettingRow
            icon="gift-outline" label="Refer & Earn"
            onPress={() => navigation.navigate('Profile')}
            last
          />
        </View>

        {/* Notifications */}
        <SectionHeader label="Notifications" />
        <View style={styles.group}>
          <SwitchRow
            icon="notifications-outline"
            label="Order Updates"
            sub="Confirm, dispatch, delivery alerts"
            value={orderNotifs}
            onChange={v => { setOrderNotifs(v); savePref('@galliexpress_order_notifs', v); }}
          />
          <SwitchRow
            icon="pricetag-outline"
            label="Offers & Promotions"
            sub="Flash sales, coupons, GalliCoins"
            value={promoNotifs}
            onChange={v => { setPromoNotifs(v); savePref('@galliexpress_promo_notifs', v); }}
          />
          <SwitchRow
            icon="volume-high-outline"
            label="Notification Sound"
            sub="Play sound for alerts"
            value={soundNotifs}
            onChange={v => { setSoundNotifs(v); savePref('@galliexpress_sound_notifs', v); }}
            last
          />
        </View>

        {/* Appearance */}
        <SectionHeader label="Appearance" />
        <View style={styles.group}>
          <SwitchRow
            icon="moon-outline"
            label="Dark Mode"
            sub="Easier on the eyes at night"
            value={darkMode}
            onChange={v => {
              setDarkMode(v);
              savePref('@galliexpress_darkmode', v);
              Alert.alert('Dark Mode', v ? 'Enabled — restart app to apply' : 'Disabled');
            }}
            last
          />
        </View>

        {/* Privacy & Security */}
        <SectionHeader label="Privacy & Security" />
        <View style={styles.group}>
          <SettingRow
            icon="shield-checkmark-outline" label="Privacy Policy"
            onPress={() => Linking.openURL('https://galliexpress.in/privacy')}
          />
          <SettingRow
            icon="document-text-outline" label="Terms & Conditions"
            onPress={() => Linking.openURL('https://galliexpress.in/terms')}
          />
          <SettingRow
            icon="eye-off-outline" label="Data & Privacy"
            onPress={() => Alert.alert('Your Data', 'GalliExpress only collects data required to process your orders. We never sell your data.')}
            last
          />
        </View>

        {/* Help & Support */}
        <SectionHeader label="Help & Support" />
        <View style={styles.group}>
          <SettingRow
            icon="help-circle-outline" label="Help Center"
            onPress={() => navigation.navigate('Help')}
          />
          <SettingRow
            icon="logo-whatsapp" label="WhatsApp Support"
            onPress={() => Linking.openURL('https://wa.me/919727178763?text=Hi GalliExpress, I need help!')}
          />
          <SettingRow
            icon="chatbubble-outline" label="Chat with Us"
            onPress={() => Alert.alert('Coming Soon', 'In-app chat is coming soon!')}
          />
          <SettingRow
            icon="star-half-outline" label="Rate the App"
            onPress={() => Alert.alert('Thank You!', 'App rating coming soon on Play Store!')}
          />
          <SettingRow
            icon="information-circle-outline" label="About GalliExpress"
            onPress={() => Alert.alert('GalliExpress v1.0.0', 'Hyperlocal delivery for Addanki, Prakasam District, AP.\n\nBuilt with ❤️ for our town.')}
            last
          />
        </View>

        {/* Danger Zone */}
        <SectionHeader label="Account Actions" />
        <View style={styles.group}>
          <TouchableOpacity style={styles.dangerRow} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.dangerLabel}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dangerRow, { borderTopWidth: 1, borderTopColor: Colors.border }]} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
            <Text style={styles.dangerLabel}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>GalliExpress v1.0.0 · Addanki, Prakasam District, AP</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ label }) {
  return <Text style={styles.sectionHeader}>{label}</Text>;
}

function SettingRow({ icon, label, onPress, last }) {
  return (
    <TouchableOpacity
      style={[styles.row, !last && styles.rowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowIconBox}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.lightGrey} />
    </TouchableOpacity>
  );
}

function SwitchRow({ icon, label, sub, value, onChange, last }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowIconBox}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.border, true: Colors.primary + '60' }}
        thumbColor={value ? Colors.primary : Colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.dark },
  sectionHeader: {
    fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.bold,
    color: Colors.grey, textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: Spacing.lg, marginBottom: Spacing.xs,
    marginHorizontal: Spacing.lg,
  },
  group: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIconBox: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: Fonts.sizes.md, color: Colors.dark },
  rowSub: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 1 },
  dangerRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
  },
  dangerLabel: { fontSize: Fonts.sizes.md, color: Colors.error, fontWeight: Fonts.weights.medium },
  version: {
    textAlign: 'center', fontSize: Fonts.sizes.xs,
    color: Colors.lightGrey, marginTop: Spacing.xl,
  },
});
