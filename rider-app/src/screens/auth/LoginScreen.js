// GalliExpress Rider — Login Screen
// Save as: rider-app/src/screens/auth/LoginScreen.js

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { isValidPhone, formatPhone } from '../../../../shared/utils';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!isValidPhone(phone)) {
      Alert.alert('తప్పు నంబర్', 'సరైన 10 అంకెల నంబర్ నమోదు చేయండి');
      return;
    }
    setLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber(formatPhone(phone));
      navigation.navigate('OTP', { phone, confirmation });
    } catch {
      Alert.alert('తప్పు జరిగింది', 'OTP పంపడంలో వైఫల్యం');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={['#0A0A1A', '#1C1C2E']} style={styles.header}>
          <Text style={styles.emoji}>🛵</Text>
          <Text style={styles.title}>రైడర్ లాగిన్</Text>
          <Text style={styles.sub}>GalliExpress డెలివరీ పార్టనర్</Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>మీ ఫోన్ నంబర్</Text>
          <Text style={styles.cardSub}>రిజిస్టర్డ్ నంబర్‌తో లాగిన్ చేయండి</Text>

          <View style={styles.inputRow}>
            <View style={styles.prefix}>
              <Text style={styles.flag}>🇮🇳</Text>
              <Text style={styles.code}>+91</Text>
            </View>
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              placeholder="ఫోన్ నంబర్"
              placeholderTextColor={Colors.lightGrey}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, (!isValidPhone(phone) || loading) && { opacity: 0.5 }]}
            onPress={handleSendOTP}
            disabled={!isValidPhone(phone) || loading}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.btnGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.btnText}>OTP పంపండి →</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.perksBox}>
            <Text style={styles.perksTitle}>రైడర్ అవ్వడం వల్ల:</Text>
            {[
              '💰 ప్రతి డెలివరీకి ₹25–₹40 సంపాదించండి',
              '⏰ మీ సమయం మీరు ఎంచుకోండి',
              '🛵 మీ సొంత బైక్‌తో పని చేయండి',
              '📱 యాప్ ద్వారా అన్నీ మేనేజ్ చేయండి',
            ].map((p, i) => (
              <Text key={i} style={styles.perk}>{p}</Text>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>
          రైడర్ అవ్వడానికి:{'\n'}
          <Text style={styles.footerLink}>+91 XXXXXXXXXX కి కాల్ చేయండి</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: Colors.background },
  header: { paddingTop: 80, paddingBottom: 60, alignItems: 'center', gap: 8 },
  emoji: { fontSize: 56 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.white },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.65)' },
  card: {
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg,
    marginTop: -24, borderRadius: Radius.xl, padding: Spacing.xl, ...Shadows.lg,
  },
  cardTitle: { fontSize: Fonts.sizes.xxl, fontWeight: '800', color: Colors.dark, marginBottom: 6 },
  cardSub: { fontSize: Fonts.sizes.sm, color: Colors.grey, marginBottom: Spacing.lg },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    backgroundColor: Colors.background, marginBottom: Spacing.lg, height: 54,
  },
  prefix: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, gap: 6 },
  flag: { fontSize: 20 },
  code: { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.dark },
  divider: { width: 1, height: '60%', backgroundColor: Colors.border },
  input: { flex: 1, paddingHorizontal: Spacing.md, fontSize: Fonts.sizes.lg, fontWeight: '600', color: Colors.dark, letterSpacing: 2 },
  btn: { borderRadius: Radius.md, overflow: 'hidden', marginBottom: Spacing.xl },
  btnGrad: { height: 52, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.white },
  perksBox: { backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.md, gap: 8 },
  perksTitle: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.dark, marginBottom: 4 },
  perk: { fontSize: Fonts.sizes.sm, color: Colors.darkGrey },
  footer: { textAlign: 'center', padding: Spacing.xl, fontSize: Fonts.sizes.sm, color: Colors.grey, lineHeight: 22 },
  footerLink: { color: Colors.primary, fontWeight: '600' },
});
