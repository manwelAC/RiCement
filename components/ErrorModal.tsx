import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface ErrorModalProps {
  visible: boolean;
  title?: string;
  message: string;
  onDismiss: () => void;
  errorCode?: string;
}

// Firebase error code to user-friendly message mapping
const getErrorMessage = (
  errorCode: string,
  defaultMessage: string
): { title: string; message: string } => {
  const errorMap: Record<
    string,
    { title: string; message: string }
  > = {
    'auth/invalid-email': {
      title: 'Invalid Email',
      message: 'Please enter a valid email address.',
    },
    'auth/user-disabled': {
      title: 'Account Disabled',
      message: 'This account has been disabled. Contact support for help.',
    },
    'auth/user-not-found': {
      title: 'User Not Found',
      message: 'No account exists with this email or username.',
    },
    'auth/wrong-password': {
      title: 'Incorrect Password',
      message: 'The password you entered is incorrect.',
    },
    'auth/too-many-requests': {
      title: 'Too Many Attempts',
      message:
        'Too many login attempts. Please try again later or reset your password.',
    },
    'auth/invalid-credential': {
      title: 'Invalid Credentials',
      message: 'The email or password you entered is incorrect.',
    },
    'auth/operation-not-allowed': {
      title: 'Login Disabled',
      message: 'This login method is not available. Please contact support.',
    },
    'auth/network-request-failed': {
      title: 'Network Error',
      message: 'No internet connection. Please check your network.',
    },
  };

  // Extract error code from Firebase error message if not provided
  let codeToUse = errorCode;
  if (!codeToUse && defaultMessage) {
    const match = defaultMessage.match(/\(([^)]+)\)/);
    if (match) {
      codeToUse = match[1];
    }
  }

  // Check if errorCode exists in our map
  if (codeToUse && errorMap[codeToUse]) {
    return errorMap[codeToUse];
  }

  // Check if the default message contains common error patterns
  if (defaultMessage.toLowerCase().includes('user not found')) {
    return {
      title: 'User Not Found',
      message: 'No account exists with this email or username.',
    };
  }
  if (
    defaultMessage.toLowerCase().includes('wrong password') ||
    defaultMessage.toLowerCase().includes('incorrect password')
  ) {
    return {
      title: 'Incorrect Password',
      message: 'The password you entered is incorrect.',
    };
  }
  if (defaultMessage.toLowerCase().includes('invalid credential')) {
    return {
      title: 'Invalid Credentials',
      message: 'The email or password you entered is incorrect.',
    };
  }

  // Fallback to default
  return {
    title: 'Login Error',
    message: defaultMessage,
  };
};

export function ErrorModal({
  visible,
  message,
  onDismiss,
  errorCode,
}: ErrorModalProps) {
  const [scaleAnim] = useState(new Animated.Value(0.8));

  const errorInfo = getErrorMessage(errorCode || '', message);

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 8,
      }).start();
    } else {
      scaleAnim.setValue(0.8);
    }
  }, [visible, scaleAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onDismiss}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Pressable style={styles.modal} onPress={() => {}}>
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle" size={60} color="#FF3B30" />
            </View>

            {/* Title */}
            <Text style={styles.title}>{errorInfo.title}</Text>

            {/* Message */}
            <Text style={styles.message}>{errorInfo.message}</Text>

            {/* Dismiss Button */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={onDismiss}
            >
              <Text style={styles.buttonText}>OK</Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Dimensions.get('window').width - 60,
    maxWidth: 320,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#3498DB',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: '#2980B9',
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
