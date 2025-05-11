import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useTranslation } from '@/i18n';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface DisclaimerBannerProps {
  compact?: boolean;
}

export function DisclaimerBanner({ compact = false }: DisclaimerBannerProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <ThemedView
      style={[
        styles.container,
        compact ? styles.compactContainer : null,
        { backgroundColor: Colors[colorScheme].warning }
      ]}
    >
      <ThemedText
        style={[
          styles.text,
          compact ? styles.compactText : null,
          { color: Colors[colorScheme].warningText }
        ]}
      >
        {t('disclaimer')}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  compactContainer: {
    padding: 8,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  compactText: {
    fontSize: 12,
  },
});
