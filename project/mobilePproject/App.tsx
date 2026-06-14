/**
 * Crypto Trading App
 * Android-only React Native app for crypto trading (paper + real)
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/store/AuthContext';
import { PriceProvider } from './src/store/PriceContext';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/utils/constants';
import { setupNotifications } from './src/services/notifications';

function App() {
  useEffect(() => {
    setupNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <AuthProvider>
        <PriceProvider>
          <AppNavigator />
        </PriceProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
