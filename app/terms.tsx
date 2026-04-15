import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

export default function TermsScreen() {
  const [isChecked, setIsChecked] = useState(false);
  const router = useRouter();
  return (
    <ScrollView style={styles.container} scrollEventThrottle={16}>
      <ThemedView style={styles.header} lightColor="transparent" darkColor="transparent">
        <ThemedView style={styles.headerButtons} lightColor="transparent" darkColor="transparent">
          <Link href="/intro" asChild>
            <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
              <ThemedText style={styles.backButton}>←</ThemedText>
            </Pressable>
          </Link>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.content} lightColor="transparent" darkColor="transparent">
        <ThemedText style={styles.title}>Mga Tuntunin at Kasunduan</ThemedText>

        <ThemedView style={styles.section} lightColor="transparent" darkColor="transparent">
          <ThemedText style={styles.sectionTitle} lightColor="transparent" darkColor="transparent">Pag gamit ng App</ThemedText>
          <ThemedView style={styles.bulletPoints} lightColor="transparent" darkColor="transparent">
            <ThemedText style={styles.bulletPoint} lightColor="transparent" darkColor="transparent">
              • Sumasang-ayon kang gamitin ang app para lamang sa mga layuning ayon sa batas alinsunod sa Mga Tuntuning ito.
            </ThemedText>
            <ThemedText style={styles.bulletPoint} lightColor="transparent" darkColor="transparent">
              • Hindi mo gagawin ang pag-hack, reverse-engineer, o mali gamitin ang app o kung anu-ano mang serbisyo nito.
            </ThemedText>
            <ThemedText style={styles.bulletPoint} lightColor="transparent" darkColor="transparent">
              • Pinipili namin ang karapatan na i-suspend o i-terminate ang mga account na naglalabas ng mga tuntunin.
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}  lightColor="transparent" darkColor="transparent">
          <ThemedText style={styles.sectionTitle} lightColor="transparent" darkColor="transparent">Limitasyon ng Pananagutan</ThemedText>
          <ThemedView style={styles.bulletPoints} lightColor="transparent" darkColor="transparent">
            <ThemedText style={styles.bulletPoint} lightColor="transparent" darkColor="transparent">
              • Ang RiCement ay ibinibigay "as is." Hindi namin ginagarantiya ang walang patid na serbisyo o walang error na paggana.
            </ThemedText>
            <ThemedText style={styles.bulletPoint} lightColor="transparent" darkColor="transparent">
              • Hindi kami mananagot para sa anumang pinsalang dulot ng iyong paggamit ng app.
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section} lightColor="transparent" darkColor="transparent">
          <ThemedText style={styles.sectionTitle} lightColor="transparent" darkColor="transparent">Privacy at Paggamit ng Data</ThemedText>
          <ThemedView style={styles.bulletPoints} lightColor="transparent" darkColor="transparent">
            <ThemedText style={styles.bulletPoint} lightColor="transparent" darkColor="transparent">
              • Pinapahalagahan namin ang iyong privacy. Ang iyong personal na data ay pinoproseso ayon sa aming www.ricement.com.ph
            </ThemedText>
            <ThemedText style={styles.bulletPoint} lightColor="transparent" darkColor="transparent">
              • Kinokolekta lang namin ang data na kinakailangan upang maibigay at mapabuti ang aming mga serbisyo.
            </ThemedText>
            <ThemedText style={styles.bulletPoint} lightColor="transparent" darkColor="transparent">
              • Maaari kang humiling ng pagtanggal o pag-access sa iyong data anumang oras.
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section} lightColor="transparent" darkColor="transparent">
          <ThemedText style={styles.sectionTitle}>Pagbabago ng mga Tuntunin</ThemedText>
          <ThemedView style={styles.bulletPoints} lightColor="transparent" darkColor="transparent">
            <ThemedText style={styles.bulletPoint}>
              • Maaaring i-update namin ang mga Tuntunin sa anumang oras. Ang paggamit ng app pagkatapos ng mga pagbabago ay nangangahulugan na tinatanggap mo ang mga bagong Tuntunin.
            </ThemedText>
            <ThemedText style={styles.bulletPoint}>
              • Ang malalaking pagbabago ay ipapahayag sa pamamagitan ng notification sa app o email.
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.checkboxContainer} lightColor="transparent" darkColor="transparent">
          <Pressable 
            style={({ pressed }) => [
              styles.checkbox,
              { backgroundColor: isChecked ? '#3498DB' : 'transparent' },
              pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }
            ]}
            onPress={() => {
              if (!isChecked) {
                setIsChecked(true);
                // Automatically navigate to signup after checking
                setTimeout(() => {
                  router.push('/signup');
                }, 300); // Small delay for visual feedback
              }
            }}
          >
            {isChecked && <ThemedText style={styles.checkmark}>✓</ThemedText>}
          </Pressable>
          <ThemedText style={styles.checkboxText}>
           Tinatanggap ko ang Mga Tuntunin at Kundisyon at Patakaran sa Privacy
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    marginBottom: 30,
  } as const,
  section: {
    marginBottom: 30,
  } as const,
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  } as const,
  bulletPoints: {
    gap: 10,
  } as const,
  bulletPoint: {
    fontSize: 14,
    color: '#34495E',
    lineHeight: 20,
  } as const,
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    gap: 10,
  } as const,
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#BDC3C7',
  } as const,
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  } as const,
  checkboxText: {
    color: '#2C3E50',
    fontSize: 14,
    flex: 1,
  } as const,
});
