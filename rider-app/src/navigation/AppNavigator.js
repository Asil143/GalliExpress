// GalliExpress Rider — App Navigator

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import RiderHomeScreen from '../screens/home/RiderHomeScreen';
import ActiveDeliveryScreen from '../screens/delivery/ActiveDeliveryScreen';
import EarningsScreen from '../screens/earnings/EarningsScreen';
import ProfileScreen from '../screens/profile/RiderProfileScreen';
import { Colors, Fonts } from '../../../shared/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RiderHome" component={RiderHomeScreen} />
      <Stack.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} />
    </Stack.Navigator>
  );
}

function TabIcon({ icon, focused, label }) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconPill, focused && styles.iconPillActive]}>
        <Ionicons
          name={focused ? icon : `${icon}-outline`}
          size={22}
          color={focused ? Colors.primary : Colors.grey}
        />
      </View>
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
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="home" focused={focused} label="Home" />
          ),
        }}
      />
      <Tab.Screen
        name="EarningsTab"
        component={EarningsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="wallet" focused={focused} label="Earnings" />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="person" focused={focused} label="Profile" />
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
  tabItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  iconPill: {
    width: 52, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  iconPillActive: { backgroundColor: Colors.primary + '18' },
  tabLabel: { fontSize: 10, fontWeight: '600', marginTop: 3, letterSpacing: 0.2 },
});
