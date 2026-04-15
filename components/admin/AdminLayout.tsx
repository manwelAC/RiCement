// Admin Layout Component
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { adminService } from '../../services/adminService';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await adminService.adminLogout();
      router.replace('/(admin)/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigateTo = (path: string) => {
    router.push(path as any);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logo}>RiCement Admin</Text>
          </View>
          <View style={styles.nav}>
            <Pressable 
              style={[styles.navItem, title === 'Dashboard' && styles.navItemActive]} 
              onPress={() => navigateTo('/(admin)/dashboard')}
            >
              <Text style={[styles.navText, title === 'Dashboard' && styles.navTextActive]}>
                Dashboard
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.navItem, title === 'Projects' && styles.navItemActive]} 
              onPress={() => navigateTo('/(admin)/projects')}
            >
              <Text style={[styles.navText, title === 'Projects' && styles.navTextActive]}>
                Projects
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.navItem, title === 'Users' && styles.navItemActive]} 
              onPress={() => navigateTo('/(admin)/users')}
            >
              <Text style={[styles.navText, title === 'Users' && styles.navTextActive]}>
                Users
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.navItem, title === 'Complaints' && styles.navItemActive]} 
              onPress={() => navigateTo('/(admin)/complaints')}
            >
              <Text style={[styles.navText, title === 'Complaints' && styles.navTextActive]}>
                Complaints
              </Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    cursor: 'pointer' as any,
  },
  navItemActive: {
    backgroundColor: '#007AFF',
  },
  navText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  navTextActive: {
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  logoutButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#f44336',
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 32,
  },
});
