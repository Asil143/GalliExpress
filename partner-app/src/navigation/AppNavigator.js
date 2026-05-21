// GalliExpress Partner — App Navigator

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import IncomingOrdersScreen from '../screens/orders/IncomingOrdersScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import MenuScreen from '../screens/menu/MenuScreen';
import AddItemScreen from '../screens/menu/AddItemScreen';
import EarningsScreen from '../screens/earnings/EarningsScreen';
import ShopSettingsScreen from '../screens/dashboard/ShopSettingsScreen';
import { Colors, Fonts, Spacing, OrderStatus } from '../../../shared/theme';
import { useShop } from '../context/ShopContext';
import firestore from '@react-native-firebase/firestore';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="IncomingOrders" component={IncomingOrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}

function MenuStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Menu" component={MenuScreen} />
      <Stack.Screen name="AddItem" component={AddItemScreen} />
    </Stack.Navigator>
  );
}

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="ShopSettings" component={ShopSettingsScreen} />
    </Stack.Navigator>
  );
}

function TabIcon({ iconName, focused, label, badge }) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconPill, focused && styles.iconPillActive]}>
        <Ionicons
          name={focused ? iconName : `${iconName}-outline`}
          size={22}
          color={focused ? Colors.primary : Colors.grey}
        />
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, { color: focused ? Colors.primary : Colors.grey }]}>
        {label}
      </Text>
    </View>
  );
}

export default function AppNavigator() {
  const { shopId } = useShop();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!shopId) return;
    const unsub = firestore()
      .collection('orders')
      .where('shopId', '==', shopId)
      .where('status', '==', OrderStatus.PENDING)
      .onSnapshot(
        (snap) => { if (snap) setPendingCount(snap.size); },
        () => {}
      );
    return unsub;
  }, [shopId]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="grid" focused={focused} label="Dashboard" />
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="receipt" focused={focused} label="Orders" badge={pendingCount} />
          ),
        }}
      />
      <Tab.Screen
        name="MenuTab"
        component={MenuStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="restaurant" focused={focused} label="Menu" />
          ),
        }}
      />
      <Tab.Screen
        name="EarningsTab"
        component={EarningsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="wallet" focused={focused} label="Earnings" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    height: 70,
    borderTopWidth: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 10,
    paddingTop: 6,
    shadowColor: '#1C1C2E',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 24,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  iconPill: {
    width: 48, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  iconPillActive: { backgroundColor: Colors.primary + '18' },
  tabLabel: { fontSize: 10, fontWeight: '600', marginTop: 3, letterSpacing: 0.2 },
  badge: {
    position: 'absolute', top: -2, right: 4,
    backgroundColor: Colors.error, borderRadius: 8,
    width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  badgeText: { color: Colors.white, fontSize: 9, fontWeight: '800' },
});
