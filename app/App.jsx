import React, { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  useFonts,
  Rajdhani_400Regular,
  Rajdhani_600SemiBold,
  Rajdhani_700Bold,
} from '@expo-google-fonts/rajdhani';
import {
  ShareTechMono_400Regular,
} from '@expo-google-fonts/share-tech-mono';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { RecordsProvider } from './src/context/RecordsContext';
import { ToastProvider } from './src/components/ToastManager';
import RootNavigator from './src/navigation/RootNavigator';
import { View, ActivityIndicator } from 'react-native';

// ── Inner app — waits for fonts + auth boot ───────────────────
function AppInner() {
  const { theme } = useAuth();
  const bg = theme === 'dark' ? '#0a0e1a' : '#f0f4fa';

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} backgroundColor={bg} />
      <RecordsProvider>
        <RootNavigator />
      </RecordsProvider>
    </>
  );
}

// ── Root ──────────────────────────────────────────────────────
export default function App() {
  const [fontsLoaded] = useFonts({
    Rajdhani_400Regular,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
    ShareTechMono_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0e1a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#00d4ff" size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <AuthProvider>
            <AppInner />
          </AuthProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
