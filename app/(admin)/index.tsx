// Admin Index - Redirects to login
import { Redirect } from 'expo-router';
import { Platform } from 'react-native';

export default function AdminIndex() {
  if (Platform.OS !== 'web') {
    return <Redirect href="/" />;
  }
  
  return <Redirect href="/(admin)/login" />;
}
