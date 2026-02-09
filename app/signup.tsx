import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { authService } from '@/services/authService';
import { firebaseService } from '@/services/firebaseService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState('');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const companiesList = await firebaseService.getCompanies();
      setCompanies(companiesList);
    } catch (error) {
      console.error('Error loading companies:', error);
      Alert.alert('Error', 'Failed to load companies');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(companySearchQuery.toLowerCase())
  );

  const handleBackPress = () => {
    router.push('/intro');
  };

  const validateInputs = () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Ilagay ang iyong buong pangalan');
      return false;
    }
    if (!username.trim()) {
      Alert.alert('Validation Error', 'Ilagay ang iyong palayaw');
      return false;
    }
    if (username.trim().length < 3) {
      Alert.alert('Validation Error', 'Ang iyong palayaw ay dapat kahit manlang 3 characters');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Ilagay ang iyong email');
      return false;
    }
    if (!email.includes('@')) {
      Alert.alert('Validation Error', 'Ilagay ang tamang email address');
      return false;
    }
    if (!company) {
      Alert.alert('Validation Error', 'Pumili ng company');
      return false;
    }
    if (!password) {
      Alert.alert('Validation Error', 'Ilagay ang iyong password');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Validation Error', 'Ang iyong password ay dapat kahit manlang 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Hindi tugma ang password na inilagay mo');
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const userProfile = await authService.signUp(
        email.trim().toLowerCase(),
        password,
        fullName.trim(),
        username.trim().toLowerCase(),
        company
      );

      Alert.alert(
        'Successful ang iyong Sign up!',
        'Ang account na ginawa mo ay matagumpay na nagawa, Maaaring antayin na lang ang kumpirmasyon ng Manager upang maka-login.',
        [
          {
            text: 'Bumalik sa Login',
            onPress: () => router.push('/login'),
            style: 'default'
          }
        ]
      );
    } catch (error: any) {
      console.error('Sign up error:', error);
      const errorMessage = error.message || 'An error occurred during sign up';
      Alert.alert('Sign Up Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{ flexGrow: 1 }}>
        <ThemedView style={styles.container} lightColor='transparent' darkColor='transparent'>
        <ThemedView style={styles.header} lightColor='transparent' darkColor='transparent'>
          <Pressable onPress={handleBackPress} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          </Pressable>
          <ThemedText style={styles.headerTitle} lightColor='transparent' darkColor='transparent'>MAG-SIGN UP</ThemedText>
        </ThemedView>

        <ThemedView style={styles.content} lightColor='transparent' darkColor='transparent'>
          <ThemedView style={styles.logoContainer} lightColor='transparent' darkColor='transparent'>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
          </ThemedView>

          <ThemedText style={styles.subtitle}>Gumawa ng sariling account</ThemedText>

          <TextInput
            style={styles.input}
            placeholder="Buong Pangalan"
            placeholderTextColor="#999"
            value={fullName}
            onChangeText={setFullName}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Palayaw"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            editable={!loading}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            editable={!loading}
            autoCapitalize="none"
          />

          {/* Company Dropdown */}
          <Pressable 
            style={styles.dropdown}
            onPress={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
            disabled={loading || loadingCompanies}
          >
            <ThemedText style={[styles.dropdownText, !company && { color: '#999' }]}>
              {company || 'Mamili ng Kompanya'}
            </ThemedText>
            <Ionicons name={isCompanyDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color="#666" />
          </Pressable>

          {isCompanyDropdownOpen && (
            <View style={styles.dropdownMenu}>
              <TextInput
                style={styles.searchInput}
                placeholder="Mag-hanap ng Kompanya..."
                placeholderTextColor="#999"
                value={companySearchQuery}
                onChangeText={setCompanySearchQuery}
              />
              <FlatList
                data={filteredCompanies}
                keyExtractor={(item) => item.id}
                scrollEnabled={filteredCompanies.length > 5}
                nestedScrollEnabled={true}
                style={{ maxHeight: 200 }}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCompany(item.name);
                      setIsCompanyDropdownOpen(false);
                      setCompanySearchQuery('');
                    }}
                  >
                    <ThemedText style={styles.dropdownItemText}>{item.name}</ThemedText>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <ThemedText style={styles.emptyText}>Walang nahanap na kompanya</ThemedText>
                }
              />
            </View>
          )}

          <ThemedView style={styles.passwordContainer} lightColor='transparent' darkColor='transparent'>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <Pressable 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#666" />
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.passwordContainer} lightColor='transparent' darkColor='transparent'>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
            />
            <Pressable 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons name={showConfirmPassword ? 'eye' : 'eye-off'} size={20} color="#666" />
            </Pressable>
          </ThemedView>

          <Pressable 
            style={({ pressed }) => [
              styles.signUpButton, 
              pressed && !loading && { opacity: 0.8, transform: [{ scale: 0.97 }] },
              loading && styles.signUpButtonDisabled
            ]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.signUpButtonText}>I-SUBMIT ANG ACCOUNT</ThemedText>
            )}
          </Pressable>

          <ThemedView style={styles.loginLink} lightColor='transparent' darkColor='transparent'>
            <ThemedText style={styles.loginText}>Mayroon ka nang account? </ThemedText>
            <Pressable onPress={() => router.push('/login')}>
              <ThemedText style={styles.loginLinkText}>Mag-login</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2C3E50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
  },
  signUpButton: {
    backgroundColor: '#3498DB',
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    width: '100%',
    shadowColor: '#3498DB',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLinkText: {
    fontSize: 14,
    color: '#3498DB',
    fontWeight: '600',
  },
  dropdown: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 12,
    maxHeight: 250,
    overflow: 'hidden',
  },
  searchInput: {
    height: 40,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    fontSize: 14,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  emptyText: {
    padding: 12,
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
});
