import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { authService } from "@/services/authService";
import { firebaseService } from "@/services/firebaseService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [phoneAuthType, setPhoneAuthType] = useState<"password" | "otp">(
    "password",
  );

  // OTP verification states
  const [isOTPModalVisible, setIsOTPModalVisible] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [testOTP, setTestOTP] = useState<string | undefined>(undefined);
  const [pendingSignUpData, setPendingSignUpData] = useState<any>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const companiesList = await firebaseService.getCompanies();
      setCompanies(companiesList);
    } catch (error) {
      console.error("Error loading companies:", error);
      Alert.alert("Error", "Failed to load companies");
    } finally {
      setLoadingCompanies(false);
    }
  };

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(companySearchQuery.toLowerCase()),
  );

  const handleBackPress = () => {
    router.push("/intro");
  };

  const validateInputs = () => {
    if (!fullName.trim()) {
      Alert.alert("Validation Error", "Ilagay ang iyong buong pangalan");
      return false;
    }
    if (!username.trim()) {
      Alert.alert("Validation Error", "Ilagay ang iyong palayaw");
      return false;
    }
    if (username.trim().length < 3) {
      Alert.alert(
        "Validation Error",
        "Ang iyong palayaw ay dapat kahit manlang 3 characters",
      );
      return false;
    }

    // Validate based on auth method
    if (authMethod === "email") {
      if (!email.trim()) {
        Alert.alert("Validation Error", "Ilagay ang iyong email");
        return false;
      }
      if (!email.includes("@")) {
        Alert.alert("Validation Error", "Ilagay ang tamang email address");
        return false;
      }
    } else {
      // Phone validation
      if (!phone.trim()) {
        Alert.alert("Validation Error", "Ilagay ang iyong mobile number");
        return false;
      }
      if (!authService.validatePhoneNumber(phone)) {
        Alert.alert(
          "Validation Error",
          "Ilagay ang tamang mobile number (+63 or 09)",
        );
        return false;
      }
    }

    if (!company) {
      Alert.alert("Validation Error", "Pumili ng company");
      return false;
    }

    if (!password) {
      Alert.alert("Validation Error", "Ilagay ang iyong password");
      return false;
    }
    if (password.length < 6) {
      Alert.alert(
        "Validation Error",
        "Ang iyong password ay dapat kahit manlang 6 characters",
      );
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert(
        "Validation Error",
        "Hindi tugma ang password na inilagay mo",
      );
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      if (authMethod === "email") {
        // Email signup - direct creation
        const userProfile = await authService.signUp(
          email.trim().toLowerCase(),
          password,
          fullName.trim(),
          username.trim().toLowerCase(),
          company,
        );

        Alert.alert(
          "Successful ang iyong Sign up!",
          "Ang account na ginawa mo ay matagumpay na nagawa, Maaaring antayin na lang ang kumpirmasyon ng Manager upang maka-login.",
          [
            {
              text: "Bumalik sa Login",
              onPress: () => router.push("/login"),
              style: "default",
            },
          ],
        );
      } else {
        // Phone signup - send OTP first
        const formattedPhone = authService.formatPhoneNumber(phone.trim());

        try {
          const otpResponse = await authService.sendPhoneOTP(formattedPhone);

          // Store pending signup data
          setPendingSignUpData({
            phone: formattedPhone,
            password,
            fullName: fullName.trim(),
            username: username.trim().toLowerCase(),
            company,
          });

          // Show OTP modal
          setVerificationId(otpResponse.verificationId);
          setOtpMessage(otpResponse.message);
          setTestOTP(otpResponse.testOTP);
          setOtpCode("");
          setIsOTPModalVisible(true);
        } catch (otpError: any) {
          Alert.alert("OTP Error", otpError.message || "Failed to send OTP");
        }
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      const errorMessage = error.message || "An error occurred during sign up";
      Alert.alert("Sign Up Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim()) {
      Alert.alert("Validation Error", "Ilagay ang OTP code");
      return;
    }

    if (otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
      Alert.alert("Validation Error", "OTP must be 6 digits");
      return;
    }

    setLoading(true);
    try {
      // Verify OTP
      await authService.verifyPhoneOTP(verificationId, otpCode);

      // OTP verified, now create the account
      if (pendingSignUpData) {
        const userProfile = await authService.completePhoneSignUp(
          pendingSignUpData.phone,
          pendingSignUpData.password,
          pendingSignUpData.fullName,
          pendingSignUpData.username,
          pendingSignUpData.company,
        );

        setIsOTPModalVisible(false);
        setOtpCode("");
        setTestOTP(undefined);
        setPendingSignUpData(null);

        Alert.alert(
          "Successful ang iyong Sign up!",
          "Ang account na ginawa mo ay matagumpay na nagawa, Maaaring antayin na lang ang kumpirmasyon ng Manager upang maka-login.",
          [
            {
              text: "Bumalik sa Login",
              onPress: () => router.push("/login"),
              style: "default",
            },
          ],
        );
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      Alert.alert(
        "OTP Verification Error",
        error.message || "Failed to verify OTP",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!pendingSignUpData) return;

    setLoading(true);
    try {
      const otpResponse = await authService.sendPhoneOTP(
        pendingSignUpData.phone,
      );
      setVerificationId(otpResponse.verificationId);
      setOtpMessage(otpResponse.message);
      setTestOTP(otpResponse.testOTP);
      setOtpCode("");
      Alert.alert("Success", "New OTP sent to your phone");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <ThemedView
          style={styles.container}
          lightColor="transparent"
          darkColor="transparent"
        >
          <ThemedView
            style={styles.header}
            lightColor="transparent"
            darkColor="transparent"
          >
            <Pressable
              onPress={handleBackPress}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Ionicons name="arrow-back" size={24} color="#2C3E50" />
            </Pressable>
            <ThemedText
              style={styles.headerTitle}
              lightColor="transparent"
              darkColor="transparent"
            >
              MAG-SIGN UP
            </ThemedText>
          </ThemedView>

          <ThemedView
            style={styles.content}
            lightColor="transparent"
            darkColor="transparent"
          >
            <ThemedView
              style={styles.logoContainer}
              lightColor="transparent"
              darkColor="transparent"
            >
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logo}
              />
            </ThemedView>

            <ThemedText style={styles.subtitle}>
              Gumawa ng sariling account
            </ThemedText>

            {/* Auth Method Selector */}
            <View style={styles.authMethodContainer}>
              <Pressable
                style={[
                  styles.authMethodButton,
                  authMethod === "email" && styles.authMethodButtonActive,
                ]}
                onPress={() => {
                  setAuthMethod("email");
                  setPhone("");
                }}
                disabled={loading}
              >
                <ThemedText
                  style={[
                    styles.authMethodText,
                    authMethod === "email" && styles.authMethodTextActive,
                  ]}
                >
                  Email
                </ThemedText>
              </Pressable>
            </View>

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

            {/* Email or Phone Input */}
            {authMethod === "email" ? (
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
            ) : (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="Mobile Number (+63 or 09)"
                  placeholderTextColor="#999"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
                <View style={styles.phoneAuthTypeContainer}>
                  <View style={styles.phoneAuthTypeLabel}>
                    <ThemedText style={styles.phoneAuthTypeText}>
                      Authentication Method:
                    </ThemedText>
                  </View>
                  <View style={styles.phoneAuthTypeButtons}>
                    <Pressable
                      style={[
                        styles.phoneAuthTypeButton,
                        phoneAuthType === "password" &&
                          styles.phoneAuthTypeButtonActive,
                      ]}
                      onPress={() => setPhoneAuthType("password")}
                      disabled={loading}
                    >
                      <ThemedText
                        style={[
                          styles.phoneAuthTypeButtonText,
                          phoneAuthType === "password" &&
                            styles.phoneAuthTypeButtonTextActive,
                        ]}
                      >
                        Password
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.phoneAuthTypeButton,
                        phoneAuthType === "otp" &&
                          styles.phoneAuthTypeButtonActive,
                      ]}
                      onPress={() => setPhoneAuthType("otp")}
                      disabled={loading}
                    >
                      <ThemedText
                        style={[
                          styles.phoneAuthTypeButtonText,
                          phoneAuthType === "otp" &&
                            styles.phoneAuthTypeButtonTextActive,
                        ]}
                      >
                        OTP
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* Company Dropdown */}
            <Pressable
              style={styles.dropdown}
              onPress={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
              disabled={loading || loadingCompanies}
            >
              <ThemedText
                style={[styles.dropdownText, !company && { color: "#999" }]}
              >
                {company || "Mamili ng Kompanya"}
              </ThemedText>
              <Ionicons
                name={isCompanyDropdownOpen ? "chevron-up" : "chevron-down"}
                size={20}
                color="#666"
              />
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
                        setCompanySearchQuery("");
                      }}
                    >
                      <ThemedText style={styles.dropdownItemText}>
                        {item.name}
                      </ThemedText>
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <ThemedText style={styles.emptyText}>
                      Walang nahanap na kompanya
                    </ThemedText>
                  }
                />
              </View>
            )}

            <ThemedView
              style={styles.passwordContainer}
              lightColor="transparent"
              darkColor="transparent"
            >
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
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  color="#666"
                />
              </Pressable>
            </ThemedView>

            <ThemedView
              style={styles.passwordContainer}
              lightColor="transparent"
              darkColor="transparent"
            >
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
                <Ionicons
                  name={showConfirmPassword ? "eye" : "eye-off"}
                  size={20}
                  color="#666"
                />
              </Pressable>
            </ThemedView>

            <Pressable
              style={({ pressed }) => [
                styles.signUpButton,
                pressed &&
                  !loading && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                loading && styles.signUpButtonDisabled,
              ]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.signUpButtonText}>
                  I-SUBMIT ANG ACCOUNT
                </ThemedText>
              )}
            </Pressable>

            <ThemedView
              style={styles.loginLink}
              lightColor="transparent"
              darkColor="transparent"
            >
              <ThemedText style={styles.loginText}>
                Mayroon ka nang account?{" "}
              </ThemedText>
              <Pressable onPress={() => router.push("/login")}>
                <ThemedText style={styles.loginLinkText}>Mag-login</ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>

          {/* OTP Verification Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isOTPModalVisible}
            onRequestClose={() => !loading && setIsOTPModalVisible(false)}
          >
            <View style={styles.otpModalOverlay}>
              <View style={styles.otpModalContent}>
                <View style={styles.otpModalHeader}>
                  <ThemedText style={styles.otpModalTitle}>
                    I-verify ang iyong Mobile Number
                  </ThemedText>
                </View>

                <ThemedText style={styles.otpModalMessage}>
                  {otpMessage}
                </ThemedText>

                {testOTP && (
                  <View style={styles.testOTPContainer}>
                    <ThemedText style={styles.testOTPLabel}>
                      🔧 Development Testing Code:
                    </ThemedText>
                    <View style={styles.testOTPCodeBox}>
                      <ThemedText style={styles.testOTPCode}>
                        {testOTP}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.testOTPHint}>
                      (Only visible in development)
                    </ThemedText>
                  </View>
                )}

                <View style={styles.otpInputContainer}>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="000000"
                    placeholderTextColor="#999"
                    value={otpCode}
                    onChangeText={(text) =>
                      setOtpCode(text.replace(/[^0-9]/g, "").slice(0, 6))
                    }
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!loading}
                  />
                  <ThemedText style={styles.otpInputHint}>
                    6-digit code
                  </ThemedText>
                </View>

                <Pressable
                  style={[
                    styles.otpVerifyButton,
                    !otpCode || loading ? styles.otpVerifyButtonDisabled : {},
                  ]}
                  onPress={handleVerifyOTP}
                  disabled={!otpCode || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ThemedText style={styles.otpVerifyButtonText}>
                      I-verify ang OTP
                    </ThemedText>
                  )}
                </Pressable>

                <Pressable
                  style={[styles.otpResendButton]}
                  onPress={handleResendOTP}
                  disabled={loading}
                >
                  <ThemedText style={styles.otpResendButtonText}>
                    Mag-resend ng OTP
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={styles.otpCancelButton}
                  onPress={() => {
                    setIsOTPModalVisible(false);
                    setOtpCode("");
                    setTestOTP(undefined);
                    setPendingSignUpData(null);
                  }}
                  disabled={loading}
                >
                  <ThemedText style={styles.otpCancelButtonText}>
                    Kanselahin
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </Modal>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    color: "#2C3E50",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 20,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#2C3E50",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    alignSelf: "center",
    overflow: "hidden",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
  },
  signUpButton: {
    backgroundColor: "#3498DB",
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    width: "100%",
    shadowColor: "#3498DB",
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginLink: {
    flexDirection: "row",
    marginTop: 16,
    justifyContent: "center",
  },
  loginText: {
    fontSize: 14,
    color: "#666",
  },
  loginLinkText: {
    fontSize: 14,
    color: "#3498DB",
    fontWeight: "600",
  },
  dropdown: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
  },
  dropdownText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 12,
    maxHeight: 250,
    overflow: "hidden",
  },
  searchInput: {
    height: 40,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
    fontSize: 14,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#333",
  },
  emptyText: {
    padding: 12,
    textAlign: "center",
    color: "#999",
    fontSize: 14,
  },
  authMethodContainer: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 4,
  },
  authMethodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  authMethodButtonActive: {
    backgroundColor: "#3498DB",
  },
  authMethodText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  authMethodTextActive: {
    color: "#fff",
  },
  phoneAuthTypeContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  phoneAuthTypeLabel: {
    marginBottom: 8,
  },
  phoneAuthTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  phoneAuthTypeButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  phoneAuthTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 4,
    backgroundColor: "#fff",
  },
  phoneAuthTypeButtonActive: {
    backgroundColor: "#3498DB",
    borderColor: "#3498DB",
  },
  phoneAuthTypeButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  phoneAuthTypeButtonTextActive: {
    color: "#fff",
  },
  // OTP Modal Styles
  otpModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  otpModalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  otpModalHeader: {
    marginBottom: 16,
  },
  otpModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C3E50",
    textAlign: "center",
  },
  otpModalMessage: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  otpInputContainer: {
    marginBottom: 20,
  },
  otpInput: {
    width: "100%",
    height: 56,
    borderWidth: 2,
    borderColor: "#3498DB",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
    backgroundColor: "#f9f9f9",
    letterSpacing: 8,
  },
  otpInputHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  otpVerifyButton: {
    backgroundColor: "#3498DB",
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#3498DB",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  otpVerifyButtonDisabled: {
    opacity: 0.5,
  },
  otpVerifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  otpResendButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#3498DB",
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  otpResendButtonText: {
    color: "#3498DB",
    fontSize: 14,
    fontWeight: "600",
  },
  otpCancelButton: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  otpCancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  testOTPContainer: {
    backgroundColor: "#FFF8DC",
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  testOTPLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF8C00",
    marginBottom: 8,
  },
  testOTPCodeBox: {
    backgroundColor: "#FFFACD",
    borderWidth: 1,
    borderColor: "#FF8C00",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  testOTPCode: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF8C00",
    textAlign: "center",
    letterSpacing: 2,
  },
  testOTPHint: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
  },
});
