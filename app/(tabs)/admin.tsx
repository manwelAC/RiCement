import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { db } from '@/config/firebase';
import { adminService, SuperadminAnalytics } from '@/services/adminService';
import { firebaseService } from '@/services/firebaseService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

interface User {
  id: string;
  email: string;
  fullName?: string;
  company?: string;
  role: 'user' | 'employee' | 'admin' | 'superadmin';
  createdAt: string;
  isActive: boolean;
}

interface Company {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  totalAdmins?: number;
  totalUsers?: number;
}

export default function AdminScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'companies' | 'pending'>('analytics');
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    role: 'user' as 'user' | 'employee' | 'admin' | 'superadmin',
  });
  
  // Pending users state
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loadingPendingUsers, setLoadingPendingUsers] = useState(false);
  const [approvingUser, setApprovingUser] = useState<string | null>(null);
  
  // Companies state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [isCreateCompanyModalVisible, setIsCreateCompanyModalVisible] = useState(false);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [createCompanyForm, setCreateCompanyForm] = useState({
    name: '',
    description: '',
  });
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isViewCompanyModalVisible, setIsViewCompanyModalVisible] = useState(false);
  const [isViewAllCompaniesModalVisible, setIsViewAllCompaniesModalVisible] = useState(false);
  
  // Edit user role modal
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<'user' | 'employee' | 'admin' | 'superadmin'>('user');
  const [editingFullName, setEditingFullName] = useState('');
  const [editingEmail, setEditingEmail] = useState('');
  const [editingCompany, setEditingCompany] = useState('');
  const [editingIsActive, setEditingIsActive] = useState(true);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  
  // Company dropdown state
  const [isCreateCompanyDropdownOpen, setIsCreateCompanyDropdownOpen] = useState(false);
  const [createCompanySearchQuery, setCreateCompanySearchQuery] = useState('');
  const [isEditCompanyDropdownOpen, setIsEditCompanyDropdownOpen] = useState(false);
  const [editCompanySearchQuery, setEditCompanySearchQuery] = useState('');
  
  // Delete user state
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  
  // View user modal
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  
  // Action menu visibility
  const [menuVisibleForUserId, setMenuVisibleForUserId] = useState<string | null>(null);

  // Animation values
  const [menuScaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(100));

  // Superadmin Analytics state
  const [analyticsData, setAnalyticsData] = useState<SuperadminAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('currentUser');
      if (!userData) {
        console.log('No user data found in AsyncStorage');
        setLoading(false);
        setIsAdmin(false);
        return;
      }

      const user = JSON.parse(userData);
      console.log('User data loaded:', user);
      console.log('User role from storage:', user.role);
      setCurrentUser(user);

      // Check the role field directly from local storage
      if (user.role === 'admin' || user.role === 'superadmin') {
        console.log('User has admin/superadmin role in local storage');
        setIsAdmin(true);
        loadUsers(user);
        // Set initial tab based on role
        if (user.role === 'superadmin') {
          setActiveTab('analytics');
          loadAnalytics();
          loadCompanies();
        } else {
          // For regular admins, start with users tab
          setActiveTab('users');
        }
        return;
      }

      // User is not an admin - redirect to dashboard
      console.log('User is not an admin - redirecting to dashboard');
      setIsAdmin(false);
      setLoading(false);
      // Redirect after a short delay to allow UI to update
      setTimeout(() => {
        router.replace('/(tabs)/dashboard');
      }, 500);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setLoading(false);
      setIsAdmin(false);
      // Redirect on error
      setTimeout(() => {
        router.replace('/(tabs)/dashboard');
      }, 500);
    }
  };

  const loadUsers = async (userToCheck?: any) => {
    try {
      setLoading(true);
      const usersQuery = query(collection(db, 'users'));
      const snapshot = await getDocs(usersQuery);

      let usersList: User[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email || '',
          fullName: data.fullName || 'N/A',
          company: data.company || 'N/A',
          role: data.role || 'user',
          createdAt: data.createdAt || new Date().toISOString(),
          isActive: data.isActive !== false,
        };
      });

      // If current user is admin (not superadmin) with a company, filter to show only users from their company
      const adminUser = userToCheck || currentUser;
      if (adminUser?.role === 'admin' && adminUser?.company) {
        usersList = usersList.filter(user => user.company === adminUser.company);
      }
      // Superadmin sees all users, no filtering needed

      usersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setUsers(usersList);
    } catch (error: any) {
      console.error('Error loading users:', error);
      Alert.alert('Error', `Failed to load users: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const companiesList = await firebaseService.getCompanies();
      setCompanies(companiesList);
    } catch (error: any) {
      console.error('Error loading companies:', error);
      Alert.alert('Error', `Failed to load companies: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const analytics = await adminService.getSuperadminAnalytics();
      setAnalyticsData(analytics);
      setLastRefreshTime(new Date());
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      Alert.alert('Error', `Failed to load analytics: ${error?.message || 'Unknown error'}`);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadPendingUsers = async () => {
    try {
      setLoadingPendingUsers(true);
      const usersQuery = query(collection(db, 'users'), where('isApproved', '==', false));
      const snapshot = await getDocs(usersQuery);

      let pendingUsersList: User[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email || '',
          fullName: data.fullName || 'N/A',
          company: data.company || 'N/A',
          role: data.role || 'user',
          createdAt: data.createdAt || new Date().toISOString(),
          isActive: data.isActive !== false,
        };
      });

      // If current user is admin (not superadmin) with a company, filter to show only users from their company
      if (currentUser?.role === 'admin' && currentUser?.company) {
        pendingUsersList = pendingUsersList.filter(user => user.company === currentUser.company);
      }

      pendingUsersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPendingUsers(pendingUsersList);
    } catch (error: any) {
      console.error('Error loading pending users:', error);
      Alert.alert('Error', `Failed to load pending users: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoadingPendingUsers(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    setApprovingUser(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        isApproved: true
      });
      
      Alert.alert('Success', 'User account has been approved');
      loadPendingUsers();
    } catch (error: any) {
      console.error('Error approving user:', error);
      Alert.alert('Error', `Failed to approve user: ${error?.message || 'Unknown error'}`);
    } finally {
      setApprovingUser(null);
    }
  };

  const handleRejectUser = async (userId: string) => {
    Alert.alert(
      'Reject Account',
      'Are you sure you want to reject this account? This will delete the user.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', userId));
              Alert.alert('Success', 'User account has been rejected and deleted');
              loadPendingUsers();
            } catch (error: any) {
              console.error('Error rejecting user:', error);
              Alert.alert('Error', `Failed to reject user: ${error?.message || 'Unknown error'}`);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleCreateCompany = async () => {
    if (!createCompanyForm.name.trim()) {
      Alert.alert('Error', 'Please enter a company name');
      return;
    }

    try {
      setIsCreatingCompany(true);
      
      await firebaseService.createCompany(
        createCompanyForm.name.trim(),
        createCompanyForm.description.trim(),
        currentUser.uid
      );

      Alert.alert(
        'Success',
        `Company "${createCompanyForm.name}" created successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setIsCreateCompanyModalVisible(false);
              setCreateCompanyForm({ name: '', description: '' });
              loadCompanies();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating company:', error);
      Alert.alert('Error', `Failed to create company: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsCreatingCompany(false);
    }
  };

  const handleDeleteCompany = (company: Company) => {
    Alert.alert(
      'Delete Company',
      `Are you sure you want to delete "${company.name}"?\n\nThis will also delete all users and admins in this company.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseService.deleteCompany(company.id);
              Alert.alert('Success', 'Company deleted successfully');
              loadCompanies();
            } catch (error: any) {
              Alert.alert('Error', `Failed to delete company: ${error?.message}`);
            }
          }
        }
      ]
    );
  };

  // Open create user modal with appropriate default role based on user type
  const openCreateUserModal = () => {
    const defaultRole = currentUser?.role === 'admin' ? 'employee' : 'user';
    setCreateForm({
      fullName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      company: '',
      role: defaultRole as 'user' | 'employee' | 'admin' | 'superadmin',
    });
    setIsCreateModalVisible(true);
  };

  const handleCreateUser = async () => {
    if (!createForm.fullName || !createForm.username || !createForm.email || !createForm.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Determine company based on role
    let userCompany = '';
    if (currentUser?.role === 'superadmin') {
      // Superadmin creating user - company is required
      userCompany = createForm.company.trim();
      if (!userCompany) {
        Alert.alert('Error', 'Please specify a company');
        return;
      }
    } else if (currentUser?.role === 'admin') {
      // Admin creating user - use their company
      userCompany = currentUser?.company || '';
      if (!userCompany) {
        Alert.alert('Error', 'You must have a company assigned to create users');
        return;
      }
    } else {
      // Regular user shouldn't reach here
      userCompany = createForm.company.trim();
    }

    if (createForm.password !== createForm.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (createForm.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      setIsCreatingUser(true);

      await adminService.createUser(
        createForm.email.trim(),
        createForm.password,
        createForm.fullName.trim(),
        createForm.username.trim(),
        createForm.role,
        userCompany
      );

      Alert.alert(
        'Success',
        `User "${createForm.fullName}" created successfully as ${createForm.role}!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setIsCreateModalVisible(false);
              setCreateForm({
                fullName: '',
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                company: '',
                role: 'user',
              });
              loadUsers();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errorMessage = error?.message || 'Unknown error';

      if (errorMessage.includes('email-already-in-use')) {
        Alert.alert('Error', 'This email is already registered');
      } else if (errorMessage.includes('weak-password')) {
        Alert.alert('Error', 'Password is too weak. Please use a stronger password');
      } else if (errorMessage.includes('invalid-email')) {
        Alert.alert('Error', 'Invalid email address');
      } else {
        Alert.alert('Error', `Failed to create user: ${errorMessage}`);
      }
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleEditUserRole = (user: User) => {
    // Prevent admins from editing users outside their company
    if (currentUser?.role === 'admin' && currentUser?.company !== user.company) {
      Alert.alert('Error', 'You can only edit users from your own company');
      return;
    }

    setEditingUser(user);
    setEditingRole(user.role);
    setEditingFullName(user.fullName || '');
    setEditingEmail(user.email);
    setEditingCompany(user.company || '');
    setEditingIsActive(user.isActive);
    setIsEditModalVisible(true);
  };

  const handleSaveUserRole = async () => {
    if (!editingUser) return;

    if (!editingFullName.trim() || !editingEmail.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setIsUpdatingRole(true);
      
      const updateData: any = {
        role: editingRole,
        fullName: editingFullName.trim(),
        email: editingEmail.trim(),
        isActive: editingIsActive,
        updatedAt: new Date().toISOString(),
      };

      // Only update company if not an admin, or if admin is updating their own company users
      if (currentUser?.role !== 'admin' || editingCompany) {
        updateData.company = editingCompany.trim();
      }

      await updateDoc(doc(db, 'users', editingUser.id), updateData);

      Alert.alert(
        'Success',
        `${editingFullName} has been updated!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setIsEditModalVisible(false);
              setEditingUser(null);
              loadUsers();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error updating user:', error);
      Alert.alert('Error', `Failed to update user: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    // Prevent admins from deleting users outside their company
    if (currentUser?.role === 'admin' && currentUser?.company !== user.company) {
      Alert.alert('Error', 'You can only delete users from your own company');
      setMenuVisibleForUserId(null);
      return;
    }

    setMenuVisibleForUserId(null);
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete "${user.email}"?\n\nThis will:\n• Remove the user profile from database\n• Auth record will remain (manually delete from Firebase Console if needed)`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => performDeleteUser(user),
          style: 'destructive',
        },
      ]
    );
  };

  const performDeleteUser = async (user: User) => {
    try {
      setIsDeletingUser(true);
      await deleteDoc(doc(db, 'users', user.id));
      
      Alert.alert(
        'Success',
        `User "${user.email}" has been deleted.`,
        [
          {
            text: 'OK',
            onPress: () => {
              loadUsers();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error deleting user:', error);
      Alert.alert('Error', `Failed to delete user: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Helper function to check if admin can manage a user
  const canAdminManageUser = (user: User): boolean => {
    // Superadmins can manage anyone
    if (currentUser?.role === 'superadmin') return true;
    // Admins can only manage users in their company
    if (currentUser?.role === 'admin') {
      return currentUser?.company === user.company;
    }
    return false;
  };

  // Helper function to handle unauthorized access attempts
  const showUnauthorizedCompanyAccess = () => {
    Alert.alert('Access Denied', 'You can only manage users from your own company');
  };

  // Helper functions for company dropdown
  const getFilteredCompanies = (searchText: string) => {
    if (!searchText.trim()) return companies;
    return companies.filter(company =>
      company.name.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  const filteredCreateCompanies = getFilteredCompanies(createCompanySearchQuery);
  const filteredEditCompanies = getFilteredCompanies(editCompanySearchQuery);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Show not authorized message if not admin
  if (!loading && !isAdmin) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <Ionicons name="lock-closed-outline" size={80} color="#FF3B30" />
        </ThemedView>
        <ScrollView style={styles.content}>
          <ThemedView style={styles.section}>
            <ThemedText style={styles.notAuthorizedTitle}>Access Denied</ThemedText>
            <ThemedText style={styles.notAuthorizedText}>
              You do not have manager privileges to access this feature. Only managers and super managers can manage users.
            </ThemedText>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={styles.loadingText}>Loading manager panel...</ThemedText>
      </ThemedView>
    );
  }

  // Render superadmin dashboard with tabs
  if (currentUser?.role === 'superadmin') {
    if (loading) {
      return (
        <ThemedView style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>Loading manager panel...</ThemedText>
        </ThemedView>
      );
    }

    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.headerTitle}>Manager Panel</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Master Administration</ThemedText>
        </ThemedView>

        {/* Superadmin Tabs */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
            onPress={() => {
              setActiveTab('analytics');
              if (!analyticsData) loadAnalytics();
              if (companies.length === 0) loadCompanies();
            }}
          >
            <Ionicons
              name="bar-chart"
              size={20}
              color={activeTab === 'analytics' ? '#007AFF' : '#666'}
            />
            <ThemedText style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
              Analytics
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === 'users' && styles.activeTab]}
            onPress={() => setActiveTab('users')}
          >
            <Ionicons
              name="people"
              size={20}
              color={activeTab === 'users' ? '#007AFF' : '#666'}
            />
            <ThemedText style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
              Users
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === 'companies' && styles.activeTab]}
            onPress={() => setActiveTab('companies')}
          >
            <Ionicons
              name="business"
              size={20}
              color={activeTab === 'companies' ? '#007AFF' : '#666'}
            />
            <ThemedText style={[styles.tabText, activeTab === 'companies' && styles.activeTabText]}>
              Companies
            </ThemedText>
          </Pressable>

          {/* Pending Accounts Tab - Only for Admin, not Superadmin */}
          {currentUser?.role === 'admin' && (
            <Pressable
              style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
              onPress={() => {
                setActiveTab('pending');
                if (pendingUsers.length === 0) loadPendingUsers();
              }}
            >
              <Ionicons
                name="hourglass"
                size={20}
                color={activeTab === 'pending' ? '#007AFF' : '#666'}
              />
              <ThemedText style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
                Pending
              </ThemedText>
            </Pressable>
          )}
        </View>

        {/* Analytics Tab Content */}
        {activeTab === 'analytics' && (
          analyticsLoading && !analyticsData ? (
            <ThemedView style={[styles.container, styles.centerContent]}>
              <ActivityIndicator size="large" color="#007AFF" />
              <ThemedText style={styles.loadingText}>Loading analytics...</ThemedText>
            </ThemedView>
          ) : (
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
              <ThemedView style={styles.header} lightColor='transparent' darkColor='transparent'>
                <View style={styles.headerTopRow}>
                  <ThemedText style={styles.analyticsTitle}>System Analytics</ThemedText>
                  <Pressable onPress={loadAnalytics} disabled={analyticsLoading}>
                    <Ionicons name="refresh" size={24} color="#007AFF" style={{ opacity: analyticsLoading ? 0.5 : 1 }} />
                  </Pressable>
                </View>
                {lastRefreshTime && (
                  <ThemedText style={styles.lastRefreshText}>
                    Last updated: {lastRefreshTime.toLocaleTimeString()}
                  </ThemedText>
                )}
              </ThemedView>

              <ThemedView style={styles.analyticsContent} lightColor='transparent' darkColor='transparent'>
                {/* Core Metrics Grid */}
                <View style={styles.metricsGrid}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.metricCard,
                      pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
                    ]}
                    onPress={() => setIsViewAllCompaniesModalVisible(true)}
                  >
                    <Ionicons name="business" size={32} color="#007AFF" />
                    <ThemedText style={styles.metricValue} lightColor="#1C1C1E" darkColor="#1C1C1E">{analyticsData?.totalCompanies || 0}</ThemedText>
                    <ThemedText style={styles.metricLabel}>Companies</ThemedText>
                  </Pressable>

                  <View style={styles.metricCard}>
                    <Ionicons name="people" size={32} color="#34C759" />
                    <ThemedText style={styles.metricValue} lightColor="#1C1C1E" darkColor="#1C1C1E">{analyticsData?.totalUsers || 0}</ThemedText>
                    <ThemedText style={styles.metricLabel}>Total Users</ThemedText>
                  </View>

                  <View style={styles.metricCard}>
                    <Ionicons name="cube" size={32} color="#FF9500" />
                    <ThemedText style={styles.metricValue} lightColor="#1C1C1E" darkColor="#1C1C1E">{analyticsData?.totalRHBBlocks || 0}</ThemedText>
                    <ThemedText style={styles.metricLabel}>RHB Blocks</ThemedText>
                  </View>

                  <View style={styles.metricCard}>
                    <Ionicons name="checkmark-circle" size={32} color="#5AC8FA" />
                    <ThemedText style={styles.metricValue} lightColor="#1C1C1E" darkColor="#1C1C1E">{analyticsData?.completedProjects || 0}</ThemedText>
                    <ThemedText style={styles.metricLabel}>Completed</ThemedText>
                  </View>
                </View>

                {/* Quick Stats Section */}
                {analyticsData && (
                  <View style={styles.quickStatsSection}>
                    <ThemedText style={styles.sectionTitle}>Quick Stats</ThemedText>
                    <View style={styles.quickStatRow}>
                      <View style={styles.quickStatItem}>
                        <ThemedText style={styles.quickStatLabel}>Completed</ThemedText>
                        <ThemedText style={styles.quickStatValue} lightColor="#1C1C1E" darkColor="#1C1C1E">{analyticsData.completedProjects}</ThemedText>
                      </View>
                      <View style={styles.quickStatItem}>
                        <ThemedText style={styles.quickStatLabel}>Pending Projects</ThemedText>
                        <ThemedText style={styles.quickStatValue} lightColor="#1C1C1E" darkColor="#1C1C1E">{analyticsData.pendingProjects}</ThemedText>
                      </View>
                    </View>
                  </View>
                )}

              </ThemedView>
            </ScrollView>
          )
        )}

        {/* Users and Companies tabs - render the admin UI below */}
        {(activeTab === 'users' || activeTab === 'companies') && (
          <>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
              {/* USERS TAB */}
              {activeTab === 'users' && (
                <>
            {/* Create User Button */}
            <Pressable
              style={({ pressed }) => [
                styles.createButton,
                pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
              ]}
              onPress={openCreateUserModal}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <ThemedText style={styles.createButtonText}>Create New User</ThemedText>
            </Pressable>

            {/* User Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <ThemedText style={styles.statValue}>{users.length}</ThemedText>
                <ThemedText style={styles.statLabel}>Total Users</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText style={styles.statValue}>{users.filter(u => u.role === 'admin').length}</ThemedText>
            <ThemedText style={styles.statLabel}>Admins</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{users.filter(u => u.isActive).length}</ThemedText>
            <ThemedText style={styles.statLabel}>Active</ThemedText>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by email or name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Users List */}
        <View style={styles.usersSection}>
          <ThemedText style={styles.sectionTitle}>Users ({filteredUsers.length})</ThemedText>

          {filteredUsers.length === 0 ? (
            <ThemedView style={styles.emptyState}>
              <Ionicons name="person-outline" size={48} color="#999" />
              <ThemedText style={styles.emptyStateText}>
                {searchQuery ? 'No users found' : 'No users yet'}
              </ThemedText>
            </ThemedView>
          ) : (
            <View style={{ position: 'relative', zIndex: 1 }}>
              {filteredUsers.map((user) => (
                <View key={user.id}>
                  <View style={styles.userCard}>
                    <View style={styles.userInfo}>
                      <ThemedText style={styles.userName} numberOfLines={1}>
                        {user.fullName}
                      </ThemedText>
                      <ThemedText style={styles.userEmail} numberOfLines={1}>
                        {user.email}
                      </ThemedText>
                    </View>
                    <View style={styles.userMeta}>
                      <View
                        style={[
                          styles.roleBadge,
                          { backgroundColor: user.role === 'admin' ? '#FF9500' : '#007AFF' },
                        ]}
                      >
                        <ThemedText style={styles.roleBadgeText}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </ThemedText>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: user.isActive ? '#34C759' : '#FF3B30' },
                        ]}
                      >
                        <ThemedText style={styles.statusBadgeText}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </ThemedText>
                      </View>
                      <Pressable
                        style={styles.menuButton}
                        onPress={() => {
                          const newVisibility = menuVisibleForUserId === user.id ? null : user.id;
                          setMenuVisibleForUserId(newVisibility);
                          if (newVisibility) {
                            Animated.spring(menuScaleAnim, {
                              toValue: 1,
                              useNativeDriver: true,
                              speed: 12,
                              bounciness: 8,
                            }).start();
                          } else {
                            Animated.timing(menuScaleAnim, {
                              toValue: 0,
                              duration: 150,
                              useNativeDriver: true,
                            }).start();
                          }
                        }}
                      >
                        <Ionicons name="ellipsis-vertical" size={20} color="#007AFF" />
                      </Pressable>
                    </View>
                  </View>
                  
                  {/* Action Menu - Outside userCard for proper z-index */}
                  {menuVisibleForUserId === user.id && (
                    <Animated.View
                      style={[
                        styles.actionMenu,
                        { zIndex: 1000 },
                        {
                          transform: [{ scale: menuScaleAnim }],
                          opacity: menuScaleAnim,
                        },
                      ]}
                    >
                      <Pressable
                        style={({ pressed }) => [
                          styles.actionMenuItem,
                          pressed && { opacity: 0.6, backgroundColor: '#f5f5f5' },
                        ]}
                        onPress={() => {
                          setViewingUser(user);
                          setIsViewModalVisible(true);
                          setMenuVisibleForUserId(null);
                        }}
                      >
                        <Ionicons name="eye" size={18} color="#007AFF" />
                        <ThemedText style={styles.actionMenuItemText}>View</ThemedText>
                      </Pressable>
                      <View style={styles.actionMenuDivider} />
                      <Pressable
                        style={({ pressed }) => [
                          styles.actionMenuItem,
                          pressed && { opacity: 0.6, backgroundColor: '#f5f5f5' },
                        ]}
                        onPress={() => {
                          handleEditUserRole(user);
                          setMenuVisibleForUserId(null);
                        }}
                      >
                        <Ionicons name="pencil" size={18} color="#FF9500" />
                        <ThemedText style={[styles.actionMenuItemText, { color: '#FF9500' }]}>Edit</ThemedText>
                      </Pressable>
                      <View style={styles.actionMenuDivider} />
                      <Pressable
                        style={({ pressed }) => [
                          styles.actionMenuItem,
                          pressed && { opacity: 0.6, backgroundColor: '#f5f5f5' },
                        ]}
                        onPress={() => {
                          handleDeleteUser(user);
                        }}
                      >
                        <Ionicons name="trash" size={18} color="#FF3B30" />
                        <ThemedText style={[styles.actionMenuItemText, { color: '#FF3B30' }]}>Delete</ThemedText>
                      </Pressable>
                    </Animated.View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
                </>
              )}

              {/* COMPANIES TAB */}
              {activeTab === 'companies' && (
                <>
                {/* Create Company Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.createButton,
                    pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                  ]}
                  onPress={() => setIsCreateCompanyModalVisible(true)}
                >
                  <Ionicons name="add-circle" size={24} color="#fff" />
                  <ThemedText style={styles.createButtonText}>Create New Company</ThemedText>
                </Pressable>

            {/* Companies Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <ThemedText style={styles.statValue}>{companies.length}</ThemedText>
                <ThemedText style={styles.statLabel}>Total Companies</ThemedText>
              </View>
            </View>

            {/* Companies List */}
            {loadingCompanies ? (
              <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
            ) : companies.length === 0 ? (
              <View style={styles.emptyStateCompanies}>
                <Ionicons name="business" size={48} color="#8E8E93" style={{ marginBottom: 12 }} />
                <ThemedText style={styles.emptyStateCompaniesText}>No companies yet</ThemedText>
              </View>
            ) : (
              <View>
                {companies.map((company) => (
                  <Pressable
                    key={company.id}
                    style={styles.companyCard}
                    onPress={() => {
                      setSelectedCompany(company);
                      setIsViewCompanyModalVisible(true);
                    }}
                  >
                    <View style={styles.companyCardHeader}>
                      <View style={styles.companyInfo_}>
                        <ThemedText style={styles.companyName}>{company.name}</ThemedText>
                        {company.description && (
                          <ThemedText style={styles.companyDescription}>{company.description}</ThemedText>
                        )}
                      </View>
                      <Pressable
                        style={styles.companyCardDeleteButton}
                        onPress={() => handleDeleteCompany(company)}
                      >
                        <Ionicons name="trash" size={20} color="#FF3333" />
                      </Pressable>
                    </View>
                    <View style={styles.companyStats}>
                      <View style={styles.companyStat}>
                        <Ionicons name="shield" size={16} color="#007AFF" />
                        <ThemedText style={styles.companyStatText}>{company.totalAdmins || 0} Managers</ThemedText>
                      </View>
                      <View style={styles.companyStat}>
                        <Ionicons name="person" size={16} color="#34C759" />
                        <ThemedText style={styles.companyStatText}>{company.totalUsers || 0} Users</ThemedText>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
                </>
              )}
            </ScrollView>
          </>
        )}

        {/* PENDING ACCOUNTS TAB - Admin Only */}
        {activeTab === 'pending' && currentUser?.role === 'admin' && (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
            {/* Pending Users Header */}
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Pending Account Approvals ({pendingUsers.length})</ThemedText>
              <Pressable onPress={loadPendingUsers} disabled={loadingPendingUsers}>
                <Ionicons name="refresh" size={20} color="#007AFF" style={{ opacity: loadingPendingUsers ? 0.5 : 1 }} />
              </Pressable>
            </View>

            {loadingPendingUsers && !pendingUsers.length ? (
              <ThemedView style={styles.emptyState}>
                <ActivityIndicator size="large" color="#007AFF" />
                <ThemedText style={styles.emptyStateText}>Loading pending accounts...</ThemedText>
              </ThemedView>
            ) : pendingUsers.length === 0 ? (
              <ThemedView style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color="#999" />
                <ThemedText style={styles.emptyStateText}>No pending approvals</ThemedText>
              </ThemedView>
            ) : (
              <View>
                {pendingUsers.map((user) => (
                  <View key={user.id} style={styles.pendingUserCard}>
                    <View style={styles.pendingUserHeader}>
                      <View style={styles.pendingUserInfo}>
                        <ThemedText style={styles.pendingUserName} numberOfLines={1}>
                          {user.fullName}
                        </ThemedText>
                        <ThemedText style={styles.pendingUserEmail}>{user.email}</ThemedText>
                        <ThemedText style={styles.pendingUserCompany}>Company: {user.company}</ThemedText>
                        <ThemedText style={styles.pendingUserCreated}>
                          Applied: {new Date(user.createdAt).toLocaleDateString()}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.pendingUserActions}>
                      <Pressable
                        style={[styles.approveButton, approvingUser === user.id && { opacity: 0.6 }]}
                        onPress={() => handleApproveUser(user.id)}
                        disabled={approvingUser !== null}
                      >
                        {approvingUser === user.id ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle" size={18} color="#fff" />
                            <ThemedText style={styles.actionButtonText}>Approve</ThemedText>
                          </>
                        )}
                      </Pressable>

                      <Pressable
                        style={styles.rejectButton}
                        onPress={() => handleRejectUser(user.id)}
                        disabled={approvingUser !== null}
                      >
                        <Ionicons name="close-circle" size={18} color="#fff" />
                        <ThemedText style={styles.actionButtonText}>Reject</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {/* View All Companies Modal (iOS Style) - Inside Superadmin */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isViewAllCompaniesModalVisible}
            onRequestClose={() => setIsViewAllCompaniesModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.iosModalContent}>
                <View style={styles.iosModalHeader}>
                  <ThemedText style={{ flex: 1 }}></ThemedText>
                  <ThemedText style={styles.iosModalTitle}>All Companies</ThemedText>
                  <Pressable
                    onPress={() => setIsViewAllCompaniesModalVisible(false)}
                    style={{ flex: 1, alignItems: 'flex-end' }}
                  >
                    <ThemedText style={styles.iosModalAction}>Done</ThemedText>
                  </Pressable>
                </View>

                <ScrollView
                  style={styles.iosModalBody}
                  showsVerticalScrollIndicator={false}
                  scrollEventThrottle={16}
                >
                  {companies.length === 0 ? (
                    <View style={styles.emptyStateCompanies}>
                      <Ionicons name="business" size={48} color="#8E8E93" style={{ marginBottom: 12 }} />
                      <ThemedText style={styles.emptyStateCompaniesText}>
                        No companies found
                      </ThemedText>
                    </View>
                  ) : (
                    <View>
                      {companies.map((company) => (
                        <View key={company.id} style={styles.companyListItem}>
                          <View style={styles.companyListHeader}>
                            <View style={styles.companyListInfo}>
                              <ThemedText style={styles.companyListName}>
                                {company.name}
                              </ThemedText>
                              {company.description && (
                                <ThemedText style={styles.companyListDescription}>
                                  {company.description}
                                </ThemedText>
                              )}
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                          </View>
                          <View style={styles.companyListStats}>
                            <View style={styles.companyListStatItem}>
                              <ThemedText style={styles.companyListStatLabel}>
                                Managers
                              </ThemedText>
                              <ThemedText style={styles.companyListStatValue}>
                                {company.totalAdmins || 0}
                              </ThemedText>
                            </View>
                            <View style={styles.companyListStatItem}>
                              <ThemedText style={styles.companyListStatLabel}>
                                Users
                              </ThemedText>
                              <ThemedText style={styles.companyListStatValue}>
                                {company.totalUsers || 0}
                              </ThemedText>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Create Company Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isCreateCompanyModalVisible}
            onRequestClose={() => setIsCreateCompanyModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>Create Company</ThemedText>
                  <Pressable onPress={() => setIsCreateCompanyModalVisible(false)}>
                    <Ionicons name="close-circle" size={32} color="#8E8E93" />
                  </Pressable>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
                  {/* Company Name */}
                  <View style={styles.formGroup}>
                    <ThemedText style={styles.label}>Company Name *</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., RiCement Industries"
                      placeholderTextColor="#999"
                      value={createCompanyForm.name}
                      onChangeText={(text) => setCreateCompanyForm({ ...createCompanyForm, name: text })}
                    />
                  </View>

                  {/* Description */}
                  <View style={styles.formGroup}>
                    <ThemedText style={styles.label}>Description</ThemedText>
                    <TextInput
                      style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                      placeholder="Company description (optional)"
                      placeholderTextColor="#999"
                      value={createCompanyForm.description}
                      onChangeText={(text) => setCreateCompanyForm({ ...createCompanyForm, description: text })}
                      multiline
                    />
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.submitButton,
                      pressed && { opacity: 0.8 },
                      isCreatingCompany && { opacity: 0.6 }
                    ]}
                    onPress={handleCreateCompany}
                    disabled={isCreatingCompany}
                  >
                    {isCreatingCompany ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <ThemedText style={styles.submitButtonText}>Create Company</ThemedText>
                    )}
                  </Pressable>
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Create User Modal - Inside Superadmin */}
          <Modal
            visible={isCreateModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setIsCreateModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>Create New User</ThemedText>
                  <Pressable onPress={() => setIsCreateModalVisible(false)}>
                    <Ionicons name="close-circle" size={32} color="#8E8E93" />
                  </Pressable>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
                  {/* Full Name */}
                  <View style={styles.formGroup}>
                    <ThemedText style={styles.label}>Full Name</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter full name"
                      placeholderTextColor="#999"
                      value={createForm.fullName}
                      onChangeText={(text) => setCreateForm({ ...createForm, fullName: text })}
                    />
                  </View>

                  {/* Username */}
                  <View style={styles.formGroup}>
                    <ThemedText style={styles.label}>Username</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter username"
                      placeholderTextColor="#999"
                      value={createForm.username}
                      onChangeText={(text) => setCreateForm({ ...createForm, username: text })}
                    />
                  </View>

                  {/* Company - Dropdown for Superadmin */}
                  <View style={styles.formGroup}>
                    <ThemedText style={styles.label}>Company *</ThemedText>
                    <Pressable
                      style={styles.dropdownButton}
                      onPress={() => setIsCreateCompanyDropdownOpen(!isCreateCompanyDropdownOpen)}
                    >
                      <ThemedText style={styles.dropdownButtonText}>
                        {createForm.company || 'Select a company'}
                      </ThemedText>
                      <Ionicons
                        name={isCreateCompanyDropdownOpen ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#007AFF"
                      />
                    </Pressable>

                    {isCreateCompanyDropdownOpen && (
                      <View style={styles.dropdownMenu}>
                        <TextInput
                          style={styles.dropdownSearch}
                          placeholder="Search companies..."
                          placeholderTextColor="#999"
                          value={createCompanySearchQuery}
                          onChangeText={setCreateCompanySearchQuery}
                        />
                        {filteredCreateCompanies.length === 0 ? (
                          <View style={styles.dropdownEmptyState}>
                            <ThemedText style={styles.dropdownEmptyText}>No companies found</ThemedText>
                          </View>
                        ) : (
                          <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                            {filteredCreateCompanies.map((company) => (
                              <Pressable
                                key={company.id}
                                style={({ pressed }) => [
                                  styles.dropdownItem,
                                  createForm.company === company.name && styles.dropdownItemSelected,
                                  pressed && { backgroundColor: '#f0f0f0' }
                                ]}
                                onPress={() => {
                                  setCreateForm({ ...createForm, company: company.name });
                                  setIsCreateCompanyDropdownOpen(false);
                                  setCreateCompanySearchQuery('');
                                }}
                              >
                                <ThemedText
                                  style={[
                                    styles.dropdownItemText,
                                    createForm.company === company.name && styles.dropdownItemTextSelected
                                  ]}
                                >
                                  {company.name}
                                </ThemedText>
                                {createForm.company === company.name && (
                                  <Ionicons name="checkmark" size={18} color="#007AFF" />
                                )}
                              </Pressable>
                            ))}
                          </ScrollView>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Email */}
                  <View style={styles.formGroup}>
                    <ThemedText style={styles.label}>Email Address</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter email address"
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={createForm.email}
                      onChangeText={(text) => setCreateForm({ ...createForm, email: text })}
                    />
                  </View>

                  {/* Password */}
                  <View style={styles.formGroup}>
                    <ThemedText style={styles.label}>Password</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter password (min 6 characters)"
                      placeholderTextColor="#999"
                      secureTextEntry
                      value={createForm.password}
                      onChangeText={(text) => setCreateForm({ ...createForm, password: text })}
                    />
                  </View>

                  {/* Confirm Password */}
                  <View style={styles.formGroup}>
                    <ThemedText style={styles.label}>Confirm Password</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm password"
                      placeholderTextColor="#999"
                      secureTextEntry
                      value={createForm.confirmPassword}
                      onChangeText={(text) => setCreateForm({ ...createForm, confirmPassword: text })}
                    />
                  </View>

                  {/* Role Selection */}
                  <View style={styles.formGroup}>
                    <ThemedText style={styles.label}>Role</ThemedText>
                    <View style={styles.roleOptions}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.roleOption,
                          createForm.role === 'user' && styles.roleOptionSelected,
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => setCreateForm({ ...createForm, role: 'user' })}
                      >
                        <Ionicons
                          name={createForm.role === 'user' ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={createForm.role === 'user' ? '#007AFF' : '#999'}
                        />
                        <ThemedText style={styles.roleOptionText}>Regular User</ThemedText>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [
                          styles.roleOption,
                          createForm.role === 'employee' && styles.roleOptionSelected,
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => setCreateForm({ ...createForm, role: 'employee' })}
                      >
                        <Ionicons
                          name={createForm.role === 'employee' ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={createForm.role === 'employee' ? '#007AFF' : '#999'}
                        />
                        <ThemedText style={styles.roleOptionText}>Employee</ThemedText>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [
                          styles.roleOption,
                          createForm.role === 'admin' && styles.roleOptionSelected,
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => setCreateForm({ ...createForm, role: 'admin' })}
                      >
                        <Ionicons
                          name={createForm.role === 'admin' ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={createForm.role === 'admin' ? '#007AFF' : '#999'}
                        />
                        <ThemedText style={styles.roleOptionText}>Manager</ThemedText>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [
                          styles.roleOption,
                          createForm.role === 'superadmin' && styles.roleOptionSelected,
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => setCreateForm({ ...createForm, role: 'superadmin' })}
                      >
                        <Ionicons
                          name={createForm.role === 'superadmin' ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={createForm.role === 'superadmin' ? '#007AFF' : '#999'}
                        />
                        <ThemedText style={styles.roleOptionText}>Super Manager</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.footerButton,
                      styles.cancelButton,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => setIsCreateModalVisible(false)}
                    disabled={isCreatingUser}
                  >
                    <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.footerButton,
                      styles.submitButton,
                      isCreatingUser && styles.submitButtonDisabled,
                      pressed && !isCreatingUser && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                    ]}
                    onPress={handleCreateUser}
                    disabled={isCreatingUser}
                  >
                    <ThemedText style={styles.submitButtonText}>
                      {isCreatingUser ? 'Creating...' : 'Create User'}
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        </ThemedView>
      );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Manager Panel</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          User Management
        </ThemedText>
      </ThemedView>

      {/* Admin Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Ionicons
            name="people"
            size={20}
            color={activeTab === 'users' ? '#007AFF' : '#666'}
          />
          <ThemedText style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Users
          </ThemedText>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => {
            setActiveTab('pending');
            if (pendingUsers.length === 0) loadPendingUsers();
          }}
        >
          <Ionicons
            name="hourglass"
            size={20}
            color={activeTab === 'pending' ? '#007AFF' : '#666'}
          />
          <ThemedText style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
        {/* USERS TAB */}
        {activeTab === 'users' && (
          <>
            {/* Create User Button */}
            <Pressable
              style={({ pressed }) => [
                styles.createButton,
                pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
              ]}
              onPress={openCreateUserModal}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <ThemedText style={styles.createButtonText}>Create New User</ThemedText>
            </Pressable>

            {/* Search and Filter */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#007AFF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or email..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Users Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <ThemedText style={styles.statValue}>{users.length}</ThemedText>
                <ThemedText style={styles.statLabel}>Total Users</ThemedText>
              </View>
            </View>

            {/* Users List */}
            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
            ) : users.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="person-outline" size={48} color="#ccc" />
                <ThemedText style={styles.emptyStateText}>No users found</ThemedText>
              </View>
            ) : (
              <View>
            {users
              .filter(
                (user) =>
                  user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.email?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((user) => (
                <View key={user.id} style={styles.userCard}>
                  <Pressable
                    onPress={() => {
                      // Check if admin can view this user
                      if (!canAdminManageUser(user)) {
                        showUnauthorizedCompanyAccess();
                        return;
                      }
                      setViewingUser(user);
                      setIsViewModalVisible(true);
                    }}
                    style={styles.userCardContent}
                  >
                    <View style={styles.userAvatar}>
                      <ThemedText style={styles.userAvatarText}>
                        {user.fullName?.charAt(0).toUpperCase() || 'U'}
                      </ThemedText>
                    </View>
                    <View style={styles.userInfo}>
                      <ThemedText style={styles.userName}>{user.fullName}</ThemedText>
                      <ThemedText style={styles.userEmail}>{user.email}</ThemedText>
                      <View style={styles.userMeta}>
                        <View
                          style={[
                            styles.roleTag,
                            {
                              backgroundColor:
                                user.role === 'admin'
                                  ? '#FF9500'
                                  : user.role === 'superadmin'
                                  ? '#FF3B30'
                                  : '#007AFF',
                            },
                          ]}
                        >
                          <ThemedText style={styles.roleTagText}>{user.role}</ThemedText>
                        </View>
                        <View
                          style={[
                            styles.statusTag,
                            { backgroundColor: user.isActive ? '#34C759' : '#8E8E93' },
                          ]}
                        >
                          <ThemedText style={styles.statusTagText}>{user.isActive ? 'Active' : 'Inactive'}</ThemedText>
                        </View>
                      </View>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      // Check if admin can edit this user
                      if (!canAdminManageUser(user)) {
                        showUnauthorizedCompanyAccess();
                        return;
                      }
                      setEditingUser(user);
                      setEditingFullName(user.fullName || '');
                      setEditingEmail(user.email);
                      setEditingRole(user.role);
                      setEditingCompany(user.company || '');
                      setEditingIsActive(user.isActive);
                      setIsEditModalVisible(true);
                    }}
                    style={({ pressed }) => [
                      styles.editButton,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons name="pencil" size={18} color="#007AFF" />
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setMenuVisibleForUserId(menuVisibleForUserId === user.id ? null : user.id);
                    }}
                    style={({ pressed }) => [
                      styles.moreButton,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons name="ellipsis-vertical" size={18} color="#666" />
                  </Pressable>

                  {menuVisibleForUserId === user.id && (
                    <Animated.View style={styles.actionMenu}>
                      <Pressable
                        style={styles.actionMenuItem}
                        onPress={() => {
                          // Check if admin can view this user
                          if (!canAdminManageUser(user)) {
                            showUnauthorizedCompanyAccess();
                            setMenuVisibleForUserId(null);
                            return;
                          }
                          setViewingUser(user);
                          setIsViewModalVisible(true);
                          setMenuVisibleForUserId(null);
                        }}
                      >
                        <Ionicons name="eye" size={18} color="#007AFF" />
                        <ThemedText style={styles.actionMenuItemText}>View</ThemedText>
                      </Pressable>
                      <Pressable
                        style={styles.actionMenuItem}
                        onPress={async () => {
                          setMenuVisibleForUserId(null);
                          setIsDeletingUser(true);
                          try {
                            await deleteDoc(doc(db, 'users', user.id));
                            setUsers(users.filter((u) => u.id !== user.id));
                            Alert.alert('Success', 'User deleted successfully');
                          } catch (error: any) {
                            Alert.alert('Error', `Failed to delete user: ${error?.message}`);
                          } finally {
                            setIsDeletingUser(false);
                          }
                        }}
                        disabled={isDeletingUser}
                      >
                        <Ionicons name="trash" size={18} color="#FF3B30" />
                        <ThemedText style={[styles.actionMenuItemText, { color: '#FF3B30' }]}>Delete</ThemedText>
                      </Pressable>
                    </Animated.View>
                  )}
                </View>
              ))}
          </View>
        )}
            </>
        )}

        {/* PENDING TAB */}
        {activeTab === 'pending' && (
          <>
            {/* Pending Users Header */}
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Pending Account Approvals ({pendingUsers.length})</ThemedText>
              <Pressable onPress={loadPendingUsers} disabled={loadingPendingUsers}>
                <Ionicons name="refresh" size={20} color="#007AFF" style={{ opacity: loadingPendingUsers ? 0.5 : 1 }} />
              </Pressable>
            </View>

            {loadingPendingUsers && !pendingUsers.length ? (
              <ThemedView style={styles.emptyState}>
                <ActivityIndicator size="large" color="#007AFF" />
                <ThemedText style={styles.emptyStateText}>Loading pending accounts...</ThemedText>
              </ThemedView>
            ) : pendingUsers.length === 0 ? (
              <ThemedView style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color="#999" />
                <ThemedText style={styles.emptyStateText}>No pending approvals</ThemedText>
              </ThemedView>
            ) : (
              <View>
                {pendingUsers.map((user) => (
                  <View key={user.id} style={styles.pendingUserCard}>
                    <View style={styles.pendingUserHeader}>
                      <ThemedText style={styles.pendingUserName}>{user.fullName}</ThemedText>
                      <ThemedText style={styles.pendingUserEmail}>{user.email}</ThemedText>
                      <ThemedText style={styles.pendingUserCompany}>Company: {user.company}</ThemedText>
                      <ThemedText style={styles.pendingUserCreated}>Applied: {new Date(user.createdAt).toLocaleDateString()}</ThemedText>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.pendingUserActions}>
                      <Pressable
                        style={styles.approveButton}
                        onPress={() => handleApproveUser(user.id)}
                        disabled={approvingUser === user.id}
                      >
                        {approvingUser === user.id ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle" size={16} color="#fff" />
                            <ThemedText style={styles.actionButtonText}>Approve</ThemedText>
                          </>
                        )}
                      </Pressable>

                      <Pressable
                        style={styles.rejectButton}
                        onPress={() => handleRejectUser(user.id)}
                      >
                        <Ionicons name="close-circle" size={16} color="#fff" />
                        <ThemedText style={styles.actionButtonText}>Reject</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Create Company Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCreateCompanyModalVisible}
        onRequestClose={() => setIsCreateCompanyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Create Company</ThemedText>
              <Pressable onPress={() => setIsCreateCompanyModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#8E8E93" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
              {/* Company Name */}
              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Company Name *</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., RiCement Industries"
                  placeholderTextColor="#999"
                  value={createCompanyForm.name}
                  onChangeText={(text) => setCreateCompanyForm({ ...createCompanyForm, name: text })}
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Description</ThemedText>
                <TextInput
                  style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                  placeholder="Company description (optional)"
                  placeholderTextColor="#999"
                  value={createCompanyForm.description}
                  onChangeText={(text) => setCreateCompanyForm({ ...createCompanyForm, description: text })}
                  multiline
                />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && { opacity: 0.8 },
                  isCreatingCompany && { opacity: 0.6 }
                ]}
                onPress={handleCreateCompany}
                disabled={isCreatingCompany}
              >
                {isCreatingCompany ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.submitButtonText}>Create Company</ThemedText>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* View Company Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isViewCompanyModalVisible}
        onRequestClose={() => setIsViewCompanyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{selectedCompany?.name}</ThemedText>
              <Pressable onPress={() => setIsViewCompanyModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#8E8E93" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
              {selectedCompany && (
                <>
                  {selectedCompany.description && (
                    <View style={styles.formGroup}>
                      <ThemedText style={styles.label}>Description</ThemedText>
                      <ThemedText style={{ color: '#333', lineHeight: 20 }}>{selectedCompany.description}</ThemedText>
                    </View>
                  )}

                  <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                      <ThemedText style={styles.statValue}>{selectedCompany.totalAdmins || 0}</ThemedText>
                      <ThemedText style={styles.statLabel}>Managers</ThemedText>
                    </View>
                    <View style={styles.statCard}>
                      <ThemedText style={styles.statValue}>{selectedCompany.totalUsers || 0}</ThemedText>
                      <ThemedText style={styles.statLabel}>Users</ThemedText>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create User Modal */}
      <Modal
        visible={isCreateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Create New User</ThemedText>
              <Pressable onPress={() => setIsCreateModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#8E8E93" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
              {/* Full Name */}
              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Full Name</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  placeholderTextColor="#999"
                  value={createForm.fullName}
                  onChangeText={(text) => setCreateForm({ ...createForm, fullName: text })}
                />
              </View>

              {/* Username */}
              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Username</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Enter username"
                  placeholderTextColor="#999"
                  value={createForm.username}
                  onChangeText={(text) => setCreateForm({ ...createForm, username: text })}
                />
              </View>

              {/* Company - Dropdown for Superadmin */}
              {currentUser?.role === 'superadmin' ? (
                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Company *</ThemedText>
                  <Pressable
                    style={styles.dropdownButton}
                    onPress={() => setIsCreateCompanyDropdownOpen(!isCreateCompanyDropdownOpen)}
                  >
                    <ThemedText style={styles.dropdownButtonText}>
                      {createForm.company || 'Select a company'}
                    </ThemedText>
                    <Ionicons
                      name={isCreateCompanyDropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#007AFF"
                    />
                  </Pressable>

                  {isCreateCompanyDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      <TextInput
                        style={styles.dropdownSearch}
                        placeholder="Search companies..."
                        placeholderTextColor="#999"
                        value={createCompanySearchQuery}
                        onChangeText={setCreateCompanySearchQuery}
                      />
                      {filteredCreateCompanies.length === 0 ? (
                        <View style={styles.dropdownEmptyState}>
                          <ThemedText style={styles.dropdownEmptyText}>No companies found</ThemedText>
                        </View>
                      ) : (
                        <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                          {filteredCreateCompanies.map((company) => (
                            <Pressable
                              key={company.id}
                              style={({ pressed }) => [
                                styles.dropdownItem,
                                createForm.company === company.name && styles.dropdownItemSelected,
                                pressed && { backgroundColor: '#f0f0f0' }
                              ]}
                              onPress={() => {
                                setCreateForm({ ...createForm, company: company.name });
                                setIsCreateCompanyDropdownOpen(false);
                                setCreateCompanySearchQuery('');
                              }}
                            >
                              <ThemedText
                                style={[
                                  styles.dropdownItemText,
                                  createForm.company === company.name && styles.dropdownItemTextSelected
                                ]}
                              >
                                {company.name}
                              </ThemedText>
                              {createForm.company === company.name && (
                                <Ionicons name="checkmark" size={18} color="#007AFF" />
                              )}
                            </Pressable>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                // For Admin users, show read-only company
                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Company</ThemedText>
                  <View style={[styles.input, styles.inputReadOnly, { justifyContent: 'center' }]}>
                    <ThemedText style={{ color: '#666' }}>{currentUser?.company || 'N/A'}</ThemedText>
                  </View>
                </View>
              )}

              {/* Email */}
              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Email</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={createForm.email}
                  onChangeText={(text) => setCreateForm({ ...createForm, email: text })}
                />
              </View>

              {/* Password */}
              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Password</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Enter password (min 6 characters)"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={createForm.password}
                  onChangeText={(text) => setCreateForm({ ...createForm, password: text })}
                />
              </View>

              {/* Confirm Password */}
              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Confirm Password</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={createForm.confirmPassword}
                  onChangeText={(text) => setCreateForm({ ...createForm, confirmPassword: text })}
                />
              </View>

              {/* Role Selection */}
              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>User Role</ThemedText>
                <View style={styles.roleOptions}>
                  {/* Show Regular User only for superadmin */}
                  {currentUser?.role === 'superadmin' && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.roleOption,
                        createForm.role === 'user' && styles.roleOptionSelected,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => setCreateForm({ ...createForm, role: 'user' })}
                    >
                      <Ionicons
                        name={createForm.role === 'user' ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={createForm.role === 'user' ? '#007AFF' : '#999'}
                      />
                      <ThemedText style={styles.roleOptionText}>Regular User</ThemedText>
                    </Pressable>
                  )}

                  {/* Show Employee for both superadmin and admin */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.roleOption,
                      createForm.role === 'employee' && styles.roleOptionSelected,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => setCreateForm({ ...createForm, role: 'employee' })}
                  >
                    <Ionicons
                      name={createForm.role === 'employee' ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={createForm.role === 'employee' ? '#007AFF' : '#999'}
                    />
                    <ThemedText style={styles.roleOptionText}>Employee</ThemedText>
                  </Pressable>

                  {/* Show Admin for both superadmin and admin */}
                  {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.roleOption,
                        createForm.role === 'admin' && styles.roleOptionSelected,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => setCreateForm({ ...createForm, role: 'admin' })}
                    >
                      <Ionicons
                        name={createForm.role === 'admin' ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={createForm.role === 'admin' ? '#007AFF' : '#999'}
                      />
                      <ThemedText style={styles.roleOptionText}>Manager</ThemedText>
                    </Pressable>
                  )}

                  {/* Show Super Administrator only for superadmin */}
                  {currentUser?.role === 'superadmin' && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.roleOption,
                        createForm.role === 'superadmin' && styles.roleOptionSelected,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => setCreateForm({ ...createForm, role: 'superadmin' })}
                    >
                      <Ionicons
                        name={createForm.role === 'superadmin' ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={createForm.role === 'superadmin' ? '#007AFF' : '#999'}
                      />
                      <ThemedText style={styles.roleOptionText}>Super Manager</ThemedText>
                    </Pressable>
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={({ pressed }) => [
                  styles.footerButton,
                  styles.cancelButton,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => setIsCreateModalVisible(false)}
                disabled={isCreatingUser}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.footerButton,
                  styles.submitButton,
                  isCreatingUser && styles.submitButtonDisabled,
                  pressed && !isCreatingUser && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                ]}
                onPress={handleCreateUser}
                disabled={isCreatingUser}
              >
                <ThemedText style={styles.submitButtonText}>
                  {isCreatingUser ? 'Creating...' : 'Create User'}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit User Role Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.iosModalContent}>
            <View style={styles.iosModalHeader}>
              <Pressable onPress={() => setIsEditModalVisible(false)}>
                <ThemedText style={styles.iosModalAction}>Cancel</ThemedText>
              </Pressable>
              <ThemedText style={styles.iosModalTitle}>Change Role</ThemedText>
              <Pressable onPress={handleSaveUserRole} disabled={isUpdatingRole}>
                <ThemedText style={[styles.iosModalAction, { color: '#007AFF', fontWeight: '600' }]}>
                  {isUpdatingRole ? 'Saving...' : 'Save'}
                </ThemedText>
              </Pressable>
            </View>

            <ScrollView style={styles.iosModalBody} showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
              {editingUser && (
                <>
                  <View style={styles.userDetailSection}>
                    <ThemedText style={styles.userDetailName}>{editingUser.fullName}</ThemedText>
                    <ThemedText style={styles.userDetailEmail}>{editingUser.email}</ThemedText>
                  </View>

                  {/* Full Name */}
                  <View style={styles.formGroup}>
                    <ThemedText style={styles.label}>Full Name</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter full name"
                      placeholderTextColor="#999"
                      value={editingFullName}
                      onChangeText={setEditingFullName}
                    />
                  </View>

                  {/* Email */}
                  <View style={styles.formGroup}>
                    <ThemedText style={styles.label}>Email</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter email"
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                      value={editingEmail}
                      onChangeText={setEditingEmail}
                    />
                  </View>

                  {/* Company - Dropdown for Superadmin */}
                  {currentUser?.role === 'superadmin' ? (
                    <View style={styles.formGroup}>
                      <ThemedText style={styles.label}>Company</ThemedText>
                      <Pressable
                        style={styles.dropdownButton}
                        onPress={() => setIsEditCompanyDropdownOpen(!isEditCompanyDropdownOpen)}
                      >
                        <ThemedText style={styles.dropdownButtonText}>
                          {editingCompany || 'Select a company'}
                        </ThemedText>
                        <Ionicons
                          name={isEditCompanyDropdownOpen ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color="#007AFF"
                        />
                      </Pressable>

                      {isEditCompanyDropdownOpen && (
                        <View style={styles.dropdownMenu}>
                          <TextInput
                            style={styles.dropdownSearch}
                            placeholder="Search companies..."
                            placeholderTextColor="#999"
                            value={editCompanySearchQuery}
                            onChangeText={setEditCompanySearchQuery}
                          />
                          {filteredEditCompanies.length === 0 ? (
                            <View style={styles.dropdownEmptyState}>
                              <ThemedText style={styles.dropdownEmptyText}>No companies found</ThemedText>
                            </View>
                          ) : (
                            <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                              {filteredEditCompanies.map((company) => (
                                <Pressable
                                  key={company.id}
                                  style={({ pressed }) => [
                                    styles.dropdownItem,
                                    editingCompany === company.name && styles.dropdownItemSelected,
                                    pressed && { backgroundColor: '#f0f0f0' }
                                  ]}
                                  onPress={() => {
                                    setEditingCompany(company.name);
                                    setIsEditCompanyDropdownOpen(false);
                                    setEditCompanySearchQuery('');
                                  }}
                                >
                                  <ThemedText
                                    style={[
                                      styles.dropdownItemText,
                                      editingCompany === company.name && styles.dropdownItemTextSelected
                                    ]}
                                  >
                                    {company.name}
                                  </ThemedText>
                                  {editingCompany === company.name && (
                                    <Ionicons name="checkmark" size={18} color="#007AFF" />
                                  )}
                                </Pressable>
                              ))}
                            </ScrollView>
                          )}
                        </View>
                      )}
                    </View>
                  ) : (
                    // For Admin users, show read-only company
                    <View style={styles.formGroup}>
                      <ThemedText style={styles.label}>Company</ThemedText>
                      <View style={[styles.input, styles.inputReadOnly, { justifyContent: 'center' }]}>
                        <ThemedText style={{ color: '#666' }}>{editingCompany || 'N/A'}</ThemedText>
                      </View>
                    </View>
                  )}

                  {/* Status */}
                  <View style={styles.formGroup}>
                    <ThemedText style={styles.label}>Status</ThemedText>
                    <View style={styles.roleOptions}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.roleOption,
                          editingIsActive && styles.roleOptionSelected,
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => setEditingIsActive(true)}
                      >
                        <Ionicons
                          name={editingIsActive ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={editingIsActive ? '#34C759' : '#999'}
                        />
                        <ThemedText style={styles.roleOptionText}>Active</ThemedText>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [
                          styles.roleOption,
                          !editingIsActive && styles.roleOptionSelected,
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => setEditingIsActive(false)}
                      >
                        <Ionicons
                          name={!editingIsActive ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={!editingIsActive ? '#FF3B30' : '#999'}
                        />
                        <ThemedText style={styles.roleOptionText}>Inactive</ThemedText>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.roleSelectContainer}>
                    <ThemedText style={styles.roleSelectLabel}>User Role</ThemedText>
                    
                    <Pressable
                      style={({ pressed }) => [
                        styles.roleSelectOption,
                        editingRole === 'user' && styles.roleSelectOptionSelected,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => setEditingRole('user')}
                    >
                      <View style={styles.roleSelectRadio}>
                        {editingRole === 'user' && <View style={styles.roleSelectRadioInner} />}
                      </View>
                      <View style={styles.roleSelectContent}>
                        <ThemedText style={styles.roleSelectOptionTitle}>Regular User</ThemedText>
                        <ThemedText style={styles.roleSelectOptionDesc}>Standard access to app features</ThemedText>
                      </View>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.roleSelectOption,
                        editingRole === 'employee' && styles.roleSelectOptionSelected,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => setEditingRole('employee')}
                    >
                      <View style={styles.roleSelectRadio}>
                        {editingRole === 'employee' && <View style={styles.roleSelectRadioInner} />}
                      </View>
                      <View style={styles.roleSelectContent}>
                        <ThemedText style={styles.roleSelectOptionTitle}>Employee</ThemedText>
                        <ThemedText style={styles.roleSelectOptionDesc}>Access to Home, Process, and Profile tabs</ThemedText>
                      </View>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.roleSelectOption,
                        editingRole === 'admin' && styles.roleSelectOptionSelected,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => setEditingRole('admin')}
                    >
                      <View style={styles.roleSelectRadio}>
                        {editingRole === 'admin' && <View style={styles.roleSelectRadioInner} />}
                      </View>
                      <View style={styles.roleSelectContent}>
                        <ThemedText style={styles.roleSelectOptionTitle}>Manager</ThemedText>
                        <ThemedText style={styles.roleSelectOptionDesc}>Full manager access for their company</ThemedText>
                      </View>
                    </Pressable>

                    {currentUser?.role === 'superadmin' && (
                      <Pressable
                        style={({ pressed }) => [
                          styles.roleSelectOption,
                          editingRole === 'superadmin' && styles.roleSelectOptionSelected,
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => setEditingRole('superadmin')}
                      >
                        <View style={styles.roleSelectRadio}>
                          {editingRole === 'superadmin' && <View style={styles.roleSelectRadioInner} />}
                        </View>
                        <View style={styles.roleSelectContent}>
                          <ThemedText style={styles.roleSelectOptionTitle}>Super Manager</ThemedText>
                          <ThemedText style={styles.roleSelectOptionDesc}>Full access to all companies</ThemedText>
                        </View>
                      </Pressable>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* View User Modal */}
      <Modal
        visible={isViewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsViewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.iosModalContent}>
            <View style={styles.iosModalHeader}>
              <ThemedText style={{ flex: 1 }}></ThemedText>
              <ThemedText style={styles.iosModalTitle}>User Details</ThemedText>
              <Pressable onPress={() => setIsViewModalVisible(false)} style={{ flex: 1, alignItems: 'flex-end' }}>
                <ThemedText style={styles.iosModalAction}>Done</ThemedText>
              </Pressable>
            </View>

            <ScrollView style={styles.iosModalBody} showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
              {viewingUser && (
                <>
                  <View style={styles.viewUserCard}>
                    <View style={styles.viewUserAvatar}>
                      <ThemedText style={styles.viewUserAvatarText}>
                        {viewingUser.fullName?.charAt(0).toUpperCase() || 'U'}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.viewUserName}>{viewingUser.fullName}</ThemedText>
                  </View>

                  <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Email</ThemedText>
                      <ThemedText style={styles.detailValue}>{viewingUser.email}</ThemedText>
                    </View>

                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Company</ThemedText>
                      <ThemedText style={styles.detailValue}>{viewingUser.company}</ThemedText>
                    </View>

                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Role</ThemedText>
                      <View
                        style={[
                          styles.detailBadge,
                          { backgroundColor: viewingUser.role === 'admin' ? '#FF9500' : '#007AFF' },
                        ]}
                      >
                        <ThemedText style={styles.detailBadgeText}>
                          {viewingUser.role === 'admin' ? 'Admin' : 'User'}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Status</ThemedText>
                      <View
                        style={[
                          styles.detailBadge,
                          { backgroundColor: viewingUser.isActive ? '#34C759' : '#FF3B30' },
                        ]}
                      >
                        <ThemedText style={styles.detailBadgeText}>
                          {viewingUser.isActive ? 'Active' : 'Inactive'}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Joined</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {new Date(viewingUser.createdAt).toLocaleDateString()}
                      </ThemedText>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  analyticsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#000000',
    paddingVertical: 5,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#ffffff',
    paddingVertical: 5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
  },
  companyInfo: {
    fontSize: 12,
    color: '#1C1C1E',
    marginTop: 8,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  createButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#1C1C1E',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
  },
  usersSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  userCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 12,
    color: '#1C1C1E',
    marginTop: 4,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  roleTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  userCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  moreButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  menuButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionMenu: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'visible',
    zIndex: 1000,
    minWidth: 140,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  actionMenuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  actionMenuDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  // iOS Modal Styles
  iosModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  iosModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iosModalAction: {
    fontSize: 16,
    color: '#666',
  },
  iosModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  iosModalBody: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  userDetailSection: {
    alignItems: 'center',
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 24,
  },
  userDetailName: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  userDetailEmail: {
    fontSize: 14,
    color: '#666',
  },
  roleSelectContainer: {
    gap: 12,
  },
  roleSelectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  roleSelectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    gap: 12,
  },
  roleSelectOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  roleSelectRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleSelectRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  roleSelectContent: {
    flex: 1,
  },
  roleSelectOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  roleSelectOptionDesc: {
    fontSize: 12,
    color: '#999',
  },
  // View User Modal Styles
  viewUserCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 24,
  },
  viewUserAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewUserAvatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
  },
  viewUserName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailsContainer: {
    gap: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  detailBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detailBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  notAuthorizedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#FF3B30',
  },
  notAuthorizedText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    alignItems: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputReadOnly: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  roleOptions: {
    gap: 12,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    gap: 12,
  },
  roleOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  roleOptionText: {
    fontSize: 14,
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#34C759',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  companyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  companyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  companyInfo_: {
    flex: 1,
    marginRight: 12,
  },
  companyName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  companyDescription: {
    fontSize: 13,
    color: '#666',
  },
  companyStats: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  companyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  companyStatText: {
    fontSize: 13,
    color: '#1C1C1E',
  },
  companyDescriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  companyCardDeleteButton: {
    padding: 8,
    backgroundColor: '#fff0f0',
    borderRadius: 8,
  },
  emptyStateCompanies: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
  },
  emptyStateCompaniesText: {
    fontSize: 16,
    color: '#999',
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: '#fff',
    maxHeight: 250,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownSearch: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  dropdownItemTextSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
  dropdownEmptyState: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: 14,
    color: '#999',
  },
  //  ===== SUPERADMIN ANALYTICS STYLES =====
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastRefreshText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  analyticsContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
    color: '#1C1C1E',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quickStatsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  quickStatItem: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  topCompanyCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  topCompanyLabel: {
    fontSize: 12,
    color: '#666',
  },
  topCompanyName: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  topCompanyBlocks: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  companyBreakdownSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  companyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  companyBlockBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  companyBlockCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
  topCompaniesSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topCompanyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  rankBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 20,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  topCompanyInfo: {
    flex: 1,
  },
  blocksText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  // Company List Styles
  companyListItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  companyListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  companyListInfo: {
    flex: 1,
    marginRight: 12,
  },
  companyListName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1C1C1E',
  },
  companyListDescription: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  companyListStats: {
    flexDirection: 'row',
    gap: 16,
  },
  companyListStatItem: {
    alignItems: 'center',
  },
  companyListStatLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 4,
  },
  companyListStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
  // Pending Users Styles
  pendingUserCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  pendingUserHeader: {
    marginBottom: 12,
  },
  pendingUserInfo: {
    flex: 1,
  },
  pendingUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  pendingUserEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  pendingUserCompany: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  pendingUserCreated: {
    fontSize: 12,
    color: '#999',
  },
  pendingUserActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});



