// GalliExpress Partner — OTP Screen

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { OtpInput } from 'react-native-otp-entry';
import { LinearGradient } from 'expo-linear-gradient';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius } from '../../../../shared/theme';
import { formatPhone } from '../../../../shared/utils';

export default function OTPScreen({ navigation, route }) {
  const { phone, confirmation } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    startCountdown();
    return () => clearInterval(timer.current);
  }, []);

  const startCountdown = () => {
    setCountdown(30);
    setCanResend(false);
    timer.current = setInterval(() => {
      setCountdown((p) => {
        if (p <= 1) { clearInterval(timer.current); setCanResend(true); return 0; }
        return p - 1;
      });
    }, 1000);
  };

  const handleVerify = async (code) => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      await confirmation.confirm(code);
    } catch {
      Alert.alert('Invalid OTP', 'The OTP is incorrect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>📲</Text>
      </View>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.sub}>Enter the 6-digit OTP sent to +91 {phone}</Text>

      <OtpInput
        numberOfDigits={6}
        onTextChange={setOtp}
        onFilled={handleVerify}
        focusColor={Colors.dark}
        theme={{
          inputsContainerStyle: { justifyContent: 'center', gap: 8, marginVertical: 28 },
          pinCodeContainerStyle: {
            width: 48, height: 56, borderRadius: 12,
            borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background,
          },
          pinCodeTextStyle: { fontSize: 20, fontWeight: '700', color: Colors.dark },
        }}
      />

      <TouchableOpacity
        style={[styles.btn, (otp.length !== 6 || loading) && { opacity: 0.5 }]}
        onPress={() => handleVerify(otp)}
        disabled={otp.length !== 6 || loading}
      >
        <LinearGradient colors={['#1C1C2E', '#3D3D5C']} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Verify ✓</Text>}
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ alignItems: 'center', marginTop: 16 }}>
        {canResend
          ? <TouchableOpacity onPress={async () => {
              try {
                const newConfirmation = await auth().signInWithPhoneNumber(formatPhone(phone));
                navigation.setParams({ confirmation: newConfirmation });
                startCountdown();
              } catch { Alert.alert('Error', 'Failed to resend OTP. Please go back and try again.'); }
            }}><Text style={styles.resend}>Resend OTP</Text></TouchableOpacity>
          : <Text style={styles.timer}>Resend in {countdown}s</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.xl, paddingTop: 60 },
  back: { marginBottom: Spacing.xl },
  backText: { fontSize: Fonts.sizes.md, color: Colors.dark, fontWeight: '600' },
  iconBox: { alignSelf: 'center', width: 80, height: 80, borderRadius: 24, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  icon: { fontSize: 40 },
  title: { fontSize: Fonts.sizes.xxl, fontWeight: '800', color: Colors.dark, textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: Fonts.sizes.sm, color: Colors.grey, textAlign: 'center' },
  btn: { borderRadius: Radius.md, overflow: 'hidden' },
  btnGrad: { height: 52, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.white },
  resend: { color: Colors.primary, fontWeight: '600', fontSize: Fonts.sizes.md },
  timer: { color: Colors.grey, fontSize: Fonts.sizes.sm },
});
