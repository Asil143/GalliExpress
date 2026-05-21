// GalliExpress Rider — Profile Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  Modal, TextInput, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { formatPrice } from '../../../../shared/utils';

const VEHICLE_TYPES = ['Bike', 'Scooter', 'Cycle', 'Electric Bike'];

export default function RiderProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleType, setVehicleType] = useState('Bike');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleSaving, setVehicleSaving] = useState(false);

  const [showNameModal, setShowNameModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [nameSaving, setNameSaving] = useState(false);

  const user = auth().currentUser;

  useEffect(() => {
    if (user) {
      firestore().collection('riders').doc(user.uid).onSnapshot((snap) => {
        if (snap?.exists) {
          const data = snap.data();
          setProfile(data);
          setVehicleType(data.vehicleType || 'Bike');
          setVehicleNumber(data.vehicleNumber || '');
          setLicenseNumber(data.licenseNumber || '');
          setEditName(data.name || '');
        }
      });
    }
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => auth().signOut() },
    ]);
  };

  const saveVehicleDetails = async () => {
    if (!vehicleNumber.trim()) {
      Alert.alert('Required', 'Please enter your vehicle number plate');
      return;
    }
    setVehicleSaving(true);
    try {
      await firestore().collection('riders').doc(user.uid).update({
        vehicleType,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        licenseNumber: licenseNumber.trim().toUpperCase(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      setShowVehicleModal(false);
      Alert.alert('Saved', 'Vehicle details updated successfully');
    } catch (e) {
      Alert.alert('Error', 'Failed to save vehicle details');
    } finally {
      setVehicleSaving(false);
    }
  };

  const saveName = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    setNameSaving(true);
    try {
      await firestore().collection('riders').doc(user.uid).update({
        name: editName.trim(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      setShowNameModal(false);
    } catch {
      Alert.alert('Error', 'Failed to update name');
    } finally {
      setNameSaving(false);
    }
  };

  const isVehicleRegistered = profile?.vehicleNumber && profile.vehicleNumber !== 'Not registered';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={['#1C1C2E', '#3D3D5C']} style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity style={styles.editNameBtn} onPress={() => setShowNameModal(true)}>
          <Ionicons name="pencil-outline" size={18} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.avatar}>
              <Text style={styles.avatarText}>🛵</Text>
            </LinearGradient>
            <View style={[styles.statusDot, { backgroundColor: profile?.isOnline ? Colors.success : Colors.error }]} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile?.name || 'Rider'}</Text>
            <Text style={styles.phone}>{user?.phoneNumber}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.rating}>{(profile?.rating || 5.0).toFixed(1)} rating</Text>
              <View style={styles.separatorDot} />
              <Text style={styles.statusLabel}>
                {profile?.isOnline ? '🟢 Online' : '🔴 Offline'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox emoji="🛵" value={profile?.totalDeliveries || 0} label="Deliveries" color={Colors.primary} />
          <StatBox emoji="💰" value={formatPrice(profile?.totalEarnings || 0)} label="Total Earned" color={Colors.success} />
          <StatBox emoji="⭐" value={(profile?.rating || 5.0).toFixed(1)} label="Rating" color={Colors.secondary} />
        </View>

        {/* Vehicle Info */}
        <View style={[styles.infoCard, Shadows.sm]}>
          <View style={styles.infoCardHeader}>
            <Text style={styles.infoTitle}>🏍️ Vehicle Details</Text>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setShowVehicleModal(true)}
            >
              <Ionicons name="pencil-outline" size={14} color={Colors.primary} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {isVehicleRegistered ? (
            <>
              <InfoRow label="Vehicle Type" value={profile?.vehicleType || 'Bike'} />
              <InfoRow label="Number Plate" value={profile?.vehicleNumber || '—'} highlight />
              <InfoRow label="License No." value={profile?.licenseNumber || '—'} />
            </>
          ) : (
            <TouchableOpacity style={styles.addVehiclePrompt} onPress={() => setShowVehicleModal(true)}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.addVehicleText}>Add your vehicle details to start delivering</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Settings Menu */}
        <View style={[styles.menuCard, Shadows.sm]}>
          {[
            { icon: 'wallet-outline', label: 'Bank / UPI Details', sub: 'Add payment details', onPress: () => navigation.navigate('EarningsTab') },
            { icon: 'notifications-outline', label: 'Notifications', sub: 'Order alerts & updates', onPress: () => Alert.alert('Notifications', 'All order alerts are enabled. Go to your phone settings to manage app notifications.') },
            { icon: 'help-circle-outline', label: 'Help & Support', sub: '24/7 rider support', onPress: () => Linking.openURL('https://wa.me/919727178763?text=Hi%20GalliExpress%2C%20I%20need%20rider%20support') },
            { icon: 'document-text-outline', label: 'Terms & Conditions', sub: null, onPress: () => Linking.openURL('https://galliexpress.in/terms') },
            { icon: 'shield-checkmark-outline', label: 'Privacy Policy', sub: null, onPress: () => Linking.openURL('https://galliexpress.in/privacy') },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, i < arr.length - 1 && styles.menuBorder]}
              onPress={item.onPress}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                {item.sub && <Text style={styles.menuSub}>{item.sub}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.lightGrey} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>GalliExpress Rider v1.0.0 • Addanki, Prakasam</Text>
      </ScrollView>

      {/* Vehicle Edit Modal */}
      <Modal visible={showVehicleModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowVehicleModal(false)}
        >
          <TouchableOpacity style={styles.modalCard} activeOpacity={1}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>🏍️ Vehicle Details</Text>
            <Text style={styles.modalSub}>This info is used for verification</Text>

            <Text style={styles.fieldLabel}>Vehicle Type</Text>
            <View style={styles.vehicleTypeRow}>
              {VEHICLE_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, vehicleType === type && styles.typeChipActive]}
                  onPress={() => setVehicleType(type)}
                >
                  <Text style={[styles.typeChipText, vehicleType === type && styles.typeChipTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Number Plate *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. AP 39 AB 1234"
              placeholderTextColor={Colors.lightGrey}
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              autoCapitalize="characters"
            />

            <Text style={styles.fieldLabel}>Driving License Number</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. AP0620190012345"
              placeholderTextColor={Colors.lightGrey}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={[styles.modalSaveBtn, vehicleSaving && { opacity: 0.6 }]}
              onPress={saveVehicleDetails}
              disabled={vehicleSaving}
            >
              {vehicleSaving
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.modalSaveBtnText}>Save Vehicle Details</Text>
              }
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Name Edit Modal */}
      <Modal visible={showNameModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNameModal(false)}
        >
          <TouchableOpacity style={[styles.modalCard, { gap: Spacing.md }]} activeOpacity={1}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Your full name"
              placeholderTextColor={Colors.lightGrey}
              value={editName}
              onChangeText={setEditName}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.modalSaveBtn, nameSaving && { opacity: 0.6 }]}
              onPress={saveName}
              disabled={nameSaving}
            >
              {nameSaving
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.modalSaveBtnText}>Save Name</Text>
              }
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function StatBox({ emoji, value, label, color }) {
  return (
    <View style={[styles.statBox, Shadows.sm]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && { color: Colors.primary, fontWeight: '800' }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
  },
  headerTitle: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.white },
  editNameBtn: { padding: 6 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, margin: Spacing.lg,
    marginTop: -4, borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.md,
    ...Shadows.md,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 38 },
  statusDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: Colors.white,
  },
  profileInfo: { flex: 1 },
  name: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.dark },
  phone: { fontSize: Fonts.sizes.sm, color: Colors.grey, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  rating: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.dark },
  separatorDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.lightGrey },
  statusLabel: { fontSize: Fonts.sizes.xs, color: Colors.grey, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg,
    gap: Spacing.sm, marginBottom: Spacing.lg,
  },
  statBox: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.md, alignItems: 'center', gap: 4,
  },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: Fonts.sizes.lg, fontWeight: '800' },
  statLabel: { fontSize: 9, color: Colors.grey, textAlign: 'center' },
  infoCard: {
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md,
  },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  infoTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.dark },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary + '15', paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: Radius.full,
  },
  editBtnText: { fontSize: Fonts.sizes.xs, fontWeight: '700', color: Colors.primary },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  infoLabel: { fontSize: Fonts.sizes.sm, color: Colors.grey },
  infoValue: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.dark },
  addVehiclePrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.primary + '08', borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '25',
  },
  addVehicleText: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '600' },
  menuCard: {
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl, marginBottom: Spacing.lg, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 14, gap: Spacing.md,
  },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { fontSize: Fonts.sizes.md, color: Colors.dark, fontWeight: '600' },
  menuSub: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 1 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    paddingVertical: Spacing.md, borderRadius: Radius.lg,
    backgroundColor: Colors.error + '10', borderWidth: 1, borderColor: Colors.error + '30',
  },
  logoutText: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.error },
  version: { textAlign: 'center', fontSize: 11, color: Colors.lightGrey, marginBottom: 32 },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.white, borderTopLeftRadius: 28,
    borderTopRightRadius: 28, padding: Spacing.xl, gap: Spacing.sm,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.sm,
  },
  modalTitle: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.dark },
  modalSub: { fontSize: Fonts.sizes.sm, color: Colors.grey, marginBottom: Spacing.sm },
  fieldLabel: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.dark, marginTop: Spacing.sm },
  vehicleTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  typeChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  typeChipText: { fontSize: Fonts.sizes.sm, color: Colors.darkGrey, fontWeight: '600' },
  typeChipTextActive: { color: Colors.primary, fontWeight: '700' },
  modalInput: {
    backgroundColor: Colors.background, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 13,
    fontSize: Fonts.sizes.md, color: Colors.dark,
  },
  modalSaveBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: Spacing.sm,
  },
  modalSaveBtnText: { color: Colors.white, fontWeight: '800', fontSize: Fonts.sizes.md },
});
