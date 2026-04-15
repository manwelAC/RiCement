import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

export default function HomeScreen() {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handleGetStarted = () => {
    router.push('/intro');
  };

  const handleLogin = () => {
    router.push('/login');
  };
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </ThemedView>
      
      <ThemedView style={styles.contentContainer} lightColor="transparent" darkColor="transparent">
        <ThemedText style={styles.title}>RICEMENT</ThemedText>
        <ThemedText style={styles.subtitle}>your safety, our standard</ThemedText>
        
        <ThemedView style={styles.buttonContainer} lightColor="transparent" darkColor="transparent">
          <Pressable
            style={({ pressed }) => [
              styles.getStartedButton,
              pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleGetStarted}>
            <ThemedText style={styles.getStartedText}>Mag-simula</ThemedText>
          </Pressable>
          
          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleLogin}>
            <ThemedText style={styles.loginText}>May Account na</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2C3E50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 40,
  },
  buttonContainer: {
    gap: 15,
    width: '100%',
    alignItems: 'center',
  },
  getStartedButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3498DB',
    shadowColor: '#3498DB',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  getStartedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BDC3C7',
    backgroundColor: '#ffffff',
  },
  loginText: {
    color: '#2C3E50',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
