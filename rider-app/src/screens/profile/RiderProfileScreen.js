// GalliExpress Rider — Profile Screen
// Save as: rider-app/src/screens/profile/RiderProfileScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';

export default function RiderProfileScreen() {
  const [profile, setProfile] = useState(null);
  const user = auth().currentUser;

  useEffect(() => {
    if (user) {
      firestore().collection('riders').doc(user.uid).get().then((snap) => {
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ప్రొఫైల్</Text>
      </View>

      <ScrollView>
        {/* Profile Card */}
        <View style={[styles.profileCard, Shadows.md]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🛵</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile?.name || 'రైడర్'}</Text>
            <Text style={styles.phone}>{user?.phoneNumber}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={Colors.secondary} />
              <Text style={styles.rating}>{profile?.rating || '5.0'} రేటింగ్</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox emoji="🛵" value={profile?.totalDeliveries || 0} label="మొత్తం డెలివరీలు" />
          <StatBox emoji="💰" value={`₹${(profile?.totalEarnings || 0)}`} label="మొత్తం సంపాదన" />
          <StatBox emoji="⭐" value={profile?.rating || '5.0'} label="రేటింగ్" />
        </View>

        {/* Vehicle Info */}
        <View style={[styles.infoCard, Shadows.sm]}>
          <Text style={styles.infoTitle}>🏍️ వాహన వివరాలు</Text>
          <InfoRow label="వాహన రకం" value={profile?.vehicleType || 'బైక్'} />
          <InfoRow label="నంబర్ ప్లేట్" value={profile?.vehicleNumber || 'నమోదు కాలేదు'} />
          <InfoRow label="లైసెన్స్" value={profile?.licenseNumber || 'నమోదు కాలేదు'} />
        </View>

        {/* Settings */}
        <View style={[styles.menuCard, Shadows.sm]}>
          {[
            { icon: 'notifications-outline', label: 'నోటిఫికేషన్లు' },
            { icon: 'help-circle-outline', label: 'సహాయం & మద్దతు' },
            { icon: 'document-text-outline', label: 'నిబంధనలు & షరతులు' },
            { icon: 'shield-checkmark-outline', label: 'గోప్యతా విధానం' },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, i < arr.length - 1 && styles.menuBorder]}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.lightGrey} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>లాగ్అవుట్</Text>
        </TouchableOpacity>

        <Text style={styles.version}>GalliExpress Rider v1.0.0 • అడ్డంకి, ప్రకాశం</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ emoji, value, label }) {
  return (
    <View style={[styles.statBox, Shadows.sm]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.dark },
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, margin: Spacing.lg,
    borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.md,
  },
  avatar: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary + '40',
  },
  avatarText: { fontSize: 36 },
  profileInfo: { flex: 1 },
  name: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.dark },
  phone: { fontSize: Fonts.sizes.sm, color: Colors.grey, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  rating: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.dark },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg,
    gap: Spacing.sm, marginBottom: Spacing.lg,
  },
  statBox: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', gap: 4,
  },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.dark },
  statLabel: { fontSize: 9, color: Colors.grey, textAlign: 'center' },
  infoCard: {
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md,
  },
  infoTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.dark, marginBottom: Spacing.md },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  infoLabel: { fontSize: Fonts.sizes.sm, color: Colors.grey },
  infoValue: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.dark },
  menuCard: {
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl, marginBottom: Spacing.lg, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 16, gap: Spacing.md,
  },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: Fonts.sizes.md, color: Colors.dark },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    paddingVertical: Spacing.md, borderRadius: Radius.lg,
    backgroundColor: Colors.error + '10', borderWidth: 1, borderColor: Colors.error + '30',
  },
  logoutText: { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.error },
  version: { textAlign: 'center', fontSize: 11, color: Colors.lightGrey, marginBottom: 32 },
});
