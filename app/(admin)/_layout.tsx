// Admin Layout Router
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function AdminLayout() {
  // Only render on web
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="projects" />
      <Stack.Screen name="users" />
      <Stack.Screen name="complaints" />
    </Stack>
  );
}
