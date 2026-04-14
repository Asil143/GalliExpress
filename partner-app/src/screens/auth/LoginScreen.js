// GalliExpress Partner — Login Screen

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
      Alert.alert('తప్పు నంబర్', 'సరైన 10 అంకెల ఫోన్ నంబర్ నమోదు చేయండి');
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
        {/* Dark Header */}
        <LinearGradient colors={['#1C1C2E', '#3D3D5C']} style={styles.header}>
          <Text style={styles.headerEmoji}>🏪</Text>
          <Text style={styles.headerTitle}>పార్టనర్ పోర్టల్</Text>
          <Text style={styles.headerSub}>గల్లి ఎక్స్‌ప్రెస్ పార్టనర్ అవ్వండి</Text>
        </LinearGradient>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>పార్టనర్ లాగిన్</Text>
          <Text style={styles.cardSubtitle}>
            మీ రిజిస్టర్డ్ ఫోన్ నంబర్ నమోదు చేయండి
          </Text>

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
              colors={['#1C1C2E', '#3D3D5C']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.btnText}>OTP పంపండి →</Text>}
            </LinearGradient>
          </TouchableOpacity>

          {/* Benefits */}
          <View style={styles.benefitsList}>
            {['📦 మరిన్ని ఆర్డర్లు పొందండి', '💰 రోజువారీ సంపాదన చూడండి', '🛵 మా రైడర్లు డెలివరీ చేస్తారు'].map((b, i) => (
              <Text key={i} style={styles.benefit}>{b}</Text>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>
          పార్టనర్ అవ్వడానికి సహాయం కావాలా?{'\n'}
          <Text style={styles.footerLink}>+91 XXXXXXXXXX కి కాల్ చేయండి</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: Colors.background },
  header: { paddingTop: 80, paddingBottom: 60, alignItems: 'center', gap: 8 },
  headerEmoji: { fontSize: 52 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  card: {
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg,
    marginTop: -24, borderRadius: Radius.xl, padding: Spacing.xl,
    ...Shadows.lg,
  },
  cardTitle: { fontSize: Fonts.sizes.xxl, fontWeight: Fonts.weights.bold, color: Colors.dark, marginBottom: 8 },
  cardSubtitle: { fontSize: Fonts.sizes.sm, color: Colors.grey, marginBottom: Spacing.xl },
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
  btnGradient: { height: 52, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.white },
  benefitsList: { gap: 8 },
  benefit: { fontSize: Fonts.sizes.sm, color: Colors.darkGrey },
  footer: { textAlign: 'center', padding: Spacing.xl, fontSize: Fonts.sizes.sm, color: Colors.grey, lineHeight: 22 },
  footerLink: { color: Colors.primary, fontWeight: '600' },
});
