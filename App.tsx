import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize Firebase and other services
        // Check if Firebase env variables are loaded
        if (!process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) {
          console.warn('Firebase environment variables not loaded. Attempting to load from .env.local');
        }

        // Try to import and initialize config to catch any issues early
        try {
          const firebaseModule = require('./config/firebase');
          console.log('Firebase initialized successfully');
        } catch (firebaseError) {
          console.error('Firebase initialization error:', firebaseError);
          // Don't block app loading if Firebase fails
        }

        // Add a small delay to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.error('Error during app initialization:', e);
        setInitError(e instanceof Error ? e.message : String(e));
      } finally {
        // Hide splash screen whether initialization succeeded or failed
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  // Show error screen in development if initialization failed
  if (initError && __DEV__) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Initialization Error</Text>
        <Text style={{ fontSize: 12, color: 'red', textAlign: 'center', paddingHorizontal: 20 }}>
          {initError}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
