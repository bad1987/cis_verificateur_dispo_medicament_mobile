import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { AvailabilityStatus } from './AvailabilityStatus';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTranslation } from '@/i18n';
import { Drug } from '@/services/drugService';
import { AvailabilityReport } from '@/services/reportService';

interface DrugListItemProps {
  drug: Drug;
  report?: AvailabilityReport;
  onPress: () => void;
}

export function DrugListItem({ drug, report, onPress }: DrugListItemProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const { t, language } = useTranslation();

  // Get the drug name based on the current language
  const drugName = language === 'FR' ? drug.nameFR : drug.nameEN;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { borderColor: Colors[colorScheme].border }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <ThemedText type="defaultSemiBold" style={styles.name}>
          {drugName}
        </ThemedText>
        
        {drug.dosageForm && drug.strength && (
          <ThemedText style={styles.details}>
            {drug.dosageForm}, {drug.strength}
          </ThemedText>
        )}
        
        {report && (
          <View style={styles.reportContainer}>
            <AvailabilityStatus
              status={report.status}
              timestamp={report.createdAt}
              compact
            />
            
            {report.price && (
              <ThemedText style={styles.price}>
                {report.price} {t('currency')}
              </ThemedText>
            )}
          </View>
        )}
      </View>
      
      <View style={styles.chevronContainer}>
        <ThemedText style={{ color: Colors[colorScheme].icon }}>›</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  reportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  chevronContainer: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
});
