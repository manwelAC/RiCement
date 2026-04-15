import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Footer from '../../components/admin/Footer';
import Header from '../../components/admin/Header';

export default function LandingPage() {
  const router = useRouter();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <ScrollView style={styles.container} scrollEventThrottle={16}>
      <Header />

      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>
            Sustainable Cement Innovation
          </Text>
          <Text style={styles.heroSubtitle}>
            Transform agricultural waste into premium cement additives using IoT technology
          </Text>
          <View style={styles.heroButtons}>
            <Pressable 
              onPress={() => router.push('/(admin)/features')}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed
              ]}
            >
              <Text style={styles.secondaryButtonText}>Learn More</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.heroImage}>
          <Image
            source={require('../../public/images/Rice Husk.jpg')}
            style={styles.heroImageContent}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* System Showcase Section */}
      <View style={styles.systemShowcaseSection}>
        <View style={styles.showcaseHeader}>
          <Text style={styles.showcaseTitle}>The RiCement System</Text>
          <Text style={styles.showcaseSubtitle}>Integrated IoT platform for intelligent production control</Text>
        </View>

        <View style={styles.systemGrid}>
          {/* Hardware Component */}
          <View style={styles.systemCard}>
            <View style={styles.systemCardHeader}>
              <MaterialCommunityIcons name="cog" size={32} color="#007AFF" />
              <Text style={styles.systemCardTitle}>Smart Hardware</Text>
            </View>
            <View style={styles.systemCardFeature}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureBulletText}>IoT sensors for real-time monitoring</Text>
            </View>
            <View style={styles.systemCardFeature}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureBulletText}>Automated control systems</Text>
            </View>
            <View style={styles.systemCardFeature}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureBulletText}>Temperature & humidity sensors</Text>
            </View>
          </View>

          {/* Connection Arrow */}
          <View style={styles.connectionArrow}>
            <MaterialCommunityIcons name="arrow-left-right" size={24} color="#007AFF" />
          </View>

          {/* Software Platform */}
          <View style={styles.systemCard}>
            <View style={styles.systemCardHeader}>
              <MaterialCommunityIcons name="cellphone" size={32} color="#007AFF" />
              <Text style={styles.systemCardTitle}>Mobile & Web App</Text>
            </View>
            <View style={styles.systemCardFeature}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureBulletText}>Live dashboard monitoring</Text>
            </View>
            <View style={styles.systemCardFeature}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureBulletText}>Remote equipment control</Text>
            </View>
            <View style={styles.systemCardFeature}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureBulletText}>Alerts & notifications</Text>
            </View>
          </View>

          {/* Connection Arrow */}
          <View style={styles.connectionArrow}>
            <MaterialCommunityIcons name="arrow-left-right" size={24} color="#007AFF" />
          </View>

          {/* Cloud & Analytics */}
          <View style={styles.systemCard}>
            <View style={styles.systemCardHeader}>
              <MaterialCommunityIcons name="cloud-outline" size={32} color="#007AFF" />
              <Text style={styles.systemCardTitle}>Cloud Analytics</Text>
            </View>
            <View style={styles.systemCardFeature}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureBulletText}>Data storage & processing</Text>
            </View>
            <View style={styles.systemCardFeature}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureBulletText}>Advanced analytics engine</Text>
            </View>
            <View style={styles.systemCardFeature}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureBulletText}>Historical data tracking</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Key Features</Text>
        <Text style={styles.sectionSubtitle}>Everything you need for sustainable cement production</Text>
        
        <View style={styles.featuresGrid}>
          {/* Feature 1 */}
          <Pressable 
            onPress={() => {}}
            style={({ pressed }) => [
              styles.featureCard,
              pressed && styles.featureCardPressed
            ]}
          >
            <View style={styles.featureIcon}>
              <MaterialCommunityIcons name="cellphone" size={44} color="#007AFF" />
            </View>
            <Text style={styles.featureTitle}>Mobile Control</Text>
            <Text style={styles.featureDescription}>
              Monitor and control your rice husk ash production from anywhere with our intuitive mobile app
            </Text>
          </Pressable>

          {/* Feature 2 */}
          <Pressable 
            onPress={() => {}}
            style={({ pressed }) => [
              styles.featureCard,
              pressed && styles.featureCardPressed
            ]}
          >
            <View style={styles.featureIcon}>
              <MaterialCommunityIcons name="robot" size={44} color="#007AFF" />
            </View>
            <Text style={styles.featureTitle}>IoT Automation</Text>
            <Text style={styles.featureDescription}>
              Automated monitoring system ensures optimal production conditions and maximum efficiency
            </Text>
          </Pressable>

          {/* Feature 3 */}
          <Pressable 
            onPress={() => {}}
            style={({ pressed }) => [
              styles.featureCard,
              pressed && styles.featureCardPressed
            ]}
          >
            <View style={styles.featureIcon}>
              <MaterialCommunityIcons name="chart-box-outline" size={44} color="#007AFF" />
            </View>
            <Text style={styles.featureTitle}>Real-time Analytics</Text>
            <Text style={styles.featureDescription}>
              Track production metrics, efficiency rates, and quality standards in real-time
            </Text>
          </Pressable>

          {/* Feature 4 */}
          <Pressable 
            onPress={() => {}}
            style={({ pressed }) => [
              styles.featureCard,
              pressed && styles.featureCardPressed
            ]}
          >
            <View style={styles.featureIcon}>
              <MaterialCommunityIcons name="recycle" size={44} color="#007AFF" />
            </View>
            <Text style={styles.featureTitle}>Sustainable Impact</Text>
            <Text style={styles.featureDescription}>
              Convert agricultural waste into valuable cement additives, reducing environmental impact
            </Text>
          </Pressable>

          {/* Feature 5 */}
          <Pressable 
            onPress={() => {}}
            style={({ pressed }) => [
              styles.featureCard,
              pressed && styles.featureCardPressed
            ]}
          >
            <View style={styles.featureIcon}>
              <MaterialCommunityIcons name="cash-multiple" size={44} color="#007AFF" />
            </View>
            <Text style={styles.featureTitle}>Farmer Empowerment</Text>
            <Text style={styles.featureDescription}>
              Create additional income streams for farmers by turning rice husk waste into premium products
            </Text>
          </Pressable>

          {/* Feature 6 */}
          <Pressable 
            onPress={() => {}}
            style={({ pressed }) => [
              styles.featureCard,
              pressed && styles.featureCardPressed
            ]}
          >
            <View style={styles.featureIcon}>
              <MaterialCommunityIcons name="shield-check" size={44} color="#007AFF" />
            </View>
            <Text style={styles.featureTitle}>Secure & Reliable</Text>
            <Text style={styles.featureDescription}>
              Enterprise-grade security and reliable infrastructure for critical production processes
            </Text>
          </Pressable>
        </View>

        <View style={styles.viewAllButtonContainer}>
          <Pressable 
            onPress={() => router.push('/(admin)/features')}
            style={({ pressed }) => [
              styles.viewAllButton,
              pressed && styles.viewAllButtonPressed
            ]}
          >
            <Text style={styles.viewAllButtonText}>View All Features</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#007AFF" />
          </Pressable>
        </View>
      </View>

      {/* Product Showcase Section */}
      <View style={styles.productShowcaseSection}>
        <View style={styles.productShowcaseContent}>
          <View style={styles.productTextContent}>
            <Text style={styles.productTitle}>Premium Quality Output</Text>
            <Text style={styles.productSubtitle}>
              Transform raw materials into high-quality cement additives
            </Text>
            <Text style={styles.productDescription}>
              Our IoT-powered system ensures consistent quality and performance of hollow blocks and cement products infused with rice husk ash. Every batch meets international standards for durability, strength, and sustainability.
            </Text>
            <View style={styles.productFeatures}>
              <View style={styles.productFeature}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#007AFF" />
                <Text style={styles.productFeatureText}>Enhanced durability</Text>
              </View>
              <View style={styles.productFeature}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#007AFF" />
                <Text style={styles.productFeatureText}>Superior strength</Text>
              </View>
              <View style={styles.productFeature}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#007AFF" />
                <Text style={styles.productFeatureText}>Eco-friendly composition</Text>
              </View>
            </View>
          </View>
          <View style={styles.productImageContainer}>
            <Image
              source={require('../../public/images/Hollow Blocks.jpg')}
              style={styles.productImage}
              resizeMode="cover"
            />
          </View>
        </View>
      </View>

      {/* How It Works Section */}
      <View style={styles.howItWorksSection}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepsContainer}>
          {/* Step 1 */}
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Harvest Rice Husk</Text>
            <Text style={styles.stepDescription}>
              Collect rice husk from agricultural activities
            </Text>
          </View>

          {/* Arrow */}
          <View style={styles.arrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>

          {/* Step 2 */}
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>IoT Processing</Text>
            <Text style={styles.stepDescription}>
              Automated conversion to rice husk ash
            </Text>
          </View>

          {/* Arrow */}
          <View style={styles.arrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>

          {/* Step 3 */}
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Quality Control</Text>
            <Text style={styles.stepDescription}>
              Monitor production with real-time analytics
            </Text>
          </View>

          {/* Arrow */}
          <View style={styles.arrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>

          {/* Step 4 */}
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepTitle}>Market Ready</Text>
            <Text style={styles.stepDescription}>
              Premium cement additive for sale
            </Text>
          </View>
        </View>

        <View style={styles.viewAllButtonContainer}>
          <Pressable 
            onPress={() => router.push('/(admin)/how-it-works')}
            style={({ pressed }) => [
              styles.viewAllButton,
              pressed && styles.viewAllButtonPressed
            ]}
          >
            <Text style={styles.viewAllButtonText}>Learn More</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#007AFF" />
          </Pressable>
        </View>
      </View>

      {/* Why Rice Husk Section */}
      <View style={styles.whyRiceSection}>
        <View style={styles.whyContent}>
          <Text style={styles.sectionTitle}>Why Rice Husk Ash?</Text>
          <Text style={styles.whyDescription}>
            Rice Husk Ash (RHA) is a proven pozzolanic material that enhances concrete durability and strength. By utilizing this agricultural byproduct, we:
          </Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.bulletPoint}>✓</Text>
              <Text style={styles.benefitText}>Reduce environmental waste from rice production</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.bulletPoint}>✓</Text>
              <Text style={styles.benefitText}>Create sustainable cement alternatives</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.bulletPoint}>✓</Text>
              <Text style={styles.benefitText}>Support farmer livelihoods</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.bulletPoint}>✓</Text>
              <Text style={styles.benefitText}>Meet growing sustainability demands in construction</Text>
            </View>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Ready to Transform Agriculture?</Text>
        <Text style={styles.ctaSubtitle}>Join us in revolutionizing sustainable cement production</Text>
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
            onPress={() => router.push('/(admin)/login')}
            style={({ pressed }) => [
              styles.ctaSecondaryButton,
              pressed && styles.ctaSecondaryButtonPressed
            ]}
          >
            <Text style={styles.ctaSecondaryButtonText}>Admin Access</Text>
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



  // Hero Section - iOS Style
  hero: {
    flexDirection: 'row' as any,
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 60,
  },
  heroContent: {
    flex: 1,
    maxWidth: 520,
  },
  heroTitle: {
    fontSize: 64,
    fontWeight: '800',
    color: '#000',
    marginBottom: 20,
    lineHeight: 72,
    letterSpacing: -1.5,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#555',
    marginBottom: 32,
    lineHeight: 28,
    fontWeight: '400',
  },
  heroButtons: {
    flexDirection: 'row' as any,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonPressed: {
    backgroundColor: '#0051D5',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: '#007AFF',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f0f7ff',
  },
  secondaryButtonPressed: {
    backgroundColor: '#e8f0ff',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  heroImage: {
    flex: 1,
    minHeight: 420,
  },
  heroImageContent: {
    width: '100%',
    height: 420,
    borderRadius: 20,
    overflow: 'hidden' as any,
  },

  // System Showcase Section
  systemShowcaseSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#f9f9f9',
  },
  showcaseHeader: {
    marginBottom: 56,
    maxWidth: 800,
    marginHorizontal: 'auto' as any,
  },
  showcaseTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center' as any,
    letterSpacing: -1,
  },
  showcaseSubtitle: {
    fontSize: 17,
    color: '#666',
    textAlign: 'center' as any,
    lineHeight: 26,
    fontWeight: '400',
  },
  systemGrid: {
    flexDirection: 'row' as any,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 60,
    flexWrap: 'wrap' as any,
  },
  systemCard: {
    flex: 1,
    minWidth: 280,
    padding: 28,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  systemCardHeader: {
    flexDirection: 'row' as any,
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  systemCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  systemCardFeature: {
    flexDirection: 'row' as any,
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  featureBullet: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 2,
  },
  featureBulletText: {
    fontSize: 15,
    color: '#555',
    flex: 1,
    lineHeight: 22,
  },
  connectionArrow: {
    alignItems: 'center' as any,
  },
  processFlowContainer: {
    maxWidth: 900,
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 24,
  },
  processFlowTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 28,
    textAlign: 'center' as any,
  },
  flowSteps: {
    flexDirection: 'row' as any,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap' as any,
  },
  flowStep: {
    alignItems: 'center' as any,
    minWidth: 100,
  },
  flowStepCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
    marginBottom: 10,
  },
  flowStepNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  flowStepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  flowStepDesc: {
    fontSize: 13,
    color: '#999',
  },
  flowArrow: {
    marginHorizontal: 4,
  },
  flowArrowText: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '300',
  },

  // Features Section - iOS Style
  featuresSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center' as any,
    letterSpacing: -1,
  },
  sectionSubtitle: {
    fontSize: 17,
    color: '#666',
    textAlign: 'center' as any,
    marginBottom: 48,
    lineHeight: 26,
  },
  featuresGrid: {
    flexDirection: 'row' as any,
    flexWrap: 'wrap' as any,
    gap: 20,
    justifyContent: 'space-between',
  },
  featureCard: {
    flex: 1,
    minWidth: 300,
    padding: 28,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  featureCardPressed: {
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  featureIcon: {
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
  },
  featureDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    fontWeight: '400',
  },

  viewAllButtonContainer: {
    alignItems: 'center' as any,
    marginTop: 48,
  },
  viewAllButton: {
    flexDirection: 'row' as any,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  viewAllButtonPressed: {
    backgroundColor: '#e8f0ff',
  },
  viewAllButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Product Showcase Section
  productShowcaseSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#f9f9f9',
  },
  productShowcaseContent: {
    flexDirection: 'row' as any,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 80,
    maxWidth: 1400,
    marginHorizontal: 'auto' as any,
    width: '100%',
  },
  productTextContent: {
    flex: 0.45,
    minWidth: 300,
  },
  productTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: '#000',
    marginBottom: 16,
    letterSpacing: -1.5,
    lineHeight: 56,
  },
  productSubtitle: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 20,
    lineHeight: 28,
  },
  productDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 28,
    marginBottom: 32,
    fontWeight: '400',
  },
  productFeatures: {
    gap: 16,
  },
  productFeature: {
    flexDirection: 'row' as any,
    alignItems: 'center',
    gap: 14,
  },
  productFeatureText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    lineHeight: 24,
  },
  productImageContainer: {
    flex: 0.55,
    minHeight: 420,
  },
  productImage: {
    width: '100%',
    height: 420,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },

  // How It Works Section
  howItWorksSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#f9f9f9',
  },
  stepsContainer: {
    flexDirection: 'row' as any,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 48,
    flexWrap: 'wrap' as any,
  },
  step: {
    flex: 1,
    minWidth: 200,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center' as any,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  stepNumber: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
    marginBottom: 16,
  },
  stepNumberText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
    textAlign: 'center' as any,
  },
  stepDescription: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center' as any,
    lineHeight: 20,
  },
  arrow: {
    marginHorizontal: 6,
  },
  arrowText: {
    fontSize: 22,
    color: '#007AFF',
    fontWeight: '300',
  },

  // Why Rice Section
  whyRiceSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  whyContent: {
    maxWidth: 700,
    marginHorizontal: 'auto' as any,
  },
  whyDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 26,
    marginBottom: 32,
    fontWeight: '400',
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row' as any,
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletPoint: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    lineHeight: 24,
  },

  // CTA Section
  ctaSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#f9f9f9',
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
  },
  ctaButtons: {
    flexDirection: 'row' as any,
    gap: 12,
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
    backgroundColor: '#f0f7ff',
  },
  ctaSecondaryButtonPressed: {
    backgroundColor: '#e8f0ff',
  },
  ctaSecondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },


});
