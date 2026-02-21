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

export default function HowItWorksPage() {
  const router = useRouter();

  if (Platform.OS !== 'web') {
    return null;
  }

  const steps = [
    {
      number: 1,
      title: 'Harvest Rice Husk',
      description: 'Collect rice husk from agricultural activities',
      details: [
        'Source from local farmers and rice milling facilities',
        'Quality inspection and sorting',
        'Proper storage and handling procedures',
        'Efficient logistics and transportation'
      ],
      icon: 'leaf'
    },
    {
      number: 2,
      title: 'IoT Processing',
      description: 'Automated conversion to rice husk ash',
      details: [
        'Controlled high-temperature processing',
        'Real-time sensor monitoring',
        'Automated temperature and humidity control',
        'Safety protocols and emission management'
      ],
      icon: 'cog'
    },
    {
      number: 3,
      title: 'Quality Control',
      description: 'Monitor production with real-time analytics',
      details: [
        'Comprehensive testing and analysis',
        'Quality metrics tracking',
        'Compliance with international standards',
        'Detailed production reports'
      ],
      icon: 'check-circle'
    },
    {
      number: 4,
      title: 'Market Ready',
      description: 'Premium cement additive for sale',
      details: [
        'Packaging and branding',
        'Distribution network integration',
        'Customer support and logistics',
        'Long-term partnership programs'
      ],
      icon: 'package'
    }
  ];

  const benefits = [
    {
      icon: 'clock-fast',
      title: 'Faster Processing',
      text: 'Automated system reduces processing time by 60%'
    },
    {
      icon: 'leaf-circle',
      title: 'Eco-Friendly',
      text: 'Zero waste production with sustainable practices'
    },
    {
      icon: 'chart-line',
      title: 'Higher Yield',
      text: 'Optimized processes increase output by up to 40%'
    },
    {
      icon: 'shield-check',
      title: 'Quality Assured',
      text: 'Meets all international cement additive standards'
    }
  ];

  return (
    <ScrollView style={styles.container} scrollEventThrottle={16}>
      <Header />

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>How It Works</Text>
        <Text style={styles.heroSubtitle}>
          A streamlined process from harvest to market
        </Text>
        <Text style={styles.heroDescription}>
          Our automated IoT system transforms rice husk waste into premium cement additives through a carefully optimized 4-step process.
        </Text>
      </View>

      {/* Steps Section */}
      <View style={styles.stepsSection}>
        {steps.map((step, index) => (
          <View key={step.number}>
            <View style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumberCircle}>
                  <Text style={styles.stepNumberText}>{step.number}</Text>
                </View>
                <View style={styles.stepTitleContainer}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepSubtitle}>{step.description}</Text>
                </View>
              </View>

              <View style={styles.stepDetails}>
                {step.details.map((detail, idx) => (
                  <View key={idx} style={styles.detailItem}>
                    <View style={styles.detailBullet} />
                    <Text style={styles.detailText}>{detail}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.stepIcon}>
                <MaterialCommunityIcons name={step.icon as any} size={48} color="#007AFF" />
              </View>
            </View>

            {index < steps.length - 1 && (
              <View style={styles.arrowContainer}>
                <MaterialCommunityIcons name="arrow-down" size={32} color="#007AFF" />
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Benefits Section */}
      <View style={styles.benefitsSection}>
        <Text style={styles.sectionTitle}>Why Our Process?</Text>
        <View style={styles.benefitsGrid}>
          {benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitCard}>
              <View style={styles.benefitIconContainer}>
                <MaterialCommunityIcons name={benefit.icon as any} size={40} color="#007AFF" />
              </View>
              <Text style={styles.benefitTitle}>{benefit.title}</Text>
              <Text style={styles.benefitText}>{benefit.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Technical Specifications */}
      <View style={styles.specsSection}>
        <Text style={styles.sectionTitle}>Technical Specifications</Text>
        <View style={styles.specsGrid}>
          <View style={styles.specCard}>
            <Text style={styles.specLabel}>Processing Temperature</Text>
            <Text style={styles.specValue}>800-1000°C</Text>
          </View>
          <View style={styles.specCard}>
            <Text style={styles.specLabel}>Humidity Control</Text>
            <Text style={styles.specValue}>30-50% RH</Text>
          </View>
          <View style={styles.specCard}>
            <Text style={styles.specLabel}>Output Fineness</Text>
            <Text style={styles.specValue}>≤45 μm</Text>
          </View>
          <View style={styles.specCard}>
            <Text style={styles.specLabel}>Silica Content</Text>
            <Text style={styles.specValue}>88-92%</Text>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
        <Text style={styles.ctaSubtitle}>
          Join producers already using RiCement to revolutionize their operations
        </Text>
        <View style={styles.ctaButtons}>
          <Pressable 
            onPress={() => router.push('/signup')}
            style={({ pressed }) => [
              styles.ctaPrimaryButton,
              pressed && styles.ctaPrimaryButtonPressed
            ]}
          >
            <Text style={styles.ctaPrimaryButtonText}>Start Your Journey</Text>
          </Pressable>
          <Pressable 
            onPress={() => router.push('/(admin)/landing')}
            style={({ pressed }) => [
              styles.ctaSecondaryButton,
              pressed && styles.ctaSecondaryButtonPressed
            ]}
          >
            <Text style={styles.ctaSecondaryButtonText}>Back to Home</Text>
          </Pressable>
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

  // Steps Section
  stepsSection: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: '#f9f9f9',
    maxWidth: 900,
    marginHorizontal: 'auto' as any,
    width: '100%' as any,
  },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    position: 'relative' as any,
  },
  stepHeader: {
    flexDirection: 'row' as any,
    alignItems: 'flex-start',
    gap: 20,
    marginBottom: 24,
  },
  stepNumberCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  stepNumberText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  stepTitleContainer: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },
  stepDetails: {
    gap: 12,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row' as any,
    alignItems: 'flex-start',
    gap: 12,
  },
  detailBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginTop: 8,
  },
  detailText: {
    fontSize: 15,
    color: '#555',
    flex: 1,
    lineHeight: 22,
  },
  stepIcon: {
    position: 'absolute' as any,
    top: 32,
    right: 32,
    opacity: 0.1,
  },
  arrowContainer: {
    alignItems: 'center' as any,
    paddingVertical: 24,
  },

  // Timeline Section
  timelineSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  timelineGrid: {
    flexDirection: 'row' as any,
    flexWrap: 'wrap' as any,
    gap: 20,
    justifyContent: 'center',
    maxWidth: 1200,
    marginHorizontal: 'auto' as any,
  },
  timelineCard: {
    flex: 1,
    minWidth: 240,
    padding: 24,
    backgroundColor: '#f0f7ff',
    borderRadius: 16,
    alignItems: 'center' as any,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  timelineLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center' as any,
  },
  timelineValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#007AFF',
    marginBottom: 8,
    textAlign: 'center' as any,
  },
  timelineDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as any,
    lineHeight: 20,
  },

  // Benefits Section
  benefitsSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#f9f9f9',
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
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center' as any,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  benefitIconContainer: {
    marginBottom: 16,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center' as any,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center' as any,
  },

  // Specs Section
  specsSection: {
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
  specsGrid: {
    flexDirection: 'row' as any,
    flexWrap: 'wrap' as any,
    gap: 20,
    justifyContent: 'center',
    maxWidth: 1000,
    marginHorizontal: 'auto' as any,
  },
  specCard: {
    flex: 1,
    minWidth: 200,
    padding: 24,
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    alignItems: 'center' as any,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  specLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center' as any,
  },
  specValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
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
