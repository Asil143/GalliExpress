// GalliExpress Rider App — Root

import React, { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import SplashScreen from './src/screens/SplashScreen';
import { Colors } from '../shared/theme';

LogBox.ignoreLogs(['This method is deprecated']);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth().onAuthStateChanged(async (u) => {
      if (u) {
        await firestore().collection('riders').doc(u.uid).set({
          phone: u.phoneNumber,
          isOnline: false,
          totalDeliveries: 0,
          totalEarnings: 0,
          rating: 5.0,
        }, { merge: true });
      }
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <SplashScreen />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor={Colors.dark} />
          {user ? <AppNavigator /> : <AuthNavigator />}
        </NavigationContainer>
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
