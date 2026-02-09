import GlobalAIChat from '@/components/GlobalAIChat';
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { auth } from '@/config/firebase';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, useFocusEffect, useRootNavigationState, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isRoleLoaded, setIsRoleLoaded] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('');
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Listen to Firebase authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('===== Firebase onAuthStateChanged =====');
      console.log('Firebase user:', firebaseUser ? firebaseUser.email : 'No user logged in');
      
      if (firebaseUser) {
        // Firebase says user is authenticated - load user role from AsyncStorage
        console.log('User authenticated with Firebase:', firebaseUser.email);
        checkUserRole();
      } else {
        // Firebase says no one is logged in - clear AsyncStorage
        console.log('No Firebase user - clearing AsyncStorage');
        await AsyncStorage.removeItem('currentUser');
        setUserRole(null);
        setIsRoleLoaded(true);
        // Don't automatically redirect - let the home page display
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  // If superadmin, navigate to admin tab immediately
  useEffect(() => {
    if (isRoleLoaded && userRole === 'superadmin') {
      router.push('/(tabs)/admin');
    }
  }, [isRoleLoaded, userRole]);

  // Force check role when tabs screen comes into focus
  useFocusEffect(
    useCallback(() => {
      checkUserRole();
    }, [])
  );

  useEffect(() => {
    if (!navigationState?.routes) return;

    const tabsRoute = navigationState.routes.find((route: any) => route.name === '(tabs)');
    if (tabsRoute?.state?.routes) {
      const currentIndex = tabsRoute.state.index;
      if (typeof currentIndex === 'number' && currentIndex >= 0) {
        const currentRouteName = tabsRoute.state.routes[currentIndex]?.name || '';
        setCurrentRoute(currentRouteName);
      }
    }
  }, [navigationState]);

  const checkUserRole = async () => {
    try {
      const userData = await AsyncStorage.getItem('currentUser');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('===== checkUserRole called =====');
        console.log('User data from AsyncStorage:', JSON.stringify(user));
        console.log('User role:', user.role);
        console.log('User email:', user.email);
        // Use the role field from local storage for faster check
        setUserRole(user.role || null);
      } else {
        console.log('===== checkUserRole: No user data in AsyncStorage =====');
        setUserRole(null);
      }
      setIsRoleLoaded(true); // Always mark as loaded after check
    } catch (error) {
      console.error('Error checking user role in tab layout:', error);
      setUserRole(null);
      setIsRoleLoaded(true);
    }
  };

  // Check if should show admin tab (only for admin or superadmin role)
  const showAdminTab = userRole === 'admin' || userRole === 'superadmin';

  // Check if should show controller tab (only for admin or employee role)
  const showControllerTab = userRole === 'admin' || userRole === 'employee';

  console.log('=== TabLayout Render ===');
  console.log('userRole:', userRole);
  console.log('isRoleLoaded:', isRoleLoaded);
  console.log('showAdminTab:', showAdminTab);
  console.log('showControllerTab:', showControllerTab);
  console.log('=====================');

  // Don't render tabs until we've loaded the role
  if (!isRoleLoaded) {
    console.log('Role not loaded yet, showing loading screen');
    return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#0066FF',
          tabBarInactiveTintColor: '#fff',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: {
            backgroundColor: '#2A3950',
            borderTopWidth: 0,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            href: null,
            tabBarStyle: { display: 'none' },
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Home',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
            // Hide from superadmin
            href: userRole === 'superadmin' ? null : undefined,
          }}
        />
        <Tabs.Screen
          name="process"
          options={{
            title: 'Projects',
            tabBarLabel: 'Projects',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
            ),
            // Hide from superadmin
            href: userRole === 'superadmin' ? null : undefined,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="controller"
          options={{
            title: 'Controller',
            tabBarLabel: 'Controller',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'hardware-chip' : 'hardware-chip-outline'} size={24} color={color} />
            ),
            // Hide tab button for non-admin/employee users
            href: (userRole === 'admin' || userRole === 'employee') ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarLabel: 'Admin',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'shield' : 'shield-outline'} size={24} color={color} />
            ),
            // Hide tab button for non-admin users
            href: (userRole === 'admin' || userRole === 'superadmin') ? undefined : null,
          }}
        />
      </Tabs>

      {/* Global AI Chat - hidden on admin and controller pages */}
      {currentRoute !== 'admin' && currentRoute !== 'controller' && <GlobalAIChat />}
    </View>
  );
}
