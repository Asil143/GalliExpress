// GalliExpress Partner — App Navigator

import React from 'react';
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
import { Colors, Fonts, Spacing } from '../../../shared/theme';

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
      <Text style={[styles.tabLabel, { color: focused ? Colors.primary : Colors.grey }]}>
        {label}
      </Text>
    </View>
  );
}

export default function AppNavigator() {
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
            <TabIcon iconName="grid" focused={focused} label="డాష్‌బోర్డ్" />
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="receipt" focused={focused} label="ఆర్డర్లు" />
          ),
        }}
      />
      <Tab.Screen
        name="MenuTab"
        component={MenuStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="restaurant" focused={focused} label="మెనూ" />
          ),
        }}
      />
      <Tab.Screen
        name="EarningsTab"
        component={EarningsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="wallet" focused={focused} label="సంపాదన" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    height: 65,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: 8,
    paddingTop: 4,
    elevation: 10,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, position: 'relative' },
  tabLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  badge: {
    position: 'absolute', top: -2, right: 6,
    backgroundColor: Colors.error, borderRadius: 8,
    width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: Colors.white, fontSize: 9, fontWeight: '800' },
});
