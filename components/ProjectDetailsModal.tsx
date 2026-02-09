import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface Collaborator {
  userId: string;
  fullName: string;
  email: string;
  blocksContributed: number;
  joinedAt?: Date;
}

interface Project {
  id: string;
  name: string;
  blocks: number;
  estimatedTime: string;
  date: string;
  status: string;
  userId: string;
  companyId?: string;
  collaborators?: Collaborator[];
  completedBlocks?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectDetailsModalProps {
  visible: boolean;
  project: Project | null;
  onClose: () => void;
}

export function ProjectDetailsModal({ visible, project, onClose }: ProjectDetailsModalProps) {
  if (!project) return null;

  const getTotalContributions = () => {
    if (!project.collaborators) return 0;
    return project.collaborators.reduce((sum, collab) => sum + collab.blocksContributed, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return '#34C759';
      case 'Processing':
      case 'Mixing':
      case 'Pouring':
      case 'Pouring2':
      case 'Molding':
        return '#FF9500';
      case 'Queue':
        return '#007AFF';
      case 'Paused':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.title}>{project.name}</ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle" size={32} color="#8E8E93" />
            </Pressable>
          </View>

          {/* Scrollable Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Project Info */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Project Information</ThemedText>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Status:</ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
                  <ThemedText style={styles.statusText}>{project.status}</ThemedText>
                </View>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Total Blocks:</ThemedText>
                <ThemedText style={styles.infoValue}>{project.blocks}</ThemedText>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Completed Blocks:</ThemedText>
                <ThemedText style={styles.infoValue}>{project.completedBlocks || 0}</ThemedText>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Progress:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {project.completedBlocks && project.blocks > 0
                    ? `${Math.round((project.completedBlocks / project.blocks) * 100)}%`
                    : '0%'}
                </ThemedText>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Estimated Time:</ThemedText>
                <ThemedText style={styles.infoValue}>{project.estimatedTime}</ThemedText>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Date:</ThemedText>
                <ThemedText style={styles.infoValue}>{project.date}</ThemedText>
              </View>
            </View>

            {/* Team Members & Contributions */}
            {project.collaborators && project.collaborators.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Team Members & Contributions</ThemedText>
                
                <View style={styles.contributionsSummary}>
                  <View style={styles.summaryItem}>
                    <ThemedText style={styles.summaryLabel}>Total Team:</ThemedText>
                    <ThemedText style={styles.summaryValue}>
                      {project.collaborators.length}
                    </ThemedText>
                  </View>
                  <View style={styles.summaryItem}>
                    <ThemedText style={styles.summaryLabel}>Contributed:</ThemedText>
                    <ThemedText style={styles.summaryValue}>
                      {getTotalContributions()} blocks
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.collaboratorsList}>
                  {project.collaborators.map((collaborator, index) => (
                    <View key={collaborator.userId} style={[
                      styles.collaboratorCard,
                      index !== project.collaborators!.length - 1 && styles.collaboratorCardBorder
                    ]}>
                      {/* Avatar */}
                      <View style={styles.avatarContainer}>
                        <ThemedText style={styles.avatarText}>
                          {collaborator.fullName.charAt(0).toUpperCase()}
                        </ThemedText>
                      </View>

                      {/* Info */}
                      <View style={styles.collaboratorInfo}>
                        <ThemedText style={styles.collaboratorName}>
                          {collaborator.fullName}
                        </ThemedText>
                        <ThemedText style={styles.collaboratorEmail}>
                          {collaborator.email}
                        </ThemedText>
                      </View>

                      {/* Contribution Badge */}
                      <View style={styles.contributionBadge}>
                        <Ionicons name="cube-outline" size={16} color="#007AFF" />
                        <ThemedText style={styles.contributionText}>
                          {collaborator.blocksContributed}
                        </ThemedText>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* No Team Members */}
            {(!project.collaborators || project.collaborators.length === 0) && (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#C7C7CC" />
                <ThemedText style={styles.emptyStateText}>No team members assigned</ThemedText>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  contributionsSummary: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  collaboratorsList: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    overflow: 'hidden',
  },
  collaboratorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  collaboratorCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  collaboratorInfo: {
    flex: 1,
  },
  collaboratorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  collaboratorEmail: {
    fontSize: 12,
    color: '#8E8E93',
  },
  contributionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  contributionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 12,
  },
});
