// GalliExpress Customer — Order History Screen

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Colors, Fonts, Spacing, Radius, Shadows } from '../../../../shared/theme';
import { formatPrice, formatDate, getStatusLabel, getStatusColor } from '../../../../shared/utils';

export default function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth().currentUser;

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('orders')
      .where('customerId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .onSnapshot((snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOrders(data);
        setLoading(false);
      });
    return unsubscribe;
  }, []);

  const renderOrder = ({ item }) => (
    <TouchableOpacity
      style={[styles.orderCard, Shadows.sm]}
      onPress={() => navigation.navigate('OrderTracking', { orderId: item.orderId || item.id, order: item })}
      activeOpacity={0.85}
    >
      <View style={styles.orderTop}>
        <View>
          <Text style={styles.shopName}>{item.shopName}</Text>
          <Text style={styles.orderId}>#{item.orderId}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.orderMid}>
        <Text style={styles.itemsSummary} numberOfLines={1}>
          {item.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
        </Text>
      </View>

      <View style={styles.orderBottom}>
        <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
        <Text style={styles.orderTotal}>{formatPrice(item.total)}</Text>
      </View>

      {item.status === 'delivered' && (
        <TouchableOpacity style={styles.reorderBtn}>
          <Ionicons name="refresh" size={14} color={Colors.primary} />
          <Text style={styles.reorderText}>మళ్ళీ ఆర్డర్ చేయండి</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>నా ఆర్డర్లు</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyTitle}>ఆర్డర్లు లేవు</Text>
          <Text style={styles.emptySub}>మీరు ఇంకా ఏ ఆర్డర్ చేయలేదు</Text>
          <TouchableOpacity style={styles.shopNowBtn} onPress={() => navigation.navigate('HomeTab')}>
            <Text style={styles.shopNowText}>ఆర్డర్ చేయండి</Text>
          </TouchableOpacity>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.dark },
  orderCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  shopName: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.dark },
  orderId: { fontSize: Fonts.sizes.xs, color: Colors.grey, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.bold },
  orderMid: { marginBottom: 10 },
  itemsSummary: { fontSize: Fonts.sizes.sm, color: Colors.grey },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderDate: { fontSize: Fonts.sizes.xs, color: Colors.grey },
  orderTotal: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold, color: Colors.dark },
  reorderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: Spacing.sm, paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  reorderText: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: Fonts.weights.semibold },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.bold, color: Colors.dark },
  emptySub: { fontSize: Fonts.sizes.sm, color: Colors.grey },
  shopNowBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md, borderRadius: Radius.md, marginTop: 8,
  },
  shopNowText: { color: Colors.white, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
});
