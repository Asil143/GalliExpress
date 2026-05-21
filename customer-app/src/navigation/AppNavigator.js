// GalliExpress Customer — App Navigator (post-login)

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/home/HomeScreen';
import ShopListScreen from '../screens/shop/ShopListScreen';
import ShopDetailScreen from '../screens/shop/ShopDetailScreen';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/checkout/CheckoutScreen';
import OrderTrackingScreen from '../screens/tracking/OrderTrackingScreen';
import OrderHistoryScreen from '../screens/profile/OrderHistoryScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AddressScreen from '../screens/profile/AddressScreen';
import SearchScreen from '../screens/search/SearchScreen';
import RateOrderScreen from '../screens/rating/RateOrderScreen';
import HelpScreen from '../screens/support/HelpScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { Colors, Fonts, Spacing, Radius } from '../../../shared/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ─── Home Stack ───────────────────────────────────────────────────────────────
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ShopList" component={ShopListScreen} />
      <Stack.Screen name="ShopDetail" component={ShopDetailScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
    </Stack.Navigator>
  );
}

// ─── Orders Stack ─────────────────────────────────────────────────────────────
function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
    </Stack.Navigator>
  );
}

// ─── Tab Icon Component ───────────────────────────────────────────────────────
function TabIcon({ name, focused, label, badge }) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconPill, focused && styles.iconPillActive]}>
        <Ionicons
          name={focused ? name : `${name}-outline`}
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

// ─── Main Tab Navigator ───────────────────────────────────────────────────────
export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <Stack.Screen name="RateOrder" component={RateOrderScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Address" component={AddressScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="ShopDetail" component={ShopDetailScreen} />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} label="Home" />
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="receipt" focused={focused} label="Orders" />
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
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  iconPill: {
    width: 52, height: 34,
    borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  iconPillActive: {
    backgroundColor: Colors.primary + '18',
  },
  tabLabel: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.semibold,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 4,
    backgroundColor: Colors.error,
    borderRadius: Radius.full,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: Fonts.weights.bold,
  },
});
