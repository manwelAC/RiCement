// Admin Complaints Management
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextStyle, View, ViewStyle } from 'react-native';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { auth, db } from '../../config/firebase';
import { adminService } from '../../services/adminService';

interface Complaint {
  id: string;
  username: string;
  email: string;
  complaint: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

export default function ComplaintsScreen() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // View Modal
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

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

      loadComplaints();
    });

    return () => unsubscribe();
  }, []);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const complaintsQuery = query(
        collection(db, 'complaints'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(complaintsQuery);
      
      const complaintsList: Complaint[] = snapshot.docs.map(doc => ({
        id: doc.id,
        username: doc.data().username || 'Unknown',
        email: doc.data().email || 'Unknown',
        complaint: doc.data().complaint || '',
        status: doc.data().status || 'pending',
        createdAt: doc.data().createdAt || new Date().toISOString(),
      }));
      
      setComplaints(complaintsList);
    } catch (error) {
      console.error('Error loading complaints:', error);
      if (Platform.OS === 'web') {
        alert('Failed to load complaints');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleView = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsViewModalVisible(true);
  };

  const handleUpdateStatus = async (complaintId: string, newStatus: 'pending' | 'reviewed' | 'resolved') => {
    try {
      const complaintRef = doc(db, 'complaints', complaintId);
      await updateDoc(complaintRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      if (Platform.OS === 'web') {
        alert(`Complaint status updated to ${newStatus}`);
      }
      
      loadComplaints();
    } catch (error) {
      console.error('Error updating complaint:', error);
      if (Platform.OS === 'web') {
        alert('Failed to update complaint status');
      }
    }
  };

  const handleDelete = async (complaint: Complaint) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to delete this complaint from "${complaint.email}"?\n\n` +
        `This action cannot be undone!`
      );
      
      if (!confirmed) return;
    }

    try {
      await deleteDoc(doc(db, 'complaints', complaint.id));
      
      if (Platform.OS === 'web') {
        alert('Complaint deleted successfully!');
      }
      
      loadComplaints();
    } catch (error) {
      console.error('Error deleting complaint:', error);
      if (Platform.OS === 'web') {
        alert('Failed to delete complaint');
      }
    }
  };

  const filteredComplaints = complaints.filter(complaint => 
    complaint.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    complaint.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    complaint.complaint.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (Platform.OS !== 'web') {
    return null;
  }

  if (loading) {
    return (
      <View style={containerStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={textStyles.loadingText}>Loading complaints...</Text>
      </View>
    );
  }

  return (
    <AdminLayout title="Complaints">
      <View style={containerStyles.container}>
        {/* Header Section */}
        <View style={containerStyles.header}>
          <View>
            <Text style={textStyles.pageTitle}>Complaints & Feedback</Text>
            <Text style={textStyles.pageSubtitle}>Manage user complaints and feedback</Text>
          </View>
          <View style={containerStyles.headerStats}>
            <View style={containerStyles.statBadge}>
              <Text style={textStyles.statValue}>{complaints.length}</Text>
              <Text style={textStyles.statLabel}>Total</Text>
            </View>
            <View style={[containerStyles.statBadge, { backgroundColor: '#FFF3CD' }]}>
              <Text style={[textStyles.statValue, { color: '#856404' }]}>
                {complaints.filter(c => c.status === 'pending').length}
              </Text>
              <Text style={textStyles.statLabel}>Pending</Text>
            </View>
            <View style={[containerStyles.statBadge, { backgroundColor: '#D1ECF1' }]}>
              <Text style={[textStyles.statValue, { color: '#0C5460' }]}>
                {complaints.filter(c => c.status === 'reviewed').length}
              </Text>
              <Text style={textStyles.statLabel}>Reviewed</Text>
            </View>
            <View style={[containerStyles.statBadge, { backgroundColor: '#D4EDDA' }]}>
              <Text style={[textStyles.statValue, { color: '#155724' }]}>
                {complaints.filter(c => c.status === 'resolved').length}
              </Text>
              <Text style={textStyles.statLabel}>Resolved</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={containerStyles.searchContainer}>
          <Text style={textStyles.searchIcon}>🔍</Text>
          <TextInput
            style={textStyles.searchInput}
            placeholder="Search by email, username, or complaint..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Complaints Cards */}
        {filteredComplaints.length === 0 ? (
          <View style={containerStyles.emptyState}>
            <Text style={textStyles.emptyStateText}>
              {searchQuery ? 'No complaints found matching your search' : 'No complaints found'}
            </Text>
          </View>
        ) : (
          <ScrollView style={containerStyles.complaintsList}>
            <View style={containerStyles.complaintsGrid}>
              {filteredComplaints.map((complaint) => (
                <Pressable 
                  key={complaint.id} 
                  style={containerStyles.complaintCard}
                  onPress={() => handleView(complaint)}
                >
                  <View style={containerStyles.cardHeader}>
                    <View style={containerStyles.userIconContainer}>
                      <Text style={textStyles.userIcon}>👤</Text>
                    </View>
                    <View style={containerStyles.cardHeaderInfo}>
                      <Text style={textStyles.cardEmail} numberOfLines={1}>{complaint.email}</Text>
                      <Text style={textStyles.cardUsername} numberOfLines={1}>{complaint.username}</Text>
                    </View>
                  </View>

                  <Text style={textStyles.cardComplaint} numberOfLines={3}>
                    {complaint.complaint}
                  </Text>

                  <View style={containerStyles.cardFooter}>
                    <View style={[
                      containerStyles.cardStatusBadge,
                      { 
                        backgroundColor: 
                          complaint.status === 'pending' ? '#FFF3CD' :
                          complaint.status === 'reviewed' ? '#D1ECF1' : '#D4EDDA'
                      }
                    ]}>
                      <Text style={[
                        textStyles.cardStatusText,
                        { 
                          color: 
                            complaint.status === 'pending' ? '#856404' :
                            complaint.status === 'reviewed' ? '#0C5460' : '#155724'
                        }
                      ]}>
                        {complaint.status === 'pending' ? '⏳ Pending' :
                         complaint.status === 'reviewed' ? '👁️ Reviewed' : '✓ Resolved'}
                      </Text>
                    </View>
                    <Text style={textStyles.cardDate}>
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Info Box */}
        <View style={containerStyles.infoBox}>
          <Text style={textStyles.infoTitle}>ℹ️ Complaint Management Notes:</Text>
          <Text style={textStyles.infoText}>• View: Read full complaint details and update status</Text>
          <Text style={textStyles.infoText}>• Status: Pending → Reviewed → Resolved</Text>
          <Text style={textStyles.infoText}>• Delete: Permanently removes the complaint from the database</Text>
        </View>

        {/* View Modal */}
        <Modal
          visible={isViewModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsViewModalVisible(false)}
        >
          <Pressable 
            style={containerStyles.modalOverlay} 
            onPress={() => setIsViewModalVisible(false)}
          >
            <Pressable style={containerStyles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={containerStyles.modalHeader}>
                <Text style={textStyles.modalTitle}>Complaint Details</Text>
                <Pressable onPress={() => setIsViewModalVisible(false)}>
                  <Text style={textStyles.closeIcon}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={containerStyles.modalBody}>
                <View style={containerStyles.detailRow}>
                  <Text style={textStyles.detailLabel}>Email:</Text>
                  <Text style={textStyles.detailValue}>{selectedComplaint?.email}</Text>
                </View>
                
                <View style={containerStyles.detailRow}>
                  <Text style={textStyles.detailLabel}>Username:</Text>
                  <Text style={textStyles.detailValue}>{selectedComplaint?.username}</Text>
                </View>

                <View style={containerStyles.detailRow}>
                  <Text style={textStyles.detailLabel}>Status:</Text>
                  <View style={[
                    containerStyles.statusBadge,
                    { 
                      backgroundColor: 
                        selectedComplaint?.status === 'pending' ? '#FFC107' :
                        selectedComplaint?.status === 'reviewed' ? '#2196F3' : '#4CAF50'
                    }
                  ]}>
                    <Text style={textStyles.statusBadgeText}>
                      {selectedComplaint?.status === 'pending' ? '⏳ Pending' :
                       selectedComplaint?.status === 'reviewed' ? '👁️ Reviewed' : '✓ Resolved'}
                    </Text>
                  </View>
                </View>

                <View style={containerStyles.detailRow}>
                  <Text style={textStyles.detailLabel}>Date Submitted:</Text>
                  <Text style={textStyles.detailValue}>
                    {selectedComplaint && new Date(selectedComplaint.createdAt).toLocaleString()}
                  </Text>
                </View>

                <View style={containerStyles.complaintSection}>
                  <Text style={textStyles.detailLabel}>Complaint:</Text>
                  <Text style={textStyles.complaintText}>{selectedComplaint?.complaint}</Text>
                </View>

                <Text style={textStyles.statusSectionTitle}>Update Status:</Text>
                <View style={containerStyles.statusButtons}>
                  <Pressable 
                    style={[containerStyles.statusButton, { backgroundColor: '#FFC107' }]}
                    onPress={() => {
                      if (selectedComplaint) {
                        handleUpdateStatus(selectedComplaint.id, 'pending');
                        setIsViewModalVisible(false);
                      }
                    }}
                  >
                    <Text style={textStyles.statusButtonText}>⏳ Pending</Text>
                  </Pressable>
                  <Pressable 
                    style={[containerStyles.statusButton, { backgroundColor: '#2196F3' }]}
                    onPress={() => {
                      if (selectedComplaint) {
                        handleUpdateStatus(selectedComplaint.id, 'reviewed');
                        setIsViewModalVisible(false);
                      }
                    }}
                  >
                    <Text style={textStyles.statusButtonText}>👁️ Reviewed</Text>
                  </Pressable>
                  <Pressable 
                    style={[containerStyles.statusButton, { backgroundColor: '#4CAF50' }]}
                    onPress={() => {
                      if (selectedComplaint) {
                        handleUpdateStatus(selectedComplaint.id, 'resolved');
                        setIsViewModalVisible(false);
                      }
                    }}
                  >
                    <Text style={textStyles.statusButtonText}>✓ Resolved</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </AdminLayout>
  );
}

const containerStyles = StyleSheet.create<{[key: string]: ViewStyle}>({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
  complaintsList: {
    flex: 1,
    marginBottom: 24,
  },
  complaintsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  complaintCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '30%' as any,
    minWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    cursor: 'pointer' as any,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
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
    width: '90%',
    maxWidth: 600,
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
  modalBody: {
    padding: 20,
  },
  detailRow: {
    marginBottom: 16,
  },
  complaintSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
});

const textStyles = StyleSheet.create<{[key: string]: TextStyle}>({
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  userIcon: {
    fontSize: 24,
  },
  cardEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardUsername: {
    fontSize: 13,
    color: '#666',
  },
  cardComplaint: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 16,
    minHeight: 60,
  },
  cardStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardDate: {
    fontSize: 12,
    color: '#999',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
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
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeIcon: {
    fontSize: 24,
    color: '#666',
    cursor: 'pointer' as any,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
  },
  complaintText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  statusSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
