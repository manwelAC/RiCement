import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';

export default function Header() {
  const router = useRouter();

  return (
    <View style={styles.navbar}>
      <View style={styles.navContent}>
        <Pressable 
          onPress={() => router.push('/(admin)/landing')}
          style={styles.brandContainer}
        >
          <View style={styles.logo}>
            <Image
              source={require('../../public/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>RiCement</Text>
          </View>
        </Pressable>
        
        <View style={styles.navLinks}>
          <Pressable 
            onPress={() => router.push('/(admin)/landing')} 
            style={({ pressed }) => [
              styles.navLink,
              pressed && styles.navLinkPressed
            ]}
          >
            <Text style={styles.navLinkText}>Home</Text>
          </Pressable>
          <Pressable 
            onPress={() => router.push('/(admin)/features')} 
            style={({ pressed }) => [
              styles.navLink,
              pressed && styles.navLinkPressed
            ]}
          >
            <Text style={styles.navLinkText}>Key Features</Text>
          </Pressable>
          <Pressable 
            onPress={() => router.push('/(admin)/how-it-works')} 
            style={({ pressed }) => [
              styles.navLink,
              pressed && styles.navLinkPressed
            ]}
          >
            <Text style={styles.navLinkText}>How It Works</Text>
          </Pressable>
          <Pressable 
            onPress={() => router.push('/(admin)/landing')}
            style={({ pressed }) => [
              styles.navLink,
              pressed && styles.navLinkPressed
            ]}
          >
            <Text style={styles.navLinkText}>About Us   </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 122, 255, 0.08)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    position: 'sticky' as any,
    top: 0,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1400,
    marginHorizontal: 'auto' as any,
    width: '100%' as any,
  },
  logo: {
    flex: 0,
    flexDirection: 'row' as any,
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 0.3,
  },
  brandContainer: {
    paddingHorizontal: 8,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
    flex: 1,
    paddingLeft: 32,
  },
  navLink: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  navLinkPressed: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  navLinkText: {
    fontSize: 14,
    color: '#222',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  loginButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    borderRadius: 10,
    backgroundColor: '#fff',
    marginLeft: 12,
  },
  loginButtonPressed: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  loginButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
