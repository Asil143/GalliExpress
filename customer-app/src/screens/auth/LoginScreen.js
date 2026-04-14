// GalliExpress Customer — Login Screen

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
  const [confirm, setConfirm] = useState(null);

  const handleSendOTP = async () => {
    if (!isValidPhone(phone)) {
      Alert.alert('తప్పు నంబర్', 'దయచేసి సరైన 10 అంకెల ఫోన్ నంబర్ నమోదు చేయండి');
      return;
    }
    setLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber(formatPhone(phone));
      setConfirm(confirmation);
      navigation.navigate('OTP', { phone, confirmation });
    } catch (error) {
      Alert.alert('తప్పు జరిగింది', 'OTP పంపడంలో వైఫల్యం. మళ్ళీ ప్రయత్నించండి.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Gradient */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.header}
        >
          <View style={styles.logoMini}>
            <Text style={styles.logoEmoji}>🛵</Text>
          </View>
          <Text style={styles.headerTitle}>గల్లి ఎక్స్‌ప్రెస్</Text>
          <Text style={styles.headerSub}>మీ గల్లికి డెలివరీ</Text>
        </LinearGradient>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>లాగిన్ చేయండి</Text>
          <Text style={styles.cardSubtitle}>
            మీ ఫోన్ నంబర్ నమోదు చేయండి{'\n'}
            మీకు OTP వస్తుంది
          </Text>

          {/* Phone Input */}
          <View style={styles.inputContainer}>
            <View style={styles.countryCode}>
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

          {/* Send OTP Button */}
          <TouchableOpacity
            style={[styles.btn, (!isValidPhone(phone) || loading) && styles.btnDisabled]}
            onPress={handleSendOTP}
            disabled={!isValidPhone(phone) || loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.btnText}>OTP పంపండి →</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Info */}
          <Text style={styles.info}>
            లాగిన్ చేయడం ద్వారా మీరు మా{' '}
            <Text style={styles.link}>నిబంధనలు & గోప్యతా విధానం</Text>
            కి అంగీకరిస్తున్నారు
          </Text>
        </View>

        {/* Location info */}
        <View style={styles.locationRow}>
          <Text style={styles.locationText}>
            📍 అడ్డంకి, బల్లికురవ మండలం, ప్రకాశం జిల్లా
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 80,
    paddingBottom: 60,
    alignItems: 'center',
  },
  logoMini: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  logoEmoji: { fontSize: 36 },
  headerTitle: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.heavy,
    color: Colors.white,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: Fonts.sizes.md,
    color: 'rgba(255,255,255,0.85)',
  },
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: -24,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  cardTitle: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.bold,
    color: Colors.dark,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: Fonts.sizes.sm,
    color: Colors.grey,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    marginBottom: Spacing.lg,
    height: 54,
    overflow: 'hidden',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: 6,
  },
  flag: { fontSize: 20 },
  code: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.semibold,
    color: Colors.dark,
  },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: Colors.border,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.semibold,
    color: Colors.dark,
    letterSpacing: 2,
  },
  btn: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  btnDisabled: { opacity: 0.5 },
  btnGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  info: {
    fontSize: Fonts.sizes.xs,
    color: Colors.grey,
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: Colors.primary,
    fontWeight: Fonts.weights.medium,
  },
  locationRow: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  locationText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.grey,
  },
});
