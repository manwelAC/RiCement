// Firebase Authentication Service
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInAnonymously,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    User,
} from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    where,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

export interface UserProfile {
  uid: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string; // Optional: for phone authentication
  role: "admin" | "user" | "employee" | "superadmin";
  company?: string;
  createdAt: Date;
  lastLogin: Date;
  isApproved?: boolean; // For pending account approval by admin
}

class AuthService {
  // Sign up new user with email
  async signUp(
    email: string,
    password: string,
    fullName: string,
    username: string,
    company?: string,
  ): Promise<UserProfile> {
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, {
        displayName: fullName,
      });

      // Create user document in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        fullName,
        username,
        email,
        role: "user",
        company: company || "",
        createdAt: new Date(),
        lastLogin: new Date(),
        isApproved: false, // Set to false - needs admin approval
      };

      try {
        await setDoc(doc(db, "users", user.uid), userProfile);
        console.log("User created successfully:", userProfile);
      } catch (fireErr: any) {
        // Defensive: Firestore native/Hermes bug may crash during setDoc (getSize HostFunction error)
        // Allow signup to succeed (auth user exists) but surface a helpful warning.
        console.warn(
          "Firestore write failed during signUp; proceeding with auth-only profile",
          fireErr,
        );
      }

      return userProfile;
    } catch (error: any) {
      console.error("Error signing up:", error);
      throw this.handleAuthError(error);
    }
  }

  // Sign up new user with phone number - OTP flow
  // Send phone OTP using local SMS backend
  async sendPhoneOTP(
    phone: string,
  ): Promise<{ verificationId: string; message: string; testOTP?: string }> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      // Validate phone format first
      if (!this.validatePhoneNumber(phone)) {
        throw new Error("Invalid phone number format");
      }

      // Generate OTP and verification ID
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Store OTP temporarily for verification
      (this as any).pendingOTP = {
        verificationId,
        phone: formattedPhone,
        otpCode,
        createdAt: Date.now(),
        attempts: 0,
      };

      // Call local SMS backend to send real SMS
      const SMS_BACKEND_URL =
        process.env.EXPO_PUBLIC_SMS_BACKEND_URL || "http://localhost:3001";

      try {
        console.log(`📱 Sending OTP to ${formattedPhone} via SMS backend...`);
        const response = await fetch(`${SMS_BACKEND_URL}/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: formattedPhone,
            otpCode: otpCode,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error("❌ SMS backend error:", result.error);
          throw new Error(result.error || "Failed to send SMS");
        }

        console.log("✅ SMS sent successfully:", result.messageSid);
      } catch (smsError: any) {
        console.warn(
          "⚠️ SMS sending failed (backend may be offline):",
          smsError.message,
        );
        // Don't throw - allow development to continue with test OTP
      }

      return {
        verificationId,
        message: `OTP sent to ${formattedPhone}. Valid for 10 minutes.`,
        testOTP: process.env.NODE_ENV === "production" ? undefined : otpCode,
      };
    } catch (error: any) {
      console.error("Error in sendPhoneOTP:", error);
      throw this.handlePhoneAuthError(error.message || "Failed to send OTP");
    }
  }

  // Verify OTP code using Firebase
  async verifyPhoneOTP(
    verificationId: string,
    otpCode: string,
  ): Promise<boolean> {
    try {
      const pendingOTP = (this as any).pendingOTP;

      if (!pendingOTP || pendingOTP.verificationId !== verificationId) {
        throw new Error("Invalid verification ID");
      }

      if (!otpCode.trim() || otpCode.length !== 6) {
        throw new Error("OTP must be 6 digits");
      }

      // Check if OTP has expired (10 minutes)
      if (Date.now() - pendingOTP.createdAt > 10 * 60 * 1000) {
        throw new Error("OTP has expired. Please request a new one.");
      }

      // Check attempt limit
      if (pendingOTP.attempts >= 5) {
        throw new Error("Too many failed attempts. Please request a new OTP.");
      }

      if (pendingOTP.otpCode !== otpCode.trim()) {
        pendingOTP.attempts += 1;
        const remaining = 5 - pendingOTP.attempts;
        throw new Error(
          `Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
        );
      }

      // OTP verified successfully
      console.log("✅ OTP verified successfully");
      return true;
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      throw this.handlePhoneAuthError(
        error.message || "OTP verification failed",
      );
    }
  }

  // Complete phone signup after OTP verification
  async completePhoneSignUp(
    phone: string,
    password: string,
    fullName: string,
    username: string,
    company?: string,
  ): Promise<UserProfile> {
    try {
      // Check if a user with this phone number already exists
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("phone", "==", phone));
      const existingUsers = await getDocs(q);

      if (!existingUsers.empty) {
        throw new Error(
          "This phone number is already registered. Please use a different number or login instead.",
        );
      }

      // Generate a unique temporary email from phone number (add timestamp to make it unique)
      const cleanPhone = phone.replace(/\D/g, "");
      const timestamp = Date.now();
      const tempEmail = `${cleanPhone}+${timestamp}@phone.ricement.local`;

      // Create user account with unique temporary email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        tempEmail,
        password,
      );
      const user = userCredential.user;

      // Update user profile display name
      await updateProfile(user, {
        displayName: fullName,
      });

      // Create user document in Firestore with phone number
      const userProfile: UserProfile = {
        uid: user.uid,
        fullName,
        username,
        email: tempEmail,
        phone,
        role: "user",
        company: company || "",
        createdAt: new Date(),
        lastLogin: new Date(),
        isApproved: false,
      };

      try {
        await setDoc(doc(db, "users", user.uid), userProfile);
        console.log("✅ User profile created in Firestore:", userProfile);
      } catch (fireErr: any) {
        console.warn(
          "Firestore write failed during phone signup; proceeding with auth-only profile",
          fireErr,
        );
      }

      // Clear pending OTP
      (this as any).pendingOTP = null;

      return userProfile;
    } catch (error: any) {
      console.error("Error completing phone signup:", error);
      throw this.handleAuthError(error);
    }
  }

  // Sign up new user with phone number and password (kept for compatibility)
  async signUpWithPhoneAndPassword(
    phone: string,
    password: string,
    fullName: string,
    username: string,
    company?: string,
  ): Promise<UserProfile> {
    // This now just calls completePhoneSignUp for convenience
    return this.completePhoneSignUp(
      phone,
      password,
      fullName,
      username,
      company,
    );
  }

  // Validate phone number format (Philippine number)
  validatePhoneNumber(phone: string): boolean {
    // Accept formats: +63XXXXXXXXXX or 09XXXXXXXXXX
    const phoneRegex = /^(\+63|0)\d{9,10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  }

  // Format phone number to international format
  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.startsWith("63")) {
      return `+${cleaned}`;
    }

    if (cleaned.startsWith("0")) {
      return `+63${cleaned.substring(1)}`;
    }

    return phone;
  }

  // Sign in user with email or username
  async signInWithEmailOrUsername(
    emailOrUsername: string,
    password: string,
  ): Promise<UserProfile> {
    try {
      let email = emailOrUsername;
      let isUsername = false;

      // Check if input is a valid email format
      if (!this.validateEmail(emailOrUsername)) {
        isUsername = true;
        // It's likely a username, find the user by username
        try {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("username", "==", emailOrUsername));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            throw new Error("auth/user-not-found");
          }

          // Get the email from the first matching user
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data() as UserProfile;
          email = userData.email;
        } catch (queryError: any) {
          // If query fails, it's likely a username that doesn't exist
          console.error("Error querying users by username:", queryError);
          throw new Error("auth/user-not-found");
        }
      }

      // Now sign in with the email
      return await this.signIn(email, password);
    } catch (error: any) {
      console.error("Error signing in with email or username:", error);
      throw this.handleAuthError(error);
    }
  }

  // Sign in user
  async signIn(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // Update last login
      const userRef = doc(db, "users", user.uid);
      try {
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;

          // Check if user is approved (only for non-admin users)
          if (userData.role === "user" && userData.isApproved === false) {
            throw new Error("auth/account-pending-approval");
          }

          // Update last login time
          await setDoc(
            userRef,
            {
              ...userData,
              lastLogin: new Date(),
            },
            { merge: true },
          );

          return {
            ...userData,
            lastLogin: new Date(),
          };
        } else {
          // Create user profile if it doesn't exist (for existing Firebase users)
          const userProfile: UserProfile = {
            uid: user.uid,
            fullName: user.displayName || "User",
            username: user.email?.split("@")[0] || "user",
            email: user.email || "",
            role: "user",
            createdAt: new Date(),
            lastLogin: new Date(),
            isApproved: false,
          };

          try {
            await setDoc(userRef, userProfile);
          } catch (writeErr: any) {
            // Defensive fallback: Firestore native error (Hermes) — allow login to succeed
            console.warn(
              "Firestore write failed when creating user profile after signIn. Returning auth-only profile.",
              writeErr,
            );
          }

          return userProfile;
        }
      } catch (fireErr: any) {
        // If Firestore throws the native assertion (Hermes getSize/HostFunction) we still want
        // the app to treat the user as signed in. Return a minimal profile built from auth user.
        const isHermesNative =
          typeof fireErr?.message === "string" &&
          (fireErr.message.includes("getSize") ||
            fireErr.message.includes("INTERNAL ASSERTION"));
        if (isHermesNative) {
          console.warn(
            "Detected Firestore native/Hermes error during signIn — returning fallback auth-only profile.",
            fireErr,
          );
          return {
            uid: user.uid,
            fullName: user.displayName || "User",
            username: user.email?.split("@")[0] || "user",
            email: user.email || "",
            role: "user",
            createdAt: new Date(),
            lastLogin: new Date(),
          } as UserProfile;
        }

        // Otherwise rethrow to be handled by outer catch
        throw fireErr;
      }
    } catch (error: any) {
      console.error("Error signing in:", error);
      throw this.handleAuthError(error);
    }
  }

  // Sign in anonymously (for testing purposes)
  async signInAnonymously(): Promise<{ uid: string; isAnonymous: boolean }> {
    try {
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      console.log("Anonymous user signed in:", user.uid);
      return {
        uid: user.uid,
        isAnonymous: user.isAnonymous,
      };
    } catch (error: any) {
      console.error("Error signing in anonymously:", error);
      throw this.handleAuthError(error);
    }
  }

  // Sign out user
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      console.log("User signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  }

  // Send password reset email
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log("Password reset email sent");
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      throw this.handleAuthError(error);
    }
  }

  // Get current user profile
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }

      return null;
    } catch (error) {
      console.error("Error getting current user profile:", error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");

      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, updates, { merge: true });

      // Update Firebase Auth profile if needed
      if (updates.fullName) {
        await updateProfile(user, {
          displayName: updates.fullName,
        });
      }

      console.log("User profile updated successfully");
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Await the current user (useful because auth.currentUser can be null briefly)
  async getCurrentUserAsync(timeoutMs = 5000): Promise<User | null> {
    // If already available, return immediately
    if (auth.currentUser) return auth.currentUser;

    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });

      // Timeout fallback
      setTimeout(() => {
        try {
          unsubscribe();
        } catch (e) {}
        resolve(auth.currentUser || null);
      }, timeoutMs);
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  // Handle authentication errors
  private handleAuthError(error: any): Error {
    let message = "An error occurred during authentication";

    switch (error.code) {
      case "auth/email-already-in-use":
        message = "This email address is already registered";
        break;
      case "auth/weak-password":
        message = "Password should be at least 6 characters";
        break;
      case "auth/invalid-email":
        message = "Invalid email address";
        break;
      case "auth/user-not-found":
        message = "No account found with this email or username";
        break;
      case "auth/wrong-password":
        message = "Incorrect password";
        break;
      case "auth/too-many-requests":
        message = "Too many failed attempts. Please try again later";
        break;
      case "auth/network-request-failed":
        message = "Network error. Please check your connection";
        break;
      case "auth/account-pending-approval":
        message =
          "Your account is pending approval by an administrator. Please come back later.";
        break;
      default:
        // If Firestore/Hermes native assertion shows up, give a clearer actionable hint
        const msg =
          (error && (error.message || (error.toString && error.toString()))) ||
          "";
        if (
          typeof msg === "string" &&
          (msg.includes("getSize") ||
            msg.includes("INTERNAL ASSERTION") ||
            msg.includes("HostFunction"))
        ) {
          message =
            "A native Firestore error occurred (Hermes incompatibility). Rebuild your Android app with the JSC engine or use a dev client built with JSC. See README or run: `eas build --profile development --platform android`.";
        } else {
          message = error.message || message;
        }
        break;
    }

    return new Error(message);
  }

  // Check username availability
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      // You might want to create a separate collection for usernames
      // or query the users collection by username field
      // For now, we'll assume it's available if no error occurs
      return true;
    } catch (error) {
      console.error("Error checking username availability:", error);
      return false;
    }
  }

  // Validate password strength
  validatePassword(password: string): { isValid: boolean; message: string } {
    if (password.length < 6) {
      return {
        isValid: false,
        message: "Password must be at least 6 characters long",
      };
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain both uppercase and lowercase letters",
      };
    }

    if (!/(?=.*\d)/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one number",
      };
    }

    return { isValid: true, message: "Password is strong" };
  }

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Handle phone number errors
  private handlePhoneAuthError(error: any): Error {
    let message = "An error occurred with phone authentication";

    if (typeof error === "string") {
      message = error;
    } else if (error.code) {
      switch (error.code) {
        case "auth/invalid-phone-number":
          message = "Invalid phone number format";
          break;
        case "auth/phone-number-already-exists":
          message = "This phone number is already registered";
          break;
        case "auth/invalid-verification-code":
          message = "Invalid verification code. Please try again";
          break;
        case "auth/session-expired":
          message = "Verification session expired. Please request a new code";
          break;
        case "auth/too-many-requests":
          message = "Too many verification attempts. Please try again later";
          break;
        default:
          message = error.message || message;
      }
    }

    return new Error(message);
  }

  // Create user as admin - used by admin panel to create new users
  async createUserAsAdmin(
    email: string,
    password: string,
    fullName: string,
    username: string,
    role: "user" | "employee" | "admin" | "superadmin" = "user",
    company: string = "",
  ): Promise<UserProfile> {
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, {
        displayName: fullName,
      });

      // Create user document in Firestore with specified role
      const userProfile: UserProfile = {
        uid: user.uid,
        fullName,
        username,
        email,
        role,
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      try {
        await setDoc(doc(db, "users", user.uid), {
          ...userProfile,
          company: company || "",
        });
        console.log("User created by admin successfully:", userProfile);
      } catch (fireErr: any) {
        // Defensive: Firestore native/Hermes bug may crash during setDoc (getSize HostFunction error)
        // Allow creation to succeed (auth user exists) but surface a helpful warning.
        console.warn(
          "Firestore write failed during createUserAsAdmin; proceeding with auth-only profile",
          fireErr,
        );
      }

      return userProfile;
    } catch (error: any) {
      console.error("Error creating user as admin:", error);
      throw this.handleAuthError(error);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
