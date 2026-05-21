// GalliExpress Customer — OTP Verification Screen

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { OtpInput } from 'react-native-otp-entry';
import { LinearGradient } from 'expo-linear-gradient';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { formatPhone } from '../../../../shared/utils';

export default function OTPScreen({ navigation, route }) {
  const { phone, confirmation } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    startCountdown();
    return () => clearInterval(timerRef.current);
  }, []);

  const startCountdown = () => {
    setCountdown(30);
    setCanResend(false);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = async (code) => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      await confirmation.confirm(code);
      // Auth state listener in App.js handles navigation
    } catch (error) {
      Alert.alert('Invalid OTP', 'The OTP entered is incorrect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      const newConfirmation = await auth().signInWithPhoneNumber(formatPhone(phone));
      navigation.setParams({ confirmation: newConfirmation });
      setCountdown(30);
      setCanResend(false);
      startCountdown();
    } catch {
      Alert.alert('Error', 'Failed to resend OTP. Please go back and try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Text style={styles.iconEmoji}>📱</Text>
        </View>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit OTP sent to{'\n'}+91 {phone}
        </Text>
      </View>

      {/* OTP Input */}
      <View style={styles.otpBox}>
        <OtpInput
          numberOfDigits={6}
          onTextChange={setOtp}
          onFilled={handleVerify}
          focusColor={Colors.primary}
          theme={{
            containerStyle: styles.otpContainer,
            inputsContainerStyle: styles.otpInputsRow,
            pinCodeContainerStyle: styles.otpCell,
            pinCodeTextStyle: styles.otpText,
            focusedPinCodeContainerStyle: styles.otpCellFocused,
          }}
        />
      </View>

      {/* Verify Button */}
      <TouchableOpacity
        style={[styles.btn, (otp.length !== 6 || loading) && styles.btnDisabled]}
        onPress={() => handleVerify(otp)}
        disabled={otp.length !== 6 || loading}
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
            <Text style={styles.btnText}>Verify ✓</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Resend */}
      <View style={styles.resendRow}>
        {canResend ? (
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resendLink}>Resend OTP</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.resendTimer}>
            Resend in {countdown} seconds
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.xl,
    paddingTop: 60,
  },
  backBtn: {
    marginBottom: Spacing.xl,
  },
  backText: {
    fontSize: Fonts.sizes.md,
    color: Colors.primary,
    fontWeight: Fonts.weights.medium,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  iconEmoji: { fontSize: 40 },
  title: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.bold,
    color: Colors.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Fonts.sizes.sm,
    color: Colors.grey,
    textAlign: 'center',
    lineHeight: 22,
  },
  otpBox: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  otpContainer: { width: '100%' },
  otpInputsRow: {
    justifyContent: 'space-between',
    gap: 8,
  },
  otpCell: {
    width: 48,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  otpCellFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  otpText: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.dark,
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
  },
  resendRow: { alignItems: 'center' },
  resendLink: {
    color: Colors.primary,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.semibold,
  },
  resendTimer: {
    color: Colors.grey,
    fontSize: Fonts.sizes.sm,
  },
});
