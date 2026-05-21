// GalliExpress Partner App — Root

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import auth from '@react-native-firebase/auth';

import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import SplashScreen from './src/screens/SplashScreen';
import ShopSetupScreen from './src/screens/onboarding/ShopSetupScreen';
import { ShopProvider, useShop } from './src/context/ShopContext';
import { Colors } from '../shared/theme';
import { registerFCMToken, requestNotificationPermission, setupForegroundMessaging } from './src/services/NotificationService';

function RootNavigator() {
  const { shop, shopId, loading } = useShop();
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = auth().onAuthStateChanged((u) => {
      setUser(u);
      if (u) {
        requestNotificationPermission().then(() => registerFCMToken());
        setupForegroundMessaging();
      }
    });
    return unsub;
  }, []);

  if (user === undefined || loading) return <SplashScreen />;
  if (!user) return <AuthNavigator />;
  if (!shopId) return <ShopSetupScreen />;
  return <AppNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ShopProvider>
          <NavigationContainer>
            <StatusBar style="dark" backgroundColor={Colors.white} />
            <RootNavigator />
          </NavigationContainer>
          <Toast />
        </ShopProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
