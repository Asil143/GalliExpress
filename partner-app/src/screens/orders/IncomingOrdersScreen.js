// GalliExpress Partner — Incoming Orders Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { formatPrice, getStatusLabel, getStatusColor, getTimeAgo } from '../../../../shared/utils';
import { OrderStatus } from '../../../../shared/theme';

const TABS = [
  { key: 'pending', label: 'పెండింగ్', color: Colors.warning },
  { key: 'active', label: 'యాక్టివ్', color: Colors.primary },
  { key: 'completed', label: 'పూర్తయింది', color: Colors.success },
];

export default function IncomingOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const user = auth().currentUser;

  useEffect(() => {
    const statusMap = {
      pending: [OrderStatus.PENDING],
      active: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY],
      completed: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    };

    const unsubscribe = firestore()
      .collection('orders')
      .where('shopId', '==', user?.uid)
      .where('status', 'in', statusMap[activeTab])
      .orderBy('createdAt', 'desc')
      .onSnapshot((snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

    return unsubscribe;
  }, [activeTab]);

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await firestore().collection('orders').doc(orderId).update({
        status: newStatus,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch {
      Alert.alert('తప్పు జరిగింది', 'స్థితి అప్‌డేట్ చేయడంలో వైఫల్యం');
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = (orderId) => {
    Alert.alert(
      'ఆర్డర్ తిరస్కరించాలా?',
      'ఈ ఆర్డర్‌ని తిరస్కరించాలని నిర్ధారించండి',
      [
        { text: 'రద్దు', style: 'cancel' },
        {
          text: 'తిరస్కరించు',
          style: 'destructive',
          onPress: () => updateOrderStatus(orderId, OrderStatus.CANCELLED),
        },
      ]
    );
  };

  const getNextStatus = (currentStatus) => {
    const map = {
      [OrderStatus.CONFIRMED]: OrderStatus.PREPARING,
      [OrderStatus.PREPARING]: OrderStatus.READY,
      [OrderStatus.READY]: OrderStatus.ON_THE_WAY,
    };
    return map[currentStatus];
  };

  const getNextLabel = (currentStatus) => {
    const map = {
      [OrderStatus.CONFIRMED]: '🍳 తయారు చేయడం మొదలు',
      [OrderStatus.PREPARING]: '📦 రెడీ అయింది',
      [OrderStatus.READY]: '🛵 రైడర్‌కి ఇచ్చాం',
    };
    return map[currentStatus] || '';
  };

  const renderOrder = ({ item }) => (
    <View style={[styles.orderCard, Shadows.md]}>
      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>#{item.orderId}</Text>
          <Text style={styles.orderTime}>{getTimeAgo(item.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.customerRow}>
        <Ionicons name="person-circle-outline" size={18} color={Colors.grey} />
        <Text style={styles.customerPhone}>{item.customerPhone}</Text>
        <View style={styles.paymentBadge}>
          <Text style={styles.paymentText}>{item.paymentMethod === 'cod' ? '💵 COD' : '📲 UPI'}</Text>
        </View>
      </View>

      {/* Address */}
      <View style={styles.addressRow}>
        <Ionicons name="location-outline" size={16} color={Colors.primary} />
        <Text style={styles.addressText} numberOfLines={2}>{item.address?.line1}</Text>
      </View>

      {/* Items */}
      <View style={styles.itemsList}>
        {item.items?.map((i, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemName}>{i.quantity}x {i.name}</Text>
            <Text style={styles.itemPrice}>{formatPrice(i.price * i.quantity)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.itemRow}>
          <Text style={styles.totalLabel}>మొత్తం</Text>
          <Text style={styles.totalValue}>{formatPrice(item.total)}</Text>
        </View>
      </View>

      {/* Actions */}
      {item.status === OrderStatus.PENDING && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => handleReject(item.id)}
          >
            <Text style={styles.rejectText}>✗ తిరస్కరించు</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => updateOrderStatus(item.id, OrderStatus.CONFIRMED)}
            disabled={updating === item.id}
          >
            <LinearGradient
              colors={[Colors.success, '#009940']}
              style={styles.acceptGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {updating === item.id
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={styles.acceptText}>✓ అంగీకరించు</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Progress buttons for active orders */}
      {[OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY].includes(item.status) && (
        <View style={styles.progressRow}>
          <TouchableOpacity
            style={styles.progressBtn}
            onPress={() => updateOrderStatus(item.id, getNextStatus(item.status))}
            disabled={updating === item.id}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.progressGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {updating === item.id
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={styles.progressText}>{getNextLabel(item.status)}</Text>}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.detailsBtn}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id, order: item })}
          >
            <Text style={styles.detailsBtnText}>వివరాలు</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ఆర్డర్లు</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && [styles.tabActive, { borderBottomColor: tab.color }]]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && { color: tab.color, fontWeight: '700' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>ఆర్డర్లు లేవు</Text>
          <Text style={styles.emptySub}>
            {activeTab === 'pending' ? 'కొత్త ఆర్డర్లు వస్తే ఇక్కడ కనిపిస్తాయి' : 'ఈ కేటగరీలో ఆర్డర్లు లేవు'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: Spacing.lg }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.dark },
  tabs: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  tabActive: {},
  tabText: { fontSize: Fonts.sizes.sm, color: Colors.grey, fontWeight: '500' },
  orderCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.lg, marginBottom: Spacing.md,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  orderId: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.dark },
  orderTime: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  statusText: { fontSize: 11, fontWeight: '700' },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  customerPhone: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.darkGrey },
  paymentBadge: { backgroundColor: Colors.background, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  paymentText: { fontSize: 11, color: Colors.dark },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: Spacing.md },
  addressText: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.grey, lineHeight: 18 },
  itemsList: { backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  itemName: { fontSize: Fonts.sizes.sm, color: Colors.dark, flex: 1 },
  itemPrice: { fontSize: Fonts.sizes.sm, color: Colors.dark, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  totalLabel: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.dark },
  totalValue: { fontSize: Fonts.sizes.md, fontWeight: '800', color: Colors.primary },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  rejectBtn: {
    flex: 1, height: 48, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.error,
    alignItems: 'center', justifyContent: 'center',
  },
  rejectText: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.error },
  acceptBtn: { flex: 2, borderRadius: Radius.md, overflow: 'hidden' },
  acceptGradient: { height: 48, alignItems: 'center', justifyContent: 'center' },
  acceptText: { fontSize: Fonts.sizes.md, fontWeight: '800', color: Colors.white },
  progressRow: { flexDirection: 'row', gap: Spacing.sm },
  progressBtn: { flex: 3, borderRadius: Radius.md, overflow: 'hidden' },
  progressGradient: { height: 48, alignItems: 'center', justifyContent: 'center' },
  progressText: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.white },
  detailsBtn: {
    flex: 1, height: 48, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  detailsBtnText: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.dark },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyEmoji: { fontSize: 52 },
  emptyText: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.dark },
  emptySub: { fontSize: Fonts.sizes.sm, color: Colors.grey, textAlign: 'center' },
});
