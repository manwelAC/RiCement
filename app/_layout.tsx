import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  const isWeb = Platform.OS === 'web';

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {isWeb ? (
        // Web: Use admin group starting with landing
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(admin)" options={{ animationEnabled: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      ) : (
        // Mobile: Use tabs group starting with index
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ animationEnabled: false }} />
          <Stack.Screen name="intro" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="terms" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="+not-found" />
        </Stack>
      )}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default RootLayout;
