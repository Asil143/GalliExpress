// GalliExpress Customer — Profile Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Switch, Share, Linking, Modal, TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';

const DIET_OPTIONS = [
  { id: 'all',    label: 'All',     emoji: '🍽️' },
  { id: 'veg',    label: 'Veg',     emoji: '🥦' },
  { id: 'nonveg', label: 'Non-Veg', emoji: '🍗' },
  { id: 'egg',    label: 'Egg OK',  emoji: '🥚' },
];

const WHATSAPP_NUMBER = '919727178763';

export default function ProfileScreen({ navigation }) {
  const user = auth().currentUser;
  const [profile, setProfile]         = useState(null);
  const [coins, setCoins]             = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSaved, setTotalSaved]   = useState(0);
  const [favCount, setFavCount]       = useState(0);
  const [dietFilter, setDietFilter]   = useState('all');
  const [vegMode, setVegMode]         = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [referCode, setReferCode]     = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [editName, setEditName]       = useState('');
  const [editEmail, setEditEmail]     = useState('');
  const [avatarUri, setAvatarUri]     = useState(null);
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    loadProfile();
    loadStats();
    loadPreferences();
  }, []);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const snap = await firestore().collection('users').doc(user.uid).get();
      if (snap?.exists) {
        const d = snap.data();
        setProfile(d);
        setCoins(d.galliCoins || 0);
        setReferCode(d.referCode || `GALLI${user.phoneNumber?.slice(-4) || '0000'}`);
        setEditName(d.name || '');
        setEditEmail(d.email || '');
        setAvatarUri(d.avatarUri || null);
      }
    } catch {}
  };

  const loadStats = async () => {
    if (!user) return;
    try {
      const [ordSnap, favSnap] = await Promise.all([
        firestore().collection('orders').where('customerId', '==', user.uid).get(),
        firestore().collection('favourites').where('userId', '==', user.uid).get(),
      ]);
      setTotalOrders(ordSnap.size);
      setFavCount(favSnap.size);
      setTotalSaved(ordSnap.docs.reduce((s, d) => s + (d.data().couponDiscount || 0), 0));
    } catch {}
  };

  const loadPreferences = async () => {
    try {
      const [diet, veg, notif] = await Promise.all([
        AsyncStorage.getItem('@galliexpress_diet'),
        AsyncStorage.getItem('@galliexpress_vegmode'),
        AsyncStorage.getItem('@galliexpress_notif'),
      ]);
      if (diet)  setDietFilter(diet);
      if (veg)   setVegMode(veg === 'true');
      if (notif) setNotifEnabled(notif !== 'false');
    } catch {}
  };

  const saveDiet = async (val) => {
    setDietFilter(val);
    AsyncStorage.setItem('@galliexpress_diet', val).catch(() => {});
  };

  const toggleVegMode = async (val) => {
    setVegMode(val);
    AsyncStorage.setItem('@galliexpress_vegmode', String(val)).catch(() => {});
  };

  const toggleNotif = async (val) => {
    setNotifEnabled(val);
    AsyncStorage.setItem('@galliexpress_notif', String(val)).catch(() => {});
  };

  const openEditModal = () => {
    setEditName(profile?.name || '');
    setEditEmail(profile?.email || '');
    setShowEditModal(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access to update your profile picture.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.6 });
    if (!result.canceled && result.assets[0]) setAvatarUri(result.assets[0].uri);
  };

  const saveProfile = async () => {
    if (!editName.trim()) { Alert.alert('Name required', 'Please enter your name.'); return; }
    setSaving(true);
    try {
      await firestore().collection('users').doc(user.uid).set(
        { name: editName.trim(), email: editEmail.trim(), avatarUri: avatarUri || null, updatedAt: firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
      setProfile(p => ({ ...p, name: editName.trim(), email: editEmail.trim(), avatarUri }));
      setShowEditModal(false);
    } catch { Alert.alert('Error', 'Could not save profile. Try again.'); }
    finally { setSaving(false); }
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) { Alert.alert('Please enter your feedback'); return; }
    try {
      await firestore().collection('feedback').add({
        userId: user.uid,
        phone: user.phoneNumber,
        text: feedbackText.trim(),
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      setFeedbackText('');
      setShowFeedbackModal(false);
      Alert.alert('Thank you! 🙏', 'Your feedback helps us improve GalliExpress.');
    } catch { Alert.alert('Error', 'Could not send feedback. Try again.'); }
  };

  const handleReferShare = async () => {
    try {
      await Share.share({ message: `Order food & groceries in Addanki with GalliExpress 🛵\nUse my code ${referCode} for ₹50 off your first order!\nDownload: galliexpress.in/app` });
    } catch {}
  };

  const handleShareApp = async () => {
    try {
      await Share.share({ message: 'Get food & groceries delivered in Addanki! Download GalliExpress 🛵\ngalliexpress.in/app' });
    } catch {}
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => auth().signOut() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all order history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Contact Support', 'Please WhatsApp us at +91 97271 78763 to delete your account.') },
      ]
    );
  };

  const handleWhatsApp = (msg = 'Hi GalliExpress Support! I need help.') => {
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`).catch(() =>
      Alert.alert('Contact Support', 'Email us: support@galliexpress.in')
    );
  };

  const handleReportIssue = () => {
    Alert.alert('Report an Issue', 'What kind of issue?', [
      { text: 'Wrong / Missing Item', onPress: () => handleWhatsApp('Hi! I received a wrong or missing item in my order.') },
      { text: 'Late Delivery', onPress: () => handleWhatsApp('Hi! My order was very delayed.') },
      { text: 'Payment Issue', onPress: () => handleWhatsApp('Hi! I have a payment issue.') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const avatarLetter = (profile?.name || user?.phoneNumber || 'G')[0].toUpperCase();
  const coinsCashback = Math.floor(coins / 10);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrap}>
            {avatarUri
              ? <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              : <LinearGradient colors={[Colors.primary, '#c94e1a']} style={styles.avatar}>
                  <Text style={styles.avatarLetter}>{avatarLetter}</Text>
                </LinearGradient>
            }
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={10} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerName}>{profile?.name || 'Add your name'}</Text>
            <Text style={styles.headerPhone}>{user?.phoneNumber}</Text>
            {!!profile?.email && <Text style={styles.headerEmail}>{profile.email}</Text>}
            <TouchableOpacity onPress={openEditModal} style={{ marginTop: 6, alignSelf: 'flex-start' }}>
              <Text style={styles.editLink}>Edit profile ›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Stats bar ──────────────────────────────────────────── */}
        <View style={styles.statsBar}>
          <Stat value={totalOrders}    label="Orders"      onPress={() => navigation.navigate('OrderHistory')} />
          <View style={styles.statDiv} />
          <Stat value={favCount}       label="Favourites" />
          <View style={styles.statDiv} />
          <Stat value={`₹${totalSaved}`} label="Total Saved" highlight />
        </View>

        {/* ── GalliPass ──────────────────────────────────────────── */}
        <LinearGradient colors={['#1C1C2E', '#2E2E4E']} style={styles.passCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <View>
            <Text style={styles.passTitle}>🎫  GalliPass</Text>
            <Text style={styles.passSub}>Free delivery on every order · ₹99/month</Text>
          </View>
          <TouchableOpacity style={styles.passBtn}>
            <Text style={styles.passBtnText}>JOIN NOW</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── GalliCoins ─────────────────────────────────────────── */}
        <View style={styles.coinsCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 28 }}>🪙</Text>
            <View>
              <Text style={styles.coinsVal}>{coins} GalliCoins</Text>
              <Text style={styles.coinsSub}>Worth ₹{coinsCashback} · Redeem at checkout</Text>
            </View>
          </View>
          <View style={styles.coinsEarnBadge}>
            <Text style={styles.coinsEarnText}>1 coin / ₹1</Text>
          </View>
        </View>

        {/* ── Wallet & Payments ──────────────────────────────────── */}
        <Group label="Wallet & Payments">
          <Row icon="card-outline"         bg="#E8F5E9" color="#2E7D32"        label="Payment Methods"   sub="UPI, cards & wallets"               onPress={() => Alert.alert('Payment Methods', 'UPI and card management coming soon!')} />
          <Row icon="return-down-back-outline" bg="#FFF3E0" color="#E65100"    label="My Refunds"        sub="Track your refund requests"         onPress={() => Alert.alert('My Refunds', 'Contact support for refunds: +91 97271 78763')} />
          <Row icon="cash-outline"         bg="#F3E5F5" color="#6A1B9A"        label="GalliExpress Money" sub="Cashback & credits in your wallet"  onPress={() => Alert.alert('GalliExpress Money', `You have ₹${coinsCashback} in redeemable GalliCoins.`)} last />
        </Group>

        {/* ── Rewards ────────────────────────────────────────────── */}
        <Group label="Rewards & Offers">
          <Row icon="pricetag-outline"     bg="#F0F4FF" color="#1565C0"        label="Coupons & Vouchers"  sub="Enter code at checkout"           onPress={() => Alert.alert('Coupons', 'Enter your coupon code at the cart screen!')} />
          <Row icon="gift-outline"         bg="#F0FFF4" color="#00C853"        label="Refer & Earn"        sub={`Code: ${referCode} · ₹50/friend`} onPress={handleReferShare} right={<Ionicons name="share-social-outline" size={18} color={Colors.primary} />} />
          <Row icon="trophy-outline"       bg="#FFFDE7" color="#F57F17"        label="Student Discount"    sub="Verify your college ID for 10% off" onPress={() => Alert.alert('Student Discount', 'Student discount program coming soon!')} />
          <Row icon="business-outline"     bg="#E8EAF6" color="#283593"        label="GalliExpress for Business" sub="Bulk orders for offices & events" onPress={() => handleWhatsApp('Hi! I want to place a bulk/business order.')} last />
        </Group>

        {/* ── Preferences ────────────────────────────────────────── */}
        <Group label="Preferences">
          <Row icon="location-outline"    bg="#E8F5FF" color="#0288D1"         label="Saved Addresses"   onPress={() => navigation.navigate('Address')} />
          <Row icon="heart-outline"       bg="#FFF0F3" color="#E91E63"         label="Favourite Shops"   sub={`${favCount} saved shops`}          onPress={() => navigation.navigate('HomeTab')} />

          {/* Notifications toggle */}
          <View style={styles.switchRow}>
            <View style={[styles.rowIcon, { backgroundColor: '#EDE7F6' }]}>
              <Ionicons name="notifications-outline" size={18} color="#512DA8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Order Notifications</Text>
              <Text style={styles.rowSub}>Alerts for order status updates</Text>
            </View>
            <Switch value={notifEnabled} onValueChange={toggleNotif}
              trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
              thumbColor={notifEnabled ? Colors.primary : '#fff'} />
          </View>

          {/* Veg Mode toggle */}
          <View style={styles.switchRow}>
            <View style={[styles.rowIcon, { backgroundColor: '#F1F8E9' }]}>
              <Ionicons name="leaf-outline" size={18} color="#558B2F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Veg Mode</Text>
              <Text style={styles.rowSub}>Show only vegetarian items</Text>
            </View>
            <Switch value={vegMode} onValueChange={toggleVegMode}
              trackColor={{ false: Colors.border, true: '#66BB6A80' }}
              thumbColor={vegMode ? '#43A047' : '#fff'} />
          </View>

          {/* Diet preference */}
          <View style={[styles.switchRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 10, paddingBottom: 14 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.rowIcon, { backgroundColor: '#FFF8E1' }]}>
                <Text style={{ fontSize: 16 }}>🥗</Text>
              </View>
              <Text style={styles.rowLabel}>Diet Preference</Text>
            </View>
            <View style={styles.dietRow}>
              {DIET_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.id}
                  style={[styles.dietChip, dietFilter === opt.id && styles.dietChipOn]}
                  onPress={() => saveDiet(opt.id)}>
                  <Text style={{ fontSize: 13 }}>{opt.emoji}</Text>
                  <Text style={[styles.dietLabel, dietFilter === opt.id && styles.dietLabelOn]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Group>

        {/* ── Help & Support ─────────────────────────────────────── */}
        <Group label="Help & Support">
          <Row icon="logo-whatsapp"              bg="#E8F5E9" color="#25D366" label="WhatsApp Support"     sub="+91 97271 78763"                   onPress={() => handleWhatsApp()} />
          <Row icon="alert-circle-outline"       bg="#FFF3E0" color="#E65100" label="Report an Issue"      sub="Wrong item, late delivery, payment" onPress={handleReportIssue} />
          <Row icon="chatbubble-ellipses-outline" bg="#E3F2FD" color="#1565C0" label="Send Feedback"        sub="Help us improve GalliExpress"       onPress={() => setShowFeedbackModal(true)} />
          <Row icon="shield-outline"             bg="#FCE4EC" color="#C62828" label="Safety Emergency"     sub="In danger? Tap to call 112"         onPress={() => Linking.openURL('tel:112')} />
          <Row icon="share-social-outline"       bg="#E8F5E9" color="#1B5E20" label="Share GalliExpress"   sub="Tell friends about us!"             onPress={handleShareApp} last />
        </Group>

        {/* ── Account ────────────────────────────────────────────── */}
        <Group label="Account">
          <Row icon="star-half-outline"          bg="#FFF8E1" color="#F9A825" label="My Ratings"           sub="Reviews you've submitted"           onPress={() => navigation.navigate('OrderHistory')} />
          <Row icon="star-outline"               bg="#FFFDE7" color="#FB8C00" label="Rate GalliExpress"    sub="Love the app? Give us 5 stars!"     onPress={() => Alert.alert('Thank You! ⭐', 'Play Store rating coming soon.')} />
          <Row icon="information-circle-outline" bg="#E3F2FD" color="#1565C0" label="About GalliExpress"   sub="v1.0.0 · Addanki, Prakasam"         onPress={() => Alert.alert('GalliExpress', 'v1.0.0\nAddanki, Prakasam District, AP\nHyperlocal delivery for your town.')} />
          <Row icon="trash-outline"              bg="#FFEBEE" color="#C62828" label="Delete Account"       sub="Permanently remove your account"    onPress={handleDeleteAccount} last />
        </Group>

        {/* ── Legal ──────────────────────────────────────────────── */}
        <Group label="Legal">
          <Row icon="document-text-outline"    bg="#F3E5F5" color="#7B1FA2" label="Terms of Service"   onPress={() => Linking.openURL('https://galliexpress.in/terms')} />
          <Row icon="shield-checkmark-outline" bg="#E8F5E9" color="#2E7D32" label="Privacy Policy"     onPress={() => Linking.openURL('https://galliexpress.in/privacy')} last />
        </Group>

        {/* ── Log out ────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#E53935" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>GalliExpress v1.0.0 · Addanki, Prakasam District, AP</Text>
      </ScrollView>

      {/* ── Edit Profile Modal ─────────────────────────────────── */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={pickImage} style={styles.modalAvatarWrap}>
              {avatarUri
                ? <Image source={{ uri: avatarUri }} style={styles.modalAvatarImg} />
                : <LinearGradient colors={[Colors.primary, '#c94e1a']} style={styles.modalAvatarCircle}>
                    <Text style={{ fontSize: 30, color: '#fff', fontWeight: '800' }}>{avatarLetter}</Text>
                  </LinearGradient>
              }
              <View style={styles.modalCamBadge}>
                <Ionicons name="camera" size={13} color="#fff" />
              </View>
            </TouchableOpacity>
            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={Colors.lightGrey} value={editName} onChangeText={setEditName} />
            <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor={Colors.lightGrey} value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" autoCapitalize="none" />
            <View style={[styles.input, { justifyContent: 'center', backgroundColor: Colors.background }]}>
              <Text style={{ color: Colors.grey, fontSize: Fonts.sizes.sm }}>{user?.phoneNumber}</Text>
            </View>
            <Text style={styles.modalNote}>Phone number cannot be changed</Text>
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={saveProfile} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ paddingVertical: 12 }} onPress={() => setShowEditModal(false)}>
              <Text style={{ color: Colors.grey, fontSize: Fonts.sizes.md }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Feedback Modal ─────────────────────────────────────── */}
      <Modal visible={showFeedbackModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Send Feedback</Text>
            <Text style={[styles.modalNote, { color: Colors.grey, marginBottom: 12, alignSelf: 'center' }]}>
              Tell us what we can do better 🙏
            </Text>
            <TextInput
              style={[styles.input, { height: 120, textAlignVertical: 'top', paddingTop: 12, marginBottom: 16 }]}
              placeholder="Your feedback..."
              placeholderTextColor={Colors.lightGrey}
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
            />
            <TouchableOpacity style={styles.saveBtn} onPress={submitFeedback}>
              <Text style={styles.saveBtnText}>Submit Feedback</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ paddingVertical: 12 }} onPress={() => setShowFeedbackModal(false)}>
              <Text style={{ color: Colors.grey, fontSize: Fonts.sizes.md }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Stat({ value, label, highlight, onPress }) {
  return (
    <TouchableOpacity style={styles.statItem} onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Text style={[styles.statVal, highlight && { color: Colors.success }]}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </TouchableOpacity>
  );
}

function Group({ label, children }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

function Row({ icon, bg, color, label, sub, onPress, right, last }) {
  return (
    <TouchableOpacity style={[styles.row, !last && styles.rowBorder]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      {right || <Ionicons name="chevron-forward" size={15} color="#C8C8C8" />}
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  avatarLetter: { fontSize: 30, fontWeight: '800', color: '#fff' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.primary, borderRadius: 11, width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  headerName:  { fontSize: 22, fontWeight: '800', color: '#1a1a1a', letterSpacing: -0.4 },
  headerPhone: { fontSize: 13, color: '#888', marginTop: 3 },
  headerEmail: { fontSize: 13, color: '#888', marginTop: 1 },
  editLink:    { fontSize: 13, color: Colors.primary, fontWeight: '700' },

  statsBar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0F0F0', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statVal:  { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
  statLbl:  { fontSize: 11, color: '#999', marginTop: 2, fontWeight: '500' },
  statDiv:  { width: 1, backgroundColor: '#EBEBEB', marginVertical: 10 },

  passCard:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 16, marginBottom: 12, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16 },
  passTitle:   { fontSize: 15, fontWeight: '800', color: '#fff' },
  passSub:     { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 },
  passBtn:     { backgroundColor: Colors.secondary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  passBtnText: { fontSize: 11, fontWeight: '900', color: '#1a1a1a', letterSpacing: 0.5 },

  coinsCard:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFBF0', marginHorizontal: 16, marginBottom: 16, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#FFE082' },
  coinsVal:        { fontSize: 15, fontWeight: '800', color: '#7B5800' },
  coinsSub:        { fontSize: 12, color: '#A07830', marginTop: 2 },
  coinsEarnBadge:  { backgroundColor: '#FFD54F', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  coinsEarnText:   { fontSize: 11, fontWeight: '800', color: '#5D4037' },

  group:      { marginBottom: 10 },
  groupLabel: { fontSize: 12, fontWeight: '700', color: '#999', letterSpacing: 0.6, textTransform: 'uppercase', marginHorizontal: 20, marginBottom: 6 },
  groupCard:  { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', ...Shadows.sm },

  row:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F2F2F2' },
  rowIcon:   { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowLabel:  { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  rowSub:    { fontSize: 12, color: '#999', marginTop: 2 },

  switchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F2' },

  dietRow:     { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  dietChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA' },
  dietChipOn:  { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  dietLabel:   { fontSize: 12, color: '#888', fontWeight: '600' },
  dietLabelOn: { color: Colors.primary, fontWeight: '800' },

  logoutBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 16, marginBottom: 8, paddingVertical: 15, borderRadius: 16, backgroundColor: '#FFF0F0', borderWidth: 1, borderColor: '#FFCDD2' },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#E53935' },
  version:    { textAlign: 'center', fontSize: 11, color: '#C0C0C0', marginBottom: 8 },

  modalBg:           { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:        { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, alignItems: 'center' },
  modalHandle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', marginBottom: 20 },
  modalTitle:        { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 20 },
  modalAvatarWrap:   { position: 'relative', marginBottom: 20 },
  modalAvatarImg:    { width: 88, height: 88, borderRadius: 44 },
  modalAvatarCircle: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  modalCamBadge:     { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.primary, borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  input:             { width: '100%', height: 50, borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: '#1a1a1a', marginBottom: 10 },
  modalNote:         { fontSize: 11, color: '#bbb', alignSelf: 'flex-start', marginBottom: 20 },
  saveBtn:           { backgroundColor: Colors.primary, width: '100%', paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginBottom: 8 },
  saveBtnText:       { color: '#fff', fontSize: 15, fontWeight: '800' },
});
