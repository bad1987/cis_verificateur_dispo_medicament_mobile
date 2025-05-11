import { StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTranslation } from '@/i18n';

export default function AboutScreen() {
  const { t, language } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';

  const handleBackPress = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('about'),
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors[colorScheme].background
          },
          headerTintColor: Colors[colorScheme].text,
        }}
      />
      <ScrollView style={styles.container}>
        <ThemedView style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            {language === 'FR' ? 'Vérificateur Dispo Médicament' : 'Medication Finder'}
          </ThemedText>

          <ThemedText style={styles.version}>Version 1.0.0</ThemedText>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t('about')}
            </ThemedText>
            <ThemedText style={styles.paragraph}>
              {language === 'FR'
                ? "Cette application aide les utilisateurs au Cameroun à trouver des médicaments disponibles dans les pharmacies locales. Elle utilise les rapports des utilisateurs pour suivre la disponibilité des médicaments."
                : "This application helps users in Cameroon find available medications at local pharmacies. It uses user reports to track medication availability."}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t('howItWorks')}
            </ThemedText>
            <ThemedText style={styles.paragraph}>
              {language === 'FR'
                ? "1. Recherchez un médicament ou une pharmacie\n2. Consultez les rapports de disponibilité\n3. Signalez la disponibilité d'un médicament dans une pharmacie\n4. Aidez les autres à trouver des médicaments"
                : "1. Search for a medication or pharmacy\n2. View availability reports\n3. Report medication availability at a pharmacy\n4. Help others find medications"}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t('disclaimer')}
            </ThemedText>
            <ThemedText style={styles.paragraph}>
              {language === 'FR'
                ? "Les informations fournies sont participatives et peuvent être inexactes. Vérifiez toujours auprès de votre pharmacie. Cette application ne remplace pas un avis médical professionnel."
                : "Information provided is crowdsourced and may be inaccurate. Always verify with your pharmacy. This application is not a substitute for professional medical advice."}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t('contact')}
            </ThemedText>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => Linking.openURL('mailto:support@example.com')}
            >
              <IconSymbol name="envelope" size={20} color={Colors[colorScheme].icon} />
              <ThemedText style={styles.contactButtonText}>support@example.com</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ThemedView style={styles.footer}>
            <ThemedText style={styles.footerText}>
              © 2023 {language === 'FR' ? 'Vérificateur Dispo Médicament' : 'Medication Finder'}
            </ThemedText>
            <ThemedText style={styles.footerText}>
              {language === 'FR' ? 'Tous droits réservés' : 'All rights reserved'}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  version: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  paragraph: {
    lineHeight: 22,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  contactButtonText: {
    marginLeft: 8,
  },
  footer: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  footerText: {
    opacity: 0.7,
    fontSize: 12,
  },
});
