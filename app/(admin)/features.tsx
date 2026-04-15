import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Footer from '../../components/admin/Footer';
import Header from '../../components/admin/Header';

export default function FeaturesPage() {
  const router = useRouter();

  if (Platform.OS !== 'web') {
    return null;
  }

  const features = [
    {
      id: 1,
      icon: 'cellphone',
      title: 'Mobile Control',
      description: 'Monitor and control your rice husk ash production from anywhere with our intuitive mobile app',
      details: [
        'Real-time production monitoring',
        'Remote equipment control',
        'Push notifications and alerts',
        'Production history and reports'
      ]
    },
    {
      id: 2,
      icon: 'robot',
      title: 'IoT Automation',
      description: 'Automated monitoring system ensures optimal production conditions and maximum efficiency',
      details: [
        'Sensor-based monitoring',
        'Automatic process adjustments',
        'Predictive maintenance alerts',
        'System optimization recommendations'
      ]
    },
    {
      id: 3,
      icon: 'chart-box-outline',
      title: 'Real-time Analytics',
      description: 'Track production metrics, efficiency rates, and quality standards in real-time',
      details: [
        'Live dashboard metrics',
        'Performance analytics',
        'Quality control tracking',
        'Data visualization and reports'
      ]
    },
    {
      id: 4,
      icon: 'recycle',
      title: 'Sustainable Impact',
      description: 'Convert agricultural waste into valuable cement additives, reducing environmental impact',
      details: [
        'Waste reduction tracking',
        'Environmental impact metrics',
        'Sustainability reporting',
        'Carbon footprint calculation'
      ]
    },
    {
      id: 5,
      icon: 'cash-multiple',
      title: 'Farmer Empowerment',
      description: 'Create additional income streams for farmers by turning rice husk waste into premium products',
      details: [
        'Fair price estimation',
        'Market demand analysis',
        'Payment processing',
        'Farmer network support'
      ]
    },
    {
      id: 6,
      icon: 'shield-check',
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security and reliable infrastructure for critical production processes',
      details: [
        'Data encryption',
        '99.9% uptime guarantee',
        'Regular security audits',
        'Compliance certifications'
      ]
    }
  ];

  return (
    <ScrollView style={styles.container} scrollEventThrottle={16}>
      <Header />

      {/* Features Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Key Features</Text>
        <Text style={styles.heroSubtitle}>
          Everything you need for sustainable cement production
        </Text>
        <Text style={styles.heroDescription}>
          Our comprehensive suite of tools and features designed to optimize your rice husk ash production process, from monitoring to market delivery.
        </Text>
      </View>

      {/* Features Grid */}
      <View style={styles.featuresContainer}>
        <View style={styles.featuresGrid}>
          {features.map((feature) => (
            <View key={feature.id} style={styles.featureCard}>
              <View style={styles.featureCardTop}>
                <View style={styles.featureIconContainer}>
                  <MaterialCommunityIcons name={feature.icon as any} size={44} color="#007AFF" />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
              </View>
              
              <Text style={styles.featureDescription}>
                {feature.description}
              </Text>

              <View style={styles.featureDetails}>
                {feature.details.map((detail, index) => (
                  <View key={index} style={styles.detailItem}>
                    <View style={styles.detailBullet} />
                    <Text style={styles.detailText}>{detail}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  // Hero Section
  heroSection: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    alignItems: 'center' as any,
    maxWidth: 800,
    marginHorizontal: 'auto' as any,
  },
  heroTitle: {
    fontSize: 56,
    fontWeight: '800',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center' as any,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center' as any,
  },
  heroDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 26,
    textAlign: 'center' as any,
    fontWeight: '400',
  },

  // Features Grid
  featuresContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: '#f9f9f9',
  },
  featuresGrid: {
    flexDirection: 'row' as any,
    flexWrap: 'wrap' as any,
    gap: 24,
    justifyContent: 'center',
    maxWidth: 1400,
    marginHorizontal: 'auto' as any,
  },
  featureCard: {
    flex: 1,
    minWidth: 340,
    maxWidth: 420,
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  featureCardTop: {
    marginBottom: 20,
  },
  featureIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  featureDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
    fontWeight: '400',
  },
  featureDetails: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row' as any,
    alignItems: 'flex-start',
    gap: 10,
  },
  detailBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    lineHeight: 20,
  },

  // Benefits Section
  benefitsSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: '#000',
    marginBottom: 48,
    textAlign: 'center' as any,
    letterSpacing: -1,
  },
  benefitsGrid: {
    flexDirection: 'row' as any,
    flexWrap: 'wrap' as any,
    gap: 20,
    justifyContent: 'center',
    maxWidth: 1200,
    marginHorizontal: 'auto' as any,
  },
  benefitCard: {
    flex: 1,
    minWidth: 250,
    padding: 28,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    alignItems: 'center' as any,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
    marginBottom: 10,
    textAlign: 'center' as any,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center' as any,
  },

  // CTA Section
  ctaSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#f0f7ff',
    alignItems: 'center' as any,
  },
  ctaTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center' as any,
    marginBottom: 12,
    letterSpacing: -1,
  },
  ctaSubtitle: {
    fontSize: 17,
    color: '#666',
    textAlign: 'center' as any,
    marginBottom: 32,
    lineHeight: 26,
    maxWidth: 600,
    marginHorizontal: 'auto' as any,
  },
  ctaButtons: {
    flexDirection: 'row' as any,
    gap: 12,
    justifyContent: 'center',
  },
  ctaPrimaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaPrimaryButtonPressed: {
    backgroundColor: '#0051D5',
  },
  ctaPrimaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  ctaSecondaryButton: {
    borderWidth: 1.5,
    borderColor: '#007AFF',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  ctaSecondaryButtonPressed: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  ctaSecondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
