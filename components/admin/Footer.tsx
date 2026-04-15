import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    View
} from 'react-native';

export default function Footer() {
  return (
    <View style={styles.footer}>
      <View style={styles.footerContent}>
        <View style={styles.footerSection}>
          <View style={styles.footerLogoContainer}>
            <Image
              source={require('../../public/images/logo.png')}
              style={styles.footerLogoImage}
              resizeMode="contain"
            />
            <Text style={styles.footerTitle}>RiCement</Text>
          </View>
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
  );
}

const styles = StyleSheet.create({
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
  footerLogoContainer: {
    flexDirection: 'row' as any,
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  footerLogoImage: {
    width: 28,
    height: 28,
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
