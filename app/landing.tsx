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

export default function LandingPage() {
  const router = useRouter();

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <ScrollView style={styles.container} scrollEventThrottle={16}>
      {/* Navigation Bar */}
      <View style={styles.navbar}>
        <View style={styles.navContent}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>RiCement</Text>
          </View>
          <View style={styles.navLinks}>
            <Pressable onPress={() => {}} style={styles.navLink}>
              <Text style={styles.navLinkText}>Mga Tampok</Text>
            </Pressable>
            <Pressable onPress={() => {}} style={styles.navLink}>
              <Text style={styles.navLinkText}>Paano ito Gumagana</Text>
            </Pressable>
            <Pressable onPress={() => {}} style={styles.navLink}>
              <Text style={styles.navLinkText}>Patungkol</Text>
            </Pressable>
            <Pressable 
              onPress={() => router.push('/login')}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </View>

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
              onPress={() => router.push('/signup')}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed
              ]}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </Pressable>
            <Pressable 
              onPress={() => {}}
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
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>🌾 IoT Innovation</Text>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Key Features</Text>
        <Text style={styles.sectionSubtitle}>Everything you need for sustainable cement production</Text>
        
        <View style={styles.featuresGrid}>
          {/* Feature 1 */}
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.iconText}>📱</Text>
            </View>
            <Text style={styles.featureTitle}>Mobile Control</Text>
            <Text style={styles.featureDescription}>
              Monitor and control your rice husk ash production from anywhere with our intuitive mobile app
            </Text>
          </View>

          {/* Feature 2 */}
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.iconText}>🤖</Text>
            </View>
            <Text style={styles.featureTitle}>IoT Automation</Text>
            <Text style={styles.featureDescription}>
              Automated monitoring system ensures optimal production conditions and maximum efficiency
            </Text>
          </View>

          {/* Feature 3 */}
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.iconText}>📊</Text>
            </View>
            <Text style={styles.featureTitle}>Real-time Analytics</Text>
            <Text style={styles.featureDescription}>
              Track production metrics, efficiency rates, and quality standards in real-time
            </Text>
          </View>

          {/* Feature 4 */}
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.iconText}>♻️</Text>
            </View>
            <Text style={styles.featureTitle}>Sustainable Impact</Text>
            <Text style={styles.featureDescription}>
              Convert agricultural waste into valuable cement additives, reducing environmental impact
            </Text>
          </View>

          {/* Feature 5 */}
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.iconText}>💰</Text>
            </View>
            <Text style={styles.featureTitle}>Farmer Empowerment</Text>
            <Text style={styles.featureDescription}>
              Create additional income streams for farmers by turning rice husk waste into premium products
            </Text>
          </View>

          {/* Feature 6 */}
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.iconText}>🔒</Text>
            </View>
            <Text style={styles.featureTitle}>Secure & Reliable</Text>
            <Text style={styles.featureDescription}>
              Enterprise-grade security and reliable infrastructure for critical production processes
            </Text>
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

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerSection}>
            <Text style={styles.footerTitle}>RiCement</Text>
            <Text style={styles.footerText}>
              IoT-Based Rice Husk Ash Production System
            </Text>
          </View>
          <View style={styles.footerSection}>
            <Text style={styles.footerSectionTitle}>Product</Text>
            <Text style={styles.footerLink}>Features</Text>
            <Text style={styles.footerLink}>Pricing</Text>
            <Text style={styles.footerLink}>Security</Text>
          </View>
          <View style={styles.footerSection}>
            <Text style={styles.footerSectionTitle}>Company</Text>
            <Text style={styles.footerLink}>About</Text>
            <Text style={styles.footerLink}>Blog</Text>
            <Text style={styles.footerLink}>Contact</Text>
          </View>
          <View style={styles.footerSection}>
            <Text style={styles.footerSectionTitle}>Legal</Text>
            <Text style={styles.footerLink}>Privacy</Text>
            <Text style={styles.footerLink}>Terms</Text>
            <Text style={styles.footerLink}>License</Text>
          </View>
        </View>
        <View style={styles.footerBottom}>
          <Text style={styles.footerBottomText}>
            © 2025 RiCement. All rights reserved.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  // Navbar
  navbar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 16,
    paddingHorizontal: 24,
    position: 'sticky' as any,
    top: 0,
    zIndex: 100,
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1200,
    marginHorizontal: 'auto' as any,
  },
  logo: {
    flex: 1,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  navLink: {
    padding: 8,
  },
  navLinkText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  loginButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // Hero Section
  hero: {
    flexDirection: 'row' as any,
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    gap: 60,
  },
  heroContent: {
    flex: 1,
    maxWidth: 500,
  },
  heroTitle: {
    fontSize: 56,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 24,
    lineHeight: 64,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 32,
    lineHeight: 28,
    fontWeight: '400',
  },
  heroButtons: {
    flexDirection: 'row' as any,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
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
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  secondaryButtonPressed: {
    backgroundColor: '#f0f0f0',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  heroImage: {
    flex: 1,
    minHeight: 400,
  },
  imagePlaceholder: {
    width: '100%',
    height: 400,
    backgroundColor: '#e8f4f8',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
  },

  // Features Section
  featuresSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 44,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center' as any,
  },
  sectionSubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center' as any,
    marginBottom: 56,
  },
  featuresGrid: {
    flexDirection: 'row' as any,
    flexWrap: 'wrap' as any,
    gap: 24,
    justifyContent: 'space-between',
  },
  featureCard: {
    flex: 1,
    minWidth: 300,
    padding: 32,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  featureIcon: {
    marginBottom: 16,
  },
  iconText: {
    fontSize: 40,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },

  // How It Works Section
  howItWorksSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#f8f9fa',
  },
  stepsContainer: {
    flexDirection: 'row' as any,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 56,
    flexWrap: 'wrap' as any,
  },
  step: {
    flex: 1,
    minWidth: 200,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center' as any,
    borderWidth: 1,
    borderColor: '#f0f0f0',
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
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center' as any,
  },
  stepDescription: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center' as any,
  },
  arrow: {
    marginHorizontal: 8,
  },
  arrowText: {
    fontSize: 24,
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
  },

  // CTA Section
  ctaSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#f8f9fa',
    alignItems: 'center' as any,
  },
  ctaTitle: {
    fontSize: 44,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center' as any,
    marginBottom: 16,
  },
  ctaSubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center' as any,
    marginBottom: 32,
  },
  ctaButtons: {
    flexDirection: 'row' as any,
    gap: 16,
  },
  ctaPrimaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
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
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  ctaSecondaryButtonPressed: {
    backgroundColor: '#f0f0f0',
  },
  ctaSecondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Footer
  footer: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  footerContent: {
    flexDirection: 'row' as any,
    gap: 60,
    marginBottom: 40,
    flexWrap: 'wrap' as any,
  },
  footerSection: {
    flex: 1,
    minWidth: 200,
  },
  footerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  footerSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    lineHeight: 22,
  },
  footerLink: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingVertical: 24,
    alignItems: 'center' as any,
  },
  footerBottomText: {
    fontSize: 12,
    color: '#666',
  },
});
