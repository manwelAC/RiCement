import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';

export default function IntroScreen() {
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  return (
    <ScrollView style={styles.container} scrollEventThrottle={16}>
      <ThemedView style={styles.header} lightColor="transparent" darkColor="transparent">
        <ThemedView style={styles.headerButtons} lightColor="transparent" darkColor="transparent">
          <Link href="/(tabs)" asChild>
            <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
              <ThemedText style={styles.backButton}>←</ThemedText>
            </Pressable>
          </Link>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.content} lightColor="transparent" darkColor="transparent">
        <ThemedText style={styles.title}>Ano ang RiCement?</ThemedText>
        <ThemedText style={styles.description}>
          Ang RiCement ay isang IoT-Based Rice Husk Ash "Ipa" Production System na may kasamang Mobile App Control upang mga gamit ang mga ipa bilang additive
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>Bakit Rice Husk?</ThemedText>
        <ThemedText style={styles.description}>
Ayon sa Journal of King Saud University - Engineering of Sciences, Rice Husk Ash o Sinunog na Ipa ay isang magandang pozzzolanic na materyales na maaaring alternatibo para sa pag gamit ng ordinaryong portland cement para mas mapatibay ang isang Hollow Block        </ThemedText>

        <ThemedText style={styles.sectionTitle}>Bakit dapat gamitin ang RiCement?</ThemedText>
        <ThemedView style={styles.features} lightColor="transparent" darkColor="transparent">
          <Pressable 
            style={({ pressed }) => [styles.featureItem, pressed && { opacity: 0.7 }]}
            onPress={() => setShowModal(true)}
          >
            <ThemedText style={styles.featureTitle}>Ginagawang yaman ang Environmental Waste</ThemedText>
          </Pressable>
          <ThemedView style={styles.featureItem} lightColor="transparent" darkColor="transparent">
            <ThemedText style={styles.featureTitle}>Buong kontrol ay nasa sa'yo</ThemedText>
          </ThemedView>
          <ThemedView style={styles.featureItem} lightColor="transparent" darkColor="transparent">
            <ThemedText style={styles.featureTitle}>Built-In Sustainability</ThemedText>
          </ThemedView>
        </ThemedView>

        <Link href="/login" asChild>
          <Pressable 
            style={({ pressed }) => [
              styles.signupButton,
              !hasReadTerms && styles.signupButtonDisabled,
              pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }
            ]}
            disabled={!hasReadTerms}
            onPress={() => {
              if (!hasReadTerms) {
                Alert.alert('Action Required', 'Please read the Terms of Service first');
              }
            }}
          >
            <ThemedText style={styles.signupButtonText}>LOGIN</ThemedText>
          </Pressable>
        </Link>

        <ThemedText style={styles.terms}>
          By signing up, you agree to our{' '}
          <ThemedText 
            style={styles.termsLink}
            onPress={() => {
              router.push('/terms');
              setHasReadTerms(true);
            }}
          >
            Terms of Service
          </ThemedText>
          {' '}and acknowledge that our{' '}
          <ThemedText 
            style={styles.termsLink}
            onPress={() => {
              router.push('/terms');
              setHasReadTerms(true);
            }}
          >
            Privacy Policy
          </ThemedText>
          {' '}applies to you.
        </ThemedText>
      </ThemedView>

      {/* Modal for "Turning Waste into Wealth" */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContainer}>
            <ThemedText style={styles.modalTitle}>Ginagawang yaman ang Environmental Waste</ThemedText>
            <ThemedText style={styles.modalText}>
              Ang Ipa ay nagiging environmental waste kapag ang palay ay na-ani na, lingid sa kaalaman natin na ang mga ipa na ito ay maaari palang gamiting silica na mahalaga sa pag hahalo ng semento.
            </ThemedText>
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}
              onPress={() => setShowModal(false)}
            >
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  } as const,
  signupButtonDisabled: {
    opacity: 0.5,
  } as const,
  termsLink: {
    color: '#3498DB',
    textDecorationLine: 'underline',
  } as const,
  header: {
    padding: 20,
    paddingTop: 40,
  } as const,
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as const,
  headerRight: {
    flexDirection: 'row',
    gap: 20,
  } as const,
  backButton: {
    color: '#2C3E50',
    fontSize: 24,
  } as const,
  headerButton: {
    color: '#2C3E50',
    fontSize: 16,
  } as const,
  content: {
    padding: 20,
  } as const,
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
    paddingVertical: 8,
  } as const,
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 30,
    marginBottom: 15,
  } as const,
  description: {
    fontSize: 16,
    color: '#34495E',
    lineHeight: 24,
  } as const,
  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 20,
  } as const,
  modelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  } as const,
  riceImage: {
    width: 230,
    height: 230,
    overflow: 'hidden',
  } as const,
  modelImage: {
    width: 300,
    height: 300,
    overflow: 'hidden',
  } as const,
  features: {
    marginTop: 20,
    gap: 15,
  } as const,
  featureItem: {
    backgroundColor: '#ECF0F1',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BDC3C7',
  } as const,
  featureTitle: {
    color: '#2C3E50',
    fontSize: 16,
    fontWeight: 'bold',
  } as const,
  signupButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#3498DB',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  } as const,
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  } as const,
  terms: {
    color: '#7F8C8D',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 30,
  } as const,
  placeholderText: {
    fontSize: 16,
    color: '#95A5A6',
    textAlign: 'center',
    opacity: 0.8,
  } as const,
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  } as const,
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 25,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  } as const,
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
    textAlign: 'center',
  } as const,
  modalText: {
    fontSize: 16,
    color: '#34495E',
    lineHeight: 24,
    textAlign: 'justify',
    marginBottom: 25,
  } as const,
  closeButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignSelf: 'center',
    shadowColor: '#3498DB',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  } as const,
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  } as const,
});
