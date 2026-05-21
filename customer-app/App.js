// GalliExpress Customer App — Root

import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import auth from '@react-native-firebase/auth';

import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import SplashScreen from './src/screens/SplashScreen';
import { Colors } from '../shared/theme';
import { CartProvider } from './src/context/CartContext';
import {
  requestNotificationPermission,
  registerFCMToken,
  setupForegroundHandler,
  setupBackgroundTapHandler,
  checkInitialNotification,
  registerBackgroundHandler,
} from './src/services/NotificationService';

// Register background handler OUTSIDE component (module level)
registerBackgroundHandler();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigationRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        setupNotifications();
      }
    });
    return unsubscribe;
  }, []);

  const setupNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (!granted) return;
    await registerFCMToken();
    setupBackgroundTapHandler(navigationRef);
    await checkInitialNotification(navigationRef);
  };

  useEffect(() => {
    // Foreground notification listener (always active)
    const unsubscribe = setupForegroundHandler(navigationRef);
    return unsubscribe;
  }, []);

  if (loading) return <SplashScreen />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <CartProvider>
          <NavigationContainer ref={navigationRef}>
            <StatusBar style="dark" backgroundColor={Colors.white} />
            {user ? <AppNavigator /> : <AuthNavigator />}
          </NavigationContainer>
          <Toast />
        </CartProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
