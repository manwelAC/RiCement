import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { authService } from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Pressable, StyleSheet, TextInput } from 'react-native';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [spinAnim] = useState(new Animated.Value(0));

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Ilagay ang iyong email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Ilagay ang wastong email address');
      return;
    }

    setIsLoading(true);
    
    // Start spinning animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    try {
      await authService.resetPassword(email.trim());
      setIsLoading(false);
      spinAnim.setValue(0);
      Alert.alert(
        'Success',
        'Na-isend na ang message sa pag-palit ng password! Tignan ang iyong inbox sa email at sundan ang instruction kung paano papalitan',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Password reset error:', error);
      setIsLoading(false);
      spinAnim.setValue(0);
      const errorMessage = (error as any)?.message || 'Failed to send reset email. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ThemedView style={styles.container} lightColor='transparent' darkColor='transparent'>
      <ThemedView style={styles.header} lightColor='transparent' darkColor='transparent'>
        <Link href="/login" asChild>
          <Pressable>
            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          </Pressable>
        </Link>
        <ThemedText style={styles.headerTitle}>FORGOT PASSWORD</ThemedText>
      </ThemedView>

      <ThemedView style={styles.content} lightColor='transparent' darkColor='transparent'>
        <ThemedView style={styles.logoContainer} lightColor='transparent' darkColor='transparent'>
          <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        </ThemedView>

        <ThemedText style={styles.title}>Baguhin ang iyong password</ThemedText>
        <ThemedText style={styles.subtitle}>
          Ilagay ang iyong email address at mag-sesend kami ng instructions para baguhin ang iyong password
        </ThemedText>

        <ThemedView style={styles.form} lightColor='transparent' darkColor='transparent'>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#7F8C8D"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
          />

          <Pressable 
            style={({ pressed }) => [
              styles.resetButton,
              isLoading && styles.buttonDisabled,
              pressed && !isLoading && { opacity: 0.8, transform: [{ scale: 0.97 }] }
            ]}
            onPress={handleResetPassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Animated.View style={{ transform: [{ rotate: spin }], marginRight: 8 }}>
                  <ActivityIndicator color="#fff" size="small" />
                </Animated.View>
                <ThemedText style={styles.resetButtonText}>NAGPAPADALA...</ThemedText>
              </>
            ) : (
              <ThemedText style={styles.resetButtonText}>ISEND ANG LINK</ThemedText>
            )}
          </Pressable>

          <Link href="/login" asChild>
            <Pressable style={({ pressed }) => [styles.backToLoginLink, pressed && { opacity: 0.6 }]}>
              <ThemedText style={styles.backToLoginText}>Bumalik sa Login</ThemedText>
            </Pressable>
          </Link>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    color: '#2C3E50',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2C3E50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: '80%',
    height: '80%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  form: {
    width: '100%',
    gap: 16,
  },
  input: {
    backgroundColor: '#ECF0F1',
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 16,
    color: '#2C3E50',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#BDC3C7',
  },
  resetButton: {
    backgroundColor: '#3498DB',
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#3498DB',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#95A5A6',
    shadowOpacity: 0.1,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  backToLoginText: {
    color: '#3498DB',
    fontSize: 14,
  },
});
