// Admin Projects Page - View all users and their projects
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { auth } from '../../config/firebase';
import { adminService } from '../../services/adminService';

interface UserWithProjects {
  id: string;
  fullName: string;
  email: string;
  projectCount: number;
  projects: any[];
}

export default function AdminProjectsScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<UserWithProjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithProjects | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Redirect if not web
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Alert.alert('Error', 'Admin panel is only available on web');
      router.replace('/');
      return;
    }

    // Check if user is authenticated
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.replace('/(admin)/login');
        return;
      }

      // Check if user is admin
      const isAdmin = await adminService.isAdmin(user.uid);
      if (!isAdmin) {
        await adminService.adminLogout();
        router.replace('/(admin)/login');
        return;
      }

      // Load users and projects
      loadUsersAndProjects();
    });

    return () => unsubscribe();
  }, []);

  const loadUsersAndProjects = async () => {
    try {
      setLoading(true);
      const [allUsers, allProjects] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getAllProjects()
      ]);

      // Group projects by user
      const usersWithProjects: UserWithProjects[] = allUsers.map((user) => {
        const userProjects = allProjects.filter((project) => project.userId === user.id);
        return {
          id: user.id,
          fullName: user.fullName || 'Unknown User',
          email: user.email || '',
          projectCount: userProjects.length,
          projects: userProjects
        };
      });

      // Sort by project count (highest first)
      usersWithProjects.sort((a, b) => b.projectCount - a.projectCount);

      setUsers(usersWithProjects);
    } catch (error) {
      console.error('Error loading users and projects:', error);
      if (Platform.OS === 'web') {
        alert('Failed to load users and projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const openUserProjects = (user: UserWithProjects) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedUser(null);
  };

  if (Platform.OS !== 'web') {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading users and projects...</Text>
      </View>
    );
  }

  return (
    <AdminLayout title="Projects">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Users & Projects</Text>
          <Text style={styles.subtitle}>Click on a user to view their projects</Text>
        </View>

        {users.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        ) : (
          <View style={styles.usersList}>
            {users.map((user) => (
              <Pressable 
                key={user.id} 
                style={styles.userCard}
                onPress={() => openUserProjects(user)}
              >
                <View style={styles.userHeader}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {user.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.fullName}</Text>
                    <Text style={styles.projectCountText}>
                      {user.projectCount} {user.projectCount === 1 ? 'Project' : 'Projects'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Modal for showing user's projects */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeModal}
        >
          <Pressable style={styles.modalOverlay} onPress={closeModal}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              {selectedUser && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalUserInfo}>
                      <View style={styles.modalAvatarCircle}>
                        <Text style={styles.modalAvatarText}>
                          {selectedUser.fullName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.modalUserName}>{selectedUser.fullName}</Text>
                        <Text style={styles.modalUserEmail}>{selectedUser.email}</Text>
                      </View>
                    </View>
                    <Pressable style={styles.closeButton} onPress={closeModal}>
                      <Text style={styles.closeButtonText}>✕</Text>
                    </Pressable>
                  </View>

                  <View style={styles.modalBody}>
                    <Text style={styles.modalTitle}>
                      Projects ({selectedUser.projectCount})
                    </Text>
                    {selectedUser.projects.length === 0 ? (
                      <Text style={styles.noProjectsText}>No projects yet</Text>
                    ) : (
                      <ScrollView style={styles.projectsList}>
                        {selectedUser.projects.map((project) => (
                          <View key={project.id} style={styles.projectCard}>
                            <View style={styles.projectHeader}>
                              <Text style={styles.projectName}>{project.name}</Text>
                              <View style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColor(project.status) }
                              ]}>
                                <Text style={styles.statusText}>{project.status}</Text>
                              </View>
                            </View>
                            <View style={styles.projectDetails}>
                              <View style={styles.projectDetailRow}>
                                <Text style={styles.projectLabel}>Blocks:</Text>
                                <Text style={styles.projectValue}>{project.blocks}</Text>
                              </View>
                              <View style={styles.projectDetailRow}>
                                <Text style={styles.projectLabel}>Est. Time:</Text>
                                <Text style={styles.projectValue}>{project.estimatedTime}</Text>
                              </View>
                              <View style={styles.projectDetailRow}>
                                <Text style={styles.projectLabel}>Date:</Text>
                                <Text style={styles.projectValue}>{project.date}</Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </AdminLayout>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed':
      return '#4CAF50';
    case 'Processing':
      return '#2196F3';
    case 'Queue':
      return '#FFC107';
    default:
      return '#999';
  }
};

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
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  usersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    minWidth: 280,
    maxWidth: 320,
    flex: 1,
    cursor: 'pointer' as any,
  },
  userHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  projectCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 700,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modalAvatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  modalUserName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalUserEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  noProjectsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 40,
  },
  projectsList: {
    maxHeight: 400,
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  projectDetails: {
    gap: 8,
  },
  projectDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  projectLabel: {
    fontSize: 14,
    color: '#666',
  },
  projectValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
