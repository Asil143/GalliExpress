// GalliExpress Rider — Home Screen

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Animated, Vibration, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { formatPrice, getTimeAgo } from '../../../../shared/utils';
import { OrderStatus } from '../../../../shared/theme';

export default function RiderHomeScreen({ navigation }) {
  const [isOnline, setIsOnline] = useState(false);
  const [todayStats, setTodayStats] = useState({ deliveries: 0, earnings: 0 });
  const [incomingOrder, setIncomingOrder] = useState(null);
  const [riderName, setRiderName] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [timer, setTimer] = useState(30);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);
  const user = auth().currentUser;
  const DELIVERY_FEE_PER_ORDER = 30;

  useEffect(() => {
    loadRiderProfile();
    loadTodayStats();
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setIncomingOrder(null);
      setShowRequestModal(false);
      return;
    }

    // Listen for orders assigned to this rider or unassigned READY orders
    const unsub = firestore()
      .collection('orders')
      .where('status', '==', OrderStatus.READY)
      .where('town', '==', 'addanki')
      .where('riderId', '==', null)
      .orderBy('createdAt', 'asc')
      .limit(1)
      .onSnapshot((snap) => {
        if (!snap.empty) {
          const order = { id: snap.docs[0].id, ...snap.docs[0].data() };
          setIncomingOrder(order);
          showDeliveryRequest(order);
        }
      });

    return unsub;
  }, [isOnline]);

  const loadRiderProfile = async () => {
    const snap = await firestore().collection('riders').doc(user?.uid).get();
    if (snap.exists) setRiderName(snap.data().name || 'రైడర్');
  };

  const loadTodayStats = async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const snap = await firestore()
      .collection('orders')
      .where('riderId', '==', user?.uid)
      .where('status', '==', OrderStatus.DELIVERED)
      .where('createdAt', '>=', firestore.Timestamp.fromDate(today))
      .get();
    setTodayStats({
      deliveries: snap.size,
      earnings: snap.size * DELIVERY_FEE_PER_ORDER,
    });
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  const showDeliveryRequest = (order) => {
    Vibration.vibrate([0, 400, 200, 400]);
    setShowRequestModal(true);
    setTimer(30);
    startPulse();

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setShowRequestModal(false);
          pulseAnim.stopAnimation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAccept = async () => {
    if (!incomingOrder) return;
    setAccepting(true);
    clearInterval(timerRef.current);
    try {
      await firestore().collection('orders').doc(incomingOrder.id).update({
        riderId: user?.uid,
        status: OrderStatus.ON_THE_WAY,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      setShowRequestModal(false);
      navigation.navigate('ActiveDelivery', { orderId: incomingOrder.id, order: incomingOrder });
    } catch {
      Alert.alert('తప్పు', 'అంగీకరించడంలో వైఫల్యం');
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = () => {
    clearInterval(timerRef.current);
    pulseAnim.stopAnimation();
    setShowRequestModal(false);
    setIncomingOrder(null);
  };

  const toggleOnline = async (val) => {
    if (val) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('లొకేషన్ అవసరం', 'డెలివరీ చేయడానికి లొకేషన్ అనుమతి అవసరం');
        return;
      }
    }
    setIsOnline(val);
    await firestore().collection('riders').doc(user?.uid).update({
      isOnline: val,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={['#1C1C2E', '#3D3D5C']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>నమస్కారం 👋</Text>
            <Text style={styles.riderName}>{riderName}</Text>
          </View>
          <TouchableOpacity
            style={styles.earningsBtn}
            onPress={() => navigation.navigate('EarningsTab')}
          >
            <Ionicons name="wallet-outline" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Online Toggle - BIG */}
        <View style={styles.onlineCard}>
          <View style={styles.onlineLeft}>
            <Animated.View style={[
              styles.statusDot,
              { backgroundColor: isOnline ? Colors.success : Colors.error },
              isOnline && { transform: [{ scale: pulseAnim }] },
            ]} />
            <View>
              <Text style={styles.onlineLabel}>
                {isOnline ? '🟢 ఆన్‌లైన్ — ఆర్డర్లు వస్తాయి' : '🔴 ఆఫ్‌లైన్'}
              </Text>
              <Text style={styles.onlineSub}>
                {isOnline ? 'డెలివరీ రిక్వెస్ట్‌ల కోసం వేచి ఉంది' : 'ఆన్‌లైన్ అవ్వండి'}
              </Text>
            </View>
          </View>
          <Switch
            value={isOnline}
            onValueChange={toggleOnline}
            trackColor={{ false: '#555', true: Colors.success + '60' }}
            thumbColor={isOnline ? Colors.success : Colors.grey}
            style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
          />
        </View>
      </LinearGradient>

      <ScrollView>
        {/* Today Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, Shadows.md]}>
            <Text style={styles.statEmoji}>🛵</Text>
            <Text style={styles.statValue}>{todayStats.deliveries}</Text>
            <Text style={styles.statLabel}>ఈరోజు డెలివరీలు</Text>
          </View>
          <View style={[styles.statCard, Shadows.md]}>
            <Text style={styles.statEmoji}>💰</Text>
            <Text style={[styles.statValue, { color: Colors.success }]}>
              {formatPrice(todayStats.earnings)}
            </Text>
            <Text style={styles.statLabel}>ఈరోజు సంపాదన</Text>
          </View>
          <View style={[styles.statCard, Shadows.md]}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statValue}>5.0</Text>
            <Text style={styles.statLabel}>రేటింగ్</Text>
          </View>
        </View>

        {/* Offline prompt */}
        {!isOnline && (
          <View style={styles.offlinePrompt}>
            <Text style={styles.offlineEmoji}>💤</Text>
            <Text style={styles.offlineTitle}>మీరు ఆఫ్‌లైన్‌లో ఉన్నారు</Text>
            <Text style={styles.offlineSub}>
              ఆర్డర్లు స్వీకరించడానికి పైన ఉన్న స్విచ్ ఆన్ చేయండి
            </Text>
            <TouchableOpacity style={styles.goOnlineBtn} onPress={() => toggleOnline(true)}>
              <Text style={styles.goOnlineBtnText}>🟢 ఆన్‌లైన్ అవ్వు</Text>
            </TouchableOpacity>
          </View>
        )}

        {isOnline && (
          <View style={styles.waitingCard}>
            <Animated.Text style={[styles.waitingEmoji, { transform: [{ scale: pulseAnim }] }]}>
              🛵
            </Animated.Text>
            <Text style={styles.waitingTitle}>ఆర్డర్ కోసం వేచి ఉంది...</Text>
            <Text style={styles.waitingSub}>డెలివరీ రిక్వెస్ట్ వచ్చినప్పుడు నోటిఫికేషన్ వస్తుంది</Text>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 సూచనలు</Text>
          {[
            '⚡ త్వరగా అంగీకరించినవారికి ఎక్కువ ఆర్డర్లు వస్తాయి',
            '⭐ మంచి రేటింగ్ కోసం సమయానికి డెలివరీ చేయండి',
            '📱 ఆర్డర్ రాగానే కస్టమర్‌కి కాల్ చేయండి',
          ].map((tip, i) => (
            <Text key={i} style={styles.tipItem}>{tip}</Text>
          ))}
        </View>
      </ScrollView>

      {/* Incoming Order Modal */}
      <Modal visible={showRequestModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.timerRow}>
              <Text style={styles.timerLabel}>అంగీకరించడానికి సమయం</Text>
              <View style={[styles.timerBadge, timer <= 10 && { backgroundColor: Colors.error }]}>
                <Text style={styles.timerText}>{timer}s</Text>
              </View>
            </View>

            <Text style={styles.newOrderTitle}>🔔 కొత్త డెలివరీ రిక్వెస్ట్!</Text>

            {incomingOrder && (
              <>
                <View style={styles.modalDetail}>
                  <Ionicons name="storefront-outline" size={18} color={Colors.primary} />
                  <Text style={styles.modalDetailText}>
                    పికప్: <Text style={{ fontWeight: '700' }}>{incomingOrder.shopName}</Text>
                  </Text>
                </View>
                <View style={styles.modalDetail}>
                  <Ionicons name="location-outline" size={18} color={Colors.success} />
                  <Text style={styles.modalDetailText} numberOfLines={2}>
                    డెలివరీ: {incomingOrder.address?.line1}
                  </Text>
                </View>
                <View style={styles.modalDetail}>
                  <Ionicons name="cash-outline" size={18} color={Colors.secondary} />
                  <Text style={styles.modalDetailText}>
                    ఆర్డర్ మొత్తం: <Text style={{ fontWeight: '700' }}>{formatPrice(incomingOrder.total)}</Text>
                    {'  '}|{'  '}
                    మీ సంపాదన: <Text style={{ fontWeight: '700', color: Colors.success }}>{formatPrice(DELIVERY_FEE_PER_ORDER)}</Text>
                  </Text>
                </View>
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.rejectModalBtn} onPress={handleReject}>
                <Text style={styles.rejectModalText}>✗ తిరస్కరించు</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptModalBtn} onPress={handleAccept} disabled={accepting}>
                <LinearGradient
                  colors={[Colors.success, '#009940']}
                  style={styles.acceptModalGrad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.acceptModalText}>✓ అంగీకరించు</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: Spacing.xl, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  greeting: { fontSize: Fonts.sizes.sm, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  riderName: { fontSize: Fonts.sizes.xxl, fontWeight: '800', color: Colors.white },
  earningsBtn: { padding: 8 },
  onlineCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  onlineLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  statusDot: { width: 14, height: 14, borderRadius: 7 },
  onlineLabel: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.white },
  onlineSub: { fontSize: Fonts.sizes.xs, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  statsRow: {
    flexDirection: 'row', padding: Spacing.lg, gap: Spacing.sm,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', gap: 4,
  },
  statEmoji: { fontSize: 24 },
  statValue: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.dark },
  statLabel: { fontSize: 9, color: Colors.grey, textAlign: 'center' },
  offlinePrompt: {
    alignItems: 'center', padding: 40, gap: 10,
  },
  offlineEmoji: { fontSize: 52 },
  offlineTitle: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: Colors.dark },
  offlineSub: { fontSize: Fonts.sizes.sm, color: Colors.grey, textAlign: 'center' },
  goOnlineBtn: {
    backgroundColor: Colors.success, paddingHorizontal: 32,
    paddingVertical: 14, borderRadius: Radius.full, marginTop: 8,
  },
  goOnlineBtnText: { color: Colors.white, fontWeight: '800', fontSize: Fonts.sizes.md },
  waitingCard: {
    alignItems: 'center', backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg, borderRadius: Radius.xl,
    padding: 32, gap: 10, ...Shadows.md,
  },
  waitingEmoji: { fontSize: 56 },
  waitingTitle: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: Colors.dark },
  waitingSub: { fontSize: Fonts.sizes.sm, color: Colors.grey, textAlign: 'center' },
  tipsCard: {
    backgroundColor: Colors.white, margin: Spacing.lg,
    borderRadius: Radius.xl, padding: Spacing.lg, gap: 10, ...Shadows.sm,
  },
  tipsTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.dark, marginBottom: 4 },
  tipItem: { fontSize: Fonts.sizes.sm, color: Colors.darkGrey, lineHeight: 20 },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.white, borderTopLeftRadius: 28,
    borderTopRightRadius: 28, padding: Spacing.xl, gap: Spacing.md,
  },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timerLabel: { fontSize: Fonts.sizes.sm, color: Colors.grey },
  timerBadge: {
    backgroundColor: Colors.warning, paddingHorizontal: 14,
    paddingVertical: 6, borderRadius: 50,
  },
  timerText: { color: Colors.white, fontWeight: '800', fontSize: Fonts.sizes.md },
  newOrderTitle: { fontSize: Fonts.sizes.xxl, fontWeight: '800', color: Colors.dark },
  modalDetail: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  modalDetailText: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.darkGrey, lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: 8 },
  rejectModalBtn: {
    flex: 1, height: 52, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.error,
    alignItems: 'center', justifyContent: 'center',
  },
  rejectModalText: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.error },
  acceptModalBtn: { flex: 2, borderRadius: Radius.md, overflow: 'hidden' },
  acceptModalGrad: { height: 52, alignItems: 'center', justifyContent: 'center' },
  acceptModalText: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.white },
});
