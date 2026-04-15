// Admin Dashboard
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { StatCard } from '../../components/admin/StatCard';
import { auth } from '../../config/firebase';
import { adminService, DashboardStats } from '../../services/adminService';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

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

      // Load dashboard stats
      loadStats();
    });

    return () => unsubscribe();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const dashboardStats = await adminService.getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading stats:', error);
      if (Platform.OS === 'web') {
        alert('Failed to load dashboard statistics');
      }
    } finally {
      setLoading(false);
    }
  };

  if (Platform.OS !== 'web') {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <View style={styles.container}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to RiCement Admin</Text>
          <Text style={styles.welcomeSubtitle}>
            Monitor your system statistics and manage operations
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon="👥"
            color="#007AFF"
            subtitle="Registered users"
          />
          <StatCard
            title="Total Projects"
            value={stats?.totalProjects || 0}
            icon="📋"
            color="#34C759"
            subtitle="All projects"
          />
          <StatCard
            title="Completed Projects"
            value={stats?.completedProjects || 0}
            icon="✅"
            color="#5856D6"
            subtitle={`${stats?.totalProjects ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0}% completion rate`}
          />
          <StatCard
            title="RHB Blocks Produced"
            value={stats?.totalRHBBlocks || 0}
            icon="🧱"
            color="#FF9500"
            subtitle="Total blocks"
          />
        </View>

        {/* Project Status Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Status Overview</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusCard}>
              <View style={[styles.statusIndicator, { backgroundColor: '#FFC107' }]} />
              <View>
                <Text style={styles.statusValue}>{stats?.pendingProjects || 0}</Text>
                <Text style={styles.statusLabel}>In Queue</Text>
              </View>
            </View>
            <View style={styles.statusCard}>
              <View style={[styles.statusIndicator, { backgroundColor: '#2196F3' }]} />
              <View>
                <Text style={styles.statusValue}>{stats?.processingProjects || 0}</Text>
                <Text style={styles.statusLabel}>Processing</Text>
              </View>
            </View>
            <View style={styles.statusCard}>
              <View style={[styles.statusIndicator, { backgroundColor: '#4CAF50' }]} />
              <View>
                <Text style={styles.statusValue}>{stats?.completedProjects || 0}</Text>
                <Text style={styles.statusLabel}>Completed</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            💡 <Text style={styles.infoBold}>Tip:</Text> This dashboard shows real-time data from your Firebase database
          </Text>
        </View>
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
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 32,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statusCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  statusIndicator: {
    width: 8,
    height: 48,
    borderRadius: 4,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  infoSection: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  infoBold: {
    fontWeight: 'bold',
    color: '#333',
  },
});
