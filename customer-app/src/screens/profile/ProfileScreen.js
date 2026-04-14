// GalliExpress Customer — Profile Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';

const MENU_ITEMS = [
  { icon: 'location-outline', label: 'నా చిరునామాలు', screen: 'Address' },
  { icon: 'receipt-outline', label: 'నా ఆర్డర్లు', screen: 'OrderHistory' },
  { icon: 'chatbubble-ellipses-outline', label: 'WhatsApp సహాయం', action: 'whatsapp' },
  { icon: 'star-outline', label: 'యాప్‌కి రేటింగ్ ఇవ్వండి', action: 'rate' },
  { icon: 'share-social-outline', label: 'స్నేహితులకు చెప్పండి', action: 'share' },
  { icon: 'information-circle-outline', label: 'మా గురించి', action: 'about' },
];

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const user = auth().currentUser;

  useEffect(() => {
    if (user) {
      firestore().collection('users').doc(user.uid).get().then((snap) => {
        if (snap.exists) setProfile(snap.data());
      });
    }
  }, []);

  const handleLogout = () => {
    Alert.alert('లాగ్అవుట్', 'మీరు లాగ్అవుట్ చేయాలనుకుంటున్నారా?', [
      { text: 'రద్దు', style: 'cancel' },
      { text: 'లాగ్అవుట్', style: 'destructive', onPress: () => auth().signOut() },
    ]);
  };

  const handleAction = (action) => {
    if (action === 'whatsapp') {
      Alert.alert('WhatsApp సహాయం', 'జల్లి ఎక్స్‌ప్రెస్ సహాయం కోసం +91 XXXXXXXXXX కి మెసేజ్ చేయండి');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ప్రొఫైల్</Text>
      </View>

      <ScrollView>
        {/* Profile Card */}
        <View style={[styles.profileCard, Shadows.md]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.name || user?.phoneNumber || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.name || 'మీ పేరు లేదు'}</Text>
            <Text style={styles.profilePhone}>{user?.phoneNumber}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="pencil-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatBox emoji="📦" value="0" label="ఆర్డర్లు" />
          <StatBox emoji="💰" value="₹0" label="ఆదా చేశారు" />
          <StatBox emoji="⭐" value="5.0" label="రేటింగ్" />
        </View>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, index < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
              onPress={() => item.screen
                ? navigation.navigate(item.screen)
                : handleAction(item.action)
              }
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.lightGrey} />
            </TouchableOpacity>
          ))}
        </View>

        {/* GalliPass Banner */}
        <View style={styles.passBanner}>
          <Text style={styles.passEmoji}>🎫</Text>
          <View style={styles.passInfo}>
            <Text style={styles.passTitle}>గల్లి పాస్ తీసుకోండి</Text>
            <Text style={styles.passSub}>నెలకు ₹99 — అన్ని ఆర్డర్లకు ఉచిత డెలివరీ!</Text>
          </View>
          <TouchableOpacity style={styles.passBtn}>
            <Text style={styles.passBtnText}>తీసుకో</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>లాగ్అవుట్</Text>
        </TouchableOpacity>

        <Text style={styles.version}>GalliExpress v1.0.0 • అడ్డంకి, ప్రకాశం</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ emoji, value, label }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.dark },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    margin: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: Fonts.sizes.xxl, fontWeight: Fonts.weights.bold, color: Colors.white },
  profileInfo: { flex: 1 },
  profileName: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.dark },
  profilePhone: { fontSize: Fonts.sizes.sm, color: Colors.grey, marginTop: 2 },
  editBtn: { padding: 8 },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  statBox: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', ...Shadows.sm,
  },
  statEmoji: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, color: Colors.dark },
  statLabel: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 2 },
  menuCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 16, gap: Spacing.md,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: Fonts.sizes.md, color: Colors.dark },
  passBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.secondary + '20',
    marginHorizontal: Spacing.lg, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.secondary,
    gap: Spacing.md,
  },
  passEmoji: { fontSize: 28 },
  passInfo: { flex: 1 },
  passTitle: { fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.bold, color: Colors.dark },
  passSub: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 2 },
  passBtn: { backgroundColor: Colors.secondary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.md },
  passBtnText: { fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.bold, color: Colors.dark },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    paddingVertical: Spacing.md, borderRadius: Radius.lg,
    backgroundColor: Colors.error + '10', borderWidth: 1, borderColor: Colors.error + '30',
  },
  logoutText: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold, color: Colors.error },
  version: { textAlign: 'center', fontSize: Fonts.sizes.xs, color: Colors.lightGrey, marginBottom: 32 },
});
