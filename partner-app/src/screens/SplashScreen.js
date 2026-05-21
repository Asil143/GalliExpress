// GalliExpress Partner — Splash Screen

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
    <LinearGradient colors={['#1C1C2E', '#3D3D5C']} style={styles.container}>
      <Animated.View style={[styles.logoBox, { transform: [{ scale }], opacity }]}>
        <Text style={styles.logoEmoji}>🏪</Text>
      </Animated.View>
      <Animated.View style={{ opacity, alignItems: 'center' }}>
        <Text style={styles.title}>GalliExpress</Text>
        <Text style={styles.subtitle}>Partner App</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Shop Owner Portal</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  logoBox: {
    width: 100, height: 100, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  logoEmoji: { fontSize: 48 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.white },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  badge: {
    backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 50, marginTop: 12,
  },
  badgeText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
});
