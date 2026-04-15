import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { db } from '@/config/firebase';
import { adminService } from '@/services/adminService';
import { authService } from '@/services/authService';
import { User } from '@/types/user';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAboutModalVisible, setIsAboutModalVisible] = useState(false);
  const [isSupportModalVisible, setIsSupportModalVisible] = useState(false);
  const [isMyAccountModalVisible, setIsMyAccountModalVisible] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    username: '',
    email: '',
  });
  const [isSavingChanges, setIsSavingChanges] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('currentUser');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Check if user is admin
        const adminStatus = await adminService.isAdmin(parsedUser.uid);
        setIsAdmin(adminStatus);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('currentUser');
            router.replace('/login');
          },
        },
      ],
    );
  };

  const handleSubmitComplaint = async () => {
    if (!complaintText.trim()) {
      Alert.alert('Error', 'Please enter your complaint or feedback');
      return;
    }

    try {
      setIsSubmittingComplaint(true);

      await addDoc(collection(db, 'complaints'), {
        username: user?.username || 'unknown',
        email: user?.email || 'unknown',
        complaint: complaintText.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      Alert.alert(
        'Success',
        'Your complaint has been submitted. Our team will review it shortly.',
        [
          {
            text: 'OK',
            onPress: () => {
              setComplaintText('');
              setIsSupportModalVisible(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting complaint:', error);
      Alert.alert('Error', 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const handleEditMode = () => {
    if (user) {
      setEditForm({
        fullName: user.fullName || '',
        username: user.username || '',
        email: user.email || '',
      });
      setIsEditingAccount(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.fullName.trim() || !editForm.username.trim() || !editForm.email.trim()) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    // Basic email validation
    if (!authService.validateEmail(editForm.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setIsSavingChanges(true);

      await authService.updateUserProfile({
        fullName: editForm.fullName.trim(),
        username: editForm.username.trim(),
        email: editForm.email.trim(),
      });

      // Update local user state
      const updatedUser = { ...user, ...editForm };
      setUser(updatedUser);

      // Update AsyncStorage
      await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));

      Alert.alert('Success', 'Your profile has been updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            setIsEditingAccount(false);
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSavingChanges(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingAccount(false);
    setEditForm({
      fullName: '',
      username: '',
      email: '',
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <View style={styles.profileIcon}>
          <Ionicons name="person-circle-outline" size={80} color="#007AFF" />
        </View>
        <ThemedText style={styles.userName}>{user?.fullName || user?.email || 'User'}</ThemedText>
      </ThemedView>

      <ScrollView style={styles.content} scrollEventThrottle={16}>
        {/* Account Section */}
        <ThemedView style={styles.section}>
          <Pressable style={styles.menuItem} onPress={() => setIsMyAccountModalVisible(true)}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#007AFF' }]}>
              <Ionicons name="person-outline" size={24} color="#fff" />
            </View>
            <ThemedText style={styles.menuText}>My Account</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" style={styles.chevron} />
          </Pressable>

          {isAdmin && (
            <Pressable style={styles.menuItem} onPress={() => router.push('/(tabs)/admin')}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#9C27B0' }]}>
                <Ionicons name="shield-outline" size={24} color="#fff" />
              </View>
              <ThemedText style={styles.menuText}>Admin Panel</ThemedText>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" style={styles.chevron} />
            </Pressable>
          )}

          <Pressable style={styles.menuItem} onPress={handleLogout}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#FF3B30' }]}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </View>
            <ThemedText style={styles.menuText}>Logout</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" style={styles.chevron} />
          </Pressable>
        </ThemedView>

        {/* More Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>More</ThemedText>
          
          <Pressable style={styles.menuItem} onPress={() => setIsAboutModalVisible(true)}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#34C759' }]}>
              <Ionicons name="information-circle-outline" size={24} color="#fff" />
            </View>
            <ThemedText style={styles.menuText}>About Us</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" style={styles.chevron} />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => setIsSupportModalVisible(true)}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#FF9500' }]}>
              <Ionicons name="headset-outline" size={24} color="#fff" />
            </View>
            <ThemedText style={styles.menuText}>Support</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" style={styles.chevron} />
          </Pressable>
        </ThemedView>
      </ScrollView>

      {/* Support/Complaint Modal */}
      <Modal
        visible={isSupportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSupportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Support & Feedback</ThemedText>
              <Pressable onPress={() => setIsSupportModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#8E8E93" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <ThemedText style={styles.supportLabel}>
                How can we help you? Share your complaints, suggestions, or feedback below:
              </ThemedText>
              
              <TextInput
                style={styles.complaintInput}
                placeholder="Enter your complaint or feedback here..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={8}
                value={complaintText}
                onChangeText={setComplaintText}
                textAlignVertical="top"
              />

              <ThemedText style={styles.supportNote}>
                💡 Your feedback helps us improve. We'll review your submission and get back to you as soon as possible.
              </ThemedText>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable 
                style={[styles.footerButton, styles.cancelButton]} 
                onPress={() => {
                  setComplaintText('');
                  setIsSupportModalVisible(false);
                }}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable 
                style={[styles.footerButton, styles.submitButton, isSubmittingComplaint && styles.submitButtonDisabled]} 
                onPress={handleSubmitComplaint}
                disabled={isSubmittingComplaint}
              >
                {isSubmittingComplaint ? (
                  <ThemedText style={styles.submitButtonText}>Submitting...</ThemedText>
                ) : (
                  <ThemedText style={styles.submitButtonText}>Submit</ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* About Us Modal */}
      <Modal
        visible={isAboutModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAboutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>About RiCement</ThemedText>
              <Pressable onPress={() => setIsAboutModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#8E8E93" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <ThemedText style={styles.aboutTitle}>🏗️ RiCement System</ThemedText>
              <ThemedText style={styles.aboutText}>
                RiCement is an innovative project management system designed specifically for Rice Hull-Based (RHB) block production.
                Our system combines modern technology with sustainable building materials to revolutionize the construction industry.
              </ThemedText>

              <ThemedText style={styles.aboutSubtitle}>📋 Key Features</ThemedText>
              <ThemedText style={styles.aboutText}>
                • <ThemedText style={styles.bold}>Project Management:</ThemedText> Track and monitor RHB block production projects in real-time
              </ThemedText>
              <ThemedText style={styles.aboutText}>
                • <ThemedText style={styles.bold}>Manual Timer System:</ThemedText> Control production machines with automated timers
              </ThemedText>
              <ThemedText style={styles.aboutText}>
                • <ThemedText style={styles.bold}>Temperature Monitoring:</ThemedText> Track curing temperatures for optimal block quality
              </ThemedText>
              <ThemedText style={styles.aboutText}>
                • <ThemedText style={styles.bold}>Raw Materials Tracking:</ThemedText> Monitor cement, rice hull, and water usage
              </ThemedText>
              <ThemedText style={styles.aboutText}>
                • <ThemedText style={styles.bold}>Production Analytics:</ThemedText> View daily, weekly, and monthly production statistics
              </ThemedText>

              <ThemedText style={styles.aboutSubtitle}>🌱 Sustainability</ThemedText>
              <ThemedText style={styles.aboutText}>
                Rice Hull-Based blocks are an eco-friendly alternative to traditional building materials.
                By utilizing agricultural waste (rice hulls), we reduce environmental impact while creating
                durable, cost-effective construction materials.
              </ThemedText>

              <ThemedText style={styles.aboutSubtitle}>🔧 Technology</ThemedText>
              <ThemedText style={styles.aboutText}>
                Built with React Native and Firebase, RiCement integrates hardware control systems with
                cloud-based data management. Our Arduino-based automation ensures precise timing and
                consistent production quality.
              </ThemedText>

              <ThemedText style={styles.aboutSubtitle}>📞 Contact</ThemedText>
              <ThemedText style={styles.aboutText}>
                For more information or support, please contact our team through the Support section.
              </ThemedText>
            </ScrollView>

            <Pressable style={styles.closeButton} onPress={() => setIsAboutModalVisible(false)}>
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* My Account Modal */}
      <Modal
        visible={isMyAccountModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsMyAccountModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>My Account</ThemedText>
              <Pressable onPress={() => setIsMyAccountModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#8E8E93" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {user && (
                <>
                  {!isEditingAccount ? (
                    <>
                      <View style={styles.accountCardHeader}>
                        <View style={styles.accountAvatar}>
                          <ThemedText style={styles.accountAvatarText}>
                            {user.fullName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                          </ThemedText>
                        </View>
                        <View style={styles.accountHeaderInfo}>
                          <ThemedText style={styles.accountName}>{user.fullName || 'N/A'}</ThemedText>
                          <ThemedText style={styles.accountEmail}>{user.email || 'N/A'}</ThemedText>
                        </View>
                      </View>

                      <View style={styles.accountDetailsContainer}>
                        <View style={styles.accountDetailRow}>
                          <ThemedText style={styles.accountDetailLabel}>Username</ThemedText>
                          <ThemedText style={styles.accountDetailValue}>{user.username || 'N/A'}</ThemedText>
                        </View>

                        <View style={styles.accountDetailRow}>
                          <ThemedText style={styles.accountDetailLabel}>Role</ThemedText>
                          <View style={[styles.roleBadge, { backgroundColor: user.role === 'admin' || user.role === 'superadmin' ? '#FF9500' : '#007AFF' }]}>
                            <ThemedText style={styles.roleBadgeText}>
                              {user.role === 'superadmin' ? 'Super Admin' : user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}
                            </ThemedText>
                          </View>
                        </View>

                        <View style={styles.accountDetailRow}>
                          <ThemedText style={styles.accountDetailLabel}>Company</ThemedText>
                          <ThemedText style={styles.accountDetailValue}>{user.company || 'N/A'}</ThemedText>
                        </View>

                        <View style={styles.accountDetailRow}>
                          <ThemedText style={styles.accountDetailLabel}>Member Since</ThemedText>
                          <ThemedText style={styles.accountDetailValue}>
                            {user.createdAt ? new Date(typeof user.createdAt === 'string' ? user.createdAt : user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                          </ThemedText>
                        </View>

                        <View style={styles.accountDetailRow}>
                          <ThemedText style={styles.accountDetailLabel}>Status</ThemedText>
                          <View style={[styles.statusBadge, { backgroundColor: user.isActive ? '#34C759' : '#FF3B30' }]}>
                            <ThemedText style={styles.statusBadgeText}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    </>
                  ) : (
                    <>
                      <ThemedText style={styles.editSectionTitle}>Edit Your Details</ThemedText>

                      <View style={styles.editFormGroup}>
                        <ThemedText style={styles.editLabel}>Full Name</ThemedText>
                        <TextInput
                          style={styles.editInput}
                          placeholder="Enter your full name"
                          placeholderTextColor="#999"
                          value={editForm.fullName}
                          onChangeText={(text) => setEditForm({ ...editForm, fullName: text })}
                          editable={!isSavingChanges}
                        />
                      </View>

                      <View style={styles.editFormGroup}>
                        <ThemedText style={styles.editLabel}>Username</ThemedText>
                        <TextInput
                          style={styles.editInput}
                          placeholder="Enter your username"
                          placeholderTextColor="#999"
                          value={editForm.username}
                          onChangeText={(text) => setEditForm({ ...editForm, username: text })}
                          editable={!isSavingChanges}
                        />
                      </View>

                      <View style={styles.editFormGroup}>
                        <ThemedText style={styles.editLabel}>Email</ThemedText>
                        <TextInput
                          style={styles.editInput}
                          placeholder="Enter your email"
                          placeholderTextColor="#999"
                          value={editForm.email}
                          onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                          editable={!isSavingChanges}
                          keyboardType="email-address"
                        />
                      </View>
                    </>
                  )}
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              {!isEditingAccount ? (
                <Pressable
                  style={[styles.footerButton, styles.submitButton]}
                  onPress={handleEditMode}
                >
                  <Ionicons name="pencil" size={18} color="#fff" />
                  <ThemedText style={[styles.submitButtonText, { marginLeft: 8 }]}>Edit Profile</ThemedText>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    style={[styles.footerButton, styles.cancelButton]}
                    onPress={handleCancelEdit}
                    disabled={isSavingChanges}
                  >
                    <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.footerButton, styles.submitButton, isSavingChanges && styles.submitButtonDisabled]}
                    onPress={handleSaveProfile}
                    disabled={isSavingChanges}
                  >
                    {isSavingChanges ? (
                      <ThemedText style={styles.submitButtonText}>Saving...</ThemedText>
                    ) : (
                      <ThemedText style={styles.submitButtonText}>Save Changes</ThemedText>
                    )}
                  </Pressable>
                </>
              )}
            </View>
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
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    color: '#333',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 'auto',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
  },
  aboutSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  supportLabel: {
    fontSize: 15,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  complaintInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#f9f9f9',
    minHeight: 150,
    marginBottom: 16,
  },
  supportNote: {
    fontSize: 13,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonDisabled: {
    backgroundColor: '#B0D4FF',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  accountCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 20,
  },
  accountAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  accountAvatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  accountHeaderInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 14,
    color: '#666',
  },
  accountDetailsContainer: {
    gap: 1,
  },
  accountDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accountDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  accountDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
    maxWidth: '55%',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  editSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  editFormGroup: {
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#f9f9f9',
    minHeight: 48,
  },
});
