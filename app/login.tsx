import { ErrorModal } from '@/components/ErrorModal';
import { SuccessModal } from '@/components/SuccessModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { authService } from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Animated, Image, Pressable, StyleSheet, TextInput } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [spinAnim] = useState(new Animated.Value(0));
  const [showPassword, setShowPassword] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = async () => {
    if (!emailOrUsername || !password) {
      setErrorMessage('Lagyan lahat ng fields');
      setErrorCode(undefined);
      setErrorModalVisible(true);
      return;
    }

    setLoading(true);

    // Start spinning animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    try {
      // Suppress Firebase console errors temporarily
      const originalError = console.error;
      console.error = () => {};

      let userProfile: any;
      try {
        // Sign in via Firebase with email or username
        userProfile = await authService.signInWithEmailOrUsername(emailOrUsername.trim(), password);

        console.log('===== LOGIN SUCCESS =====');
        console.log('User profile from auth service:', JSON.stringify(userProfile));
        console.log('User role:', userProfile.role);
        console.log('==========================');

        // Store user data in AsyncStorage
        await AsyncStorage.setItem('currentUser', JSON.stringify(userProfile));
        console.log('Saved user profile to AsyncStorage');
      } finally {
        // Restore console.error
        console.error = originalError;
      }

      setLoading(false);
      spinAnim.setValue(0);

      // Show success modal with user's full name
      const fullName = userProfile?.fullName || userProfile?.name || 'User';
      setSuccessMessage(`Logged in Successfully!\nMaligayang pagbabalik!, ${fullName}`);
      setSuccessModalVisible(true);

      // Navigate to dashboard after success modal is dismissed
      setTimeout(() => {
        router.replace('/(tabs)/dashboard');
      }, 2500);
    } catch (error: any) {
      setLoading(false);
      spinAnim.setValue(0);

      const msg = error?.message || 'Subukan muling mag login';
      const code = error?.code;

      setErrorMessage(msg);
      setErrorCode(code);
      setErrorModalVisible(true);
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ThemedView style={styles.container} lightColor='transparent' darkColor='transparent'>
      <ThemedView style={styles.header} lightColor='transparent' darkColor='transparent'>
        <Link href="/(tabs)" asChild>
          <Pressable>
            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          </Pressable>
        </Link>
        <ThemedText style={styles.headerTitle} lightColor='transparent' darkColor='transparent'>LOGIN</ThemedText>
      </ThemedView>

      <ThemedView style={styles.content} lightColor='transparent' darkColor='transparent'>
        <ThemedView style={styles.logoContainer} lightColor='transparent' darkColor='transparent'>
          <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        </ThemedView>

        <ThemedView style={styles.form} lightColor='transparent' darkColor='transparent'>
          <TextInput
            style={styles.input}
            placeholder="Email o Palayaw"
            placeholderTextColor="#7F8C8D"
            autoCapitalize="none"
            value={emailOrUsername}
            onChangeText={setEmailOrUsername}
          />
          <ThemedView style={styles.passwordContainer} lightColor='transparent' darkColor='transparent'>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#7F8C8D"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color="#7F8C8D"
              />
            </Pressable>
          </ThemedView>

          <Link href="/forgot-password" asChild>
            <Pressable style={styles.forgotPasswordLink}>
              <ThemedText style={styles.forgotPasswordText}>Nakalimutan ang password?</ThemedText>
            </Pressable>
          </Link>

          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              loading && styles.loginButtonLoading,
              pressed && !loading && { opacity: 0.8, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <>
                <Animated.View style={{ transform: [{ rotate: spin }], marginRight: 8 }}>
                  <ActivityIndicator color="#fff" size="small" />
                </Animated.View>
                <ThemedText style={styles.loginButtonText}>Maaaring maghintay lamang...</ThemedText>
              </>
            ) : (
              <ThemedText style={styles.loginButtonText}>MAG-LOGIN</ThemedText>
            )}
          </Pressable>
        </ThemedView>
      </ThemedView>

      <ErrorModal
        visible={errorModalVisible}
        message={errorMessage}
        errorCode={errorCode}
        onDismiss={() => setErrorModalVisible(false)}
      />

      <SuccessModal
        visible={successModalVisible}
        message={successMessage}
        onDismiss={() => setSuccessModalVisible(false)}
      />
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
    marginBottom: 40,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: '80%',
    height: '80%',
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECF0F1',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BDC3C7',
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    color: '#2C3E50',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotPasswordText: {
    color: '#3498DB',
    fontSize: 14,
  },
  loginButton: {
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
    flexDirection: 'row',
  },
  loginButtonLoading: {
    backgroundColor: '#2980B9',
    opacity: 0.9,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
