// Admin User Management
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, query, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { auth, db } from '../../config/firebase';
import { adminService } from '../../services/adminService';

interface User {
  id: string;
  email: string;
  displayName?: string;
  role: 'user' | 'admin';
  createdAt: string;
  isActive: boolean;
}

export default function UsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit Modal
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: '',
    email: '',
    role: 'user' as 'user' | 'admin',
    isActive: true,
  });

  // Create User Modal
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'user' | 'admin',
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Redirect if not web
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Alert.alert('Error', 'Admin panel is only available on web');
      router.replace('/');
      return;
    }

    // Check if user is authenticated and admin
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.replace('/(admin)/login');
        return;
      }

      const isAdmin = await adminService.isAdmin(user.uid);
      if (!isAdmin) {
        await adminService.adminLogout();
        router.replace('/(admin)/login');
        return;
      }

      loadUsers();
    });

    return () => unsubscribe();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Loading users...');
      
      const usersQuery = query(collection(db, 'users'));
      const snapshot = await getDocs(usersQuery);
      
      console.log('Users loaded:', snapshot.docs.length);
      
      const usersList: User[] = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('User doc:', doc.id, data);
        return {
          id: doc.id,
          email: data.email || '',
          displayName: data.displayName || 'N/A',
          role: data.role || 'user',
          createdAt: data.createdAt || new Date().toISOString(),
          isActive: data.isActive !== false,
        };
      });

      // Sort by creation date (newest first)
      usersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log('Processed users:', usersList.length);
      setUsers(usersList);
    } catch (error: any) {
      console.error('Error loading users:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      if (Platform.OS === 'web') {
        alert(`Failed to load users: ${error?.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.fullName || !createForm.username || !createForm.email || !createForm.password) {
      alert('Please fill in all fields');
      return;
    }

    if (createForm.password !== createForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (createForm.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsCreatingUser(true);
      console.log('Creating user:', {
        email: createForm.email,
        fullName: createForm.fullName,
        username: createForm.username,
        role: createForm.role,
      });

      await adminService.createUser(
        createForm.email.trim(),
        createForm.password,
        createForm.fullName.trim(),
        createForm.username.trim(),
        createForm.role
      );

      console.log('User created successfully');
      alert(`User "${createForm.fullName}" created successfully as ${createForm.role}!`);
      
      setIsCreateModalVisible(false);
      setCreateForm({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user',
      });
      
      loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errorMessage = error?.message || 'Unknown error';
      
      // Handle specific Firebase errors
      if (errorMessage.includes('email-already-in-use')) {
        alert('This email is already registered');
      } else if (errorMessage.includes('weak-password')) {
        alert('Password is too weak. Please use a stronger password');
      } else if (errorMessage.includes('invalid-email')) {
        alert('Invalid email address');
      } else {
        alert(`Failed to create user: ${errorMessage}`);
      }
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      displayName: user.displayName || '',
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      console.log('Updating user:', editingUser.id);
      console.log('Update data:', {
        role: editForm.role,
        isActive: editForm.isActive,
      });

      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, {
        role: editForm.role,
        isActive: editForm.isActive,
        updatedAt: new Date().toISOString(),
      });

      console.log('Update successful');
      if (Platform.OS === 'web') {
        alert('User updated successfully!');
      }
      
      setIsEditModalVisible(false);
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      if (Platform.OS === 'web') {
        alert(`Failed to update user: ${error?.message || 'Unknown error'}`);
      }
    }
  };

  const handleDelete = async (user: User) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to delete user "${user.email}"?\n\n` +
        `⚠️ This will:\n` +
        `• Delete the user profile\n` +
        `• Keep their projects (orphaned)\n` +
        `• This action cannot be undone!\n\n` +
        `Note: To fully delete authentication, you need Firebase Admin SDK or Firebase Console.`
      );
      
      if (!confirmed) return;
    }

    try {
      console.log('Deleting user:', user.id, user.email);
      
      // Delete user document from Firestore
      await deleteDoc(doc(db, 'users', user.id));
      
      console.log('Delete successful');
      if (Platform.OS === 'web') {
        alert('User profile deleted from database!\n\nNote: Authentication record still exists. Delete from Firebase Console > Authentication if needed.');
      }
      
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      if (Platform.OS === 'web') {
        alert(`Failed to delete user: ${error?.message || 'Unknown error'}`);
      }
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      console.log('Toggling active status for user:', user.id, 'Current:', user.isActive, 'New:', !user.isActive);
      
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        isActive: !user.isActive,
        updatedAt: new Date().toISOString(),
      });

      console.log('Toggle successful');
      if (Platform.OS === 'web') {
        alert(`User ${!user.isActive ? 'activated' : 'deactivated'} successfully!`);
      }
      
      loadUsers();
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      if (Platform.OS === 'web') {
        alert(`Failed to update user status: ${error?.message || 'Unknown error'}`);
      }
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (Platform.OS !== 'web') {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <AdminLayout title="Users">
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>User Management</Text>
            <Text style={styles.pageSubtitle}>Manage user accounts and permissions</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable 
              style={styles.createButton}
              onPress={() => setIsCreateModalVisible(true)}
            >
              <Text style={styles.createButtonText}>➕ Create User</Text>
            </Pressable>
            <View style={styles.headerStats}>
              <View style={styles.statBadge}>
                <Text style={styles.statValue}>{users.length}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statValue}>{users.filter(u => u.role === 'admin').length}</Text>
                <Text style={styles.statLabel}>Admins</Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statValue}>{users.filter(u => u.isActive).length}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by email or name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Users Table */}
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 3 }]}>Email</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Role</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Actions</Text>
          </View>

          {/* Table Body */}
          <ScrollView style={styles.tableBody}>
            {filteredUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {searchQuery ? 'No users found matching your search' : 'No users found'}
                </Text>
              </View>
            ) : (
              filteredUsers.map((user) => (
                <View key={user.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 3 }]} numberOfLines={1}>
                    {user.email}
                  </Text>
                  <View style={[styles.tableCellContainer, { flex: 1 }]}>
                    <View style={[
                      styles.roleBadge,
                      { backgroundColor: user.role === 'admin' ? '#FF9500' : '#007AFF' }
                    ]}>
                      <Text style={styles.roleBadgeText}>
                        {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.tableCellContainer, styles.actionsCell, { flex: 1.5 }]}>
                    <Pressable 
                      style={[styles.actionButton, styles.editButton]} 
                      onPress={() => handleEdit(user)}
                    >
                      <Text style={styles.actionButtonText}>✏️ Edit</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.actionButton, user.isActive ? styles.deactivateButton : styles.activateButton]} 
                      onPress={() => handleToggleActive(user)}
                    >
                      <Text style={styles.actionButtonText}>
                        {user.isActive ? '⏸️' : '▶️'}
                      </Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.actionButton, styles.deleteButton]} 
                      onPress={() => handleDelete(user)}
                    >
                      <Text style={styles.actionButtonText}>🗑️</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ User Management Notes:</Text>
          <Text style={styles.infoText}>• Edit: Modify user profile, role, and status</Text>
          <Text style={styles.infoText}>• Toggle Status: Activate/deactivate user accounts</Text>
          <Text style={styles.infoText}>• Delete: Removes user profile from database (auth record remains)</Text>
          <Text style={styles.infoText}>• Role: Admin users have full access to admin panel</Text>
        </View>

        {/* Edit Modal */}
        <Modal
          visible={isEditModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsEditModalVisible(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setIsEditModalVisible(false)}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Edit User</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email (Read-only)</Text>
                <TextInput
                  style={[styles.input, styles.inputReadonly]}
                  value={editForm.email}
                  editable={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Role</Text>
                <View style={styles.radioGroup}>
                  <Pressable 
                    style={styles.radioOption}
                    onPress={() => setEditForm({ ...editForm, role: 'user' })}
                  >
                    <View style={[
                      styles.radioCircle,
                      editForm.role === 'user' && styles.radioCircleSelected
                    ]}>
                      {editForm.role === 'user' && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>👤 User</Text>
                  </Pressable>
                  <Pressable 
                    style={styles.radioOption}
                    onPress={() => setEditForm({ ...editForm, role: 'admin' })}
                  >
                    <View style={[
                      styles.radioCircle,
                      editForm.role === 'admin' && styles.radioCircleSelected
                    ]}>
                      {editForm.role === 'admin' && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>👑 Admin</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.radioGroup}>
                  <Pressable 
                    style={styles.radioOption}
                    onPress={() => setEditForm({ ...editForm, isActive: true })}
                  >
                    <View style={[
                      styles.radioCircle,
                      editForm.isActive && styles.radioCircleSelected
                    ]}>
                      {editForm.isActive && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>✓ Active</Text>
                  </Pressable>
                  <Pressable 
                    style={styles.radioOption}
                    onPress={() => setEditForm({ ...editForm, isActive: false })}
                  >
                    <View style={[
                      styles.radioCircle,
                      !editForm.isActive && styles.radioCircleSelected
                    ]}>
                      {!editForm.isActive && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>✕ Inactive</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.modalActions}>
                <Pressable 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsEditModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Create User Modal */}
        <Modal
          visible={isCreateModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsCreateModalVisible(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setIsCreateModalVisible(false)}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Create New User</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  value={createForm.fullName}
                  onChangeText={(text) => setCreateForm({ ...createForm, fullName: text })}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter username"
                  value={createForm.username}
                  onChangeText={(text) => setCreateForm({ ...createForm, username: text })}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  value={createForm.email}
                  onChangeText={(text) => setCreateForm({ ...createForm, email: text })}
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter password (min 6 characters)"
                  value={createForm.password}
                  onChangeText={(text) => setCreateForm({ ...createForm, password: text })}
                  placeholderTextColor="#999"
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  value={createForm.confirmPassword}
                  onChangeText={(text) => setCreateForm({ ...createForm, confirmPassword: text })}
                  placeholderTextColor="#999"
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Role</Text>
                <View style={styles.radioGroup}>
                  <Pressable 
                    style={styles.radioOption}
                    onPress={() => setCreateForm({ ...createForm, role: 'user' })}
                  >
                    <View style={[
                      styles.radioCircle,
                      createForm.role === 'user' && styles.radioCircleSelected
                    ]}>
                      {createForm.role === 'user' && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>👤 User</Text>
                  </Pressable>
                  <Pressable 
                    style={styles.radioOption}
                    onPress={() => setCreateForm({ ...createForm, role: 'admin' })}
                  >
                    <View style={[
                      styles.radioCircle,
                      createForm.role === 'admin' && styles.radioCircleSelected
                    ]}>
                      {createForm.role === 'admin' && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>👑 Admin</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.modalActions}>
                <Pressable 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsCreateModalVisible(false)}
                  disabled={isCreatingUser}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable 
                  style={[styles.modalButton, styles.createButtonStyle]}
                  onPress={handleCreateUser}
                  disabled={isCreatingUser}
                >
                  <Text style={styles.createButtonTextModal}>
                    {isCreatingUser ? '⏳ Creating...' : '✓ Create User'}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 24,
  },
  headerActions: {
    flexDirection: 'column',
    gap: 16,
    alignItems: 'flex-end',
  },
  createButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    cursor: 'pointer' as any,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
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
    color: '#666',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    outlineStyle: 'none' as any,
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
  },
  tableBody: {
    maxHeight: 500,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
  },
  tableCellContainer: {
    // View-only styles for containers
  },
  actionsCell: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    cursor: 'pointer' as any,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  activateButton: {
    backgroundColor: '#34C759',
  },
  deactivateButton: {
    backgroundColor: '#FF9500',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1565C0',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
    outlineStyle: 'none' as any,
  },
  inputReadonly: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 24,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer' as any,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#007AFF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  radioLabel: {
    fontSize: 14,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  createButtonStyle: {
    backgroundColor: '#34C759',
  },
  createButtonTextModal: {
    color: '#fff',
    fontWeight: '600',
  },
});
