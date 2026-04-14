// GalliExpress Rider — Splash Screen
// Save as: rider-app/src/screens/SplashScreen.js

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '../../../shared/theme';

export default function SplashScreen() {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={['#0A0A1A', '#1C1C2E']} style={styles.container}>
      <Animated.View style={[styles.logoBox, { transform: [{ scale }], opacity }]}>
        <Text style={styles.logoEmoji}>🛵</Text>
      </Animated.View>
      <Animated.View style={{ opacity, alignItems: 'center' }}>
        <Text style={styles.title}>గల్లి ఎక్స్‌ప్రెస్</Text>
        <Text style={styles.subtitle}>రైడర్ యాప్</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>డెలివరీ పార్టనర్ పోర్టల్</Text>
        </View>
      </Animated.View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>🏍️ అడ్డంకి & చుట్టుపక్కల ప్రాంతాలు</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  logoBox: {
    width: 110, height: 110, borderRadius: 32,
    backgroundColor: 'rgba(255,107,53,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,107,53,0.4)',
  },
  logoEmoji: { fontSize: 56 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.white },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  badge: {
    backgroundColor: Colors.primary, paddingHorizontal: 16,
    paddingVertical: 6, borderRadius: 50, marginTop: 12,
  },
  badgeText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  footer: {
    position: 'absolute', bottom: 48,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50,
  },
  footerText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
});
