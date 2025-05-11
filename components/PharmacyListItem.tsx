import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { AvailabilityStatus } from './AvailabilityStatus';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTranslation } from '@/i18n';
import { Pharmacy } from '@/services/pharmacyService';
import { AvailabilityReport } from '@/services/reportService';

interface PharmacyListItemProps {
  pharmacy: Pharmacy;
  report?: AvailabilityReport;
  distance?: number; // in kilometers
  onPress: () => void;
}

export function PharmacyListItem({
  pharmacy,
  report,
  distance,
  onPress,
}: PharmacyListItemProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const { t } = useTranslation();

  // Format distance if provided
  const formattedDistance = distance
    ? distance < 1
      ? `${Math.round(distance * 1000)}m`
      : `${distance.toFixed(1)}km`
    : null;

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
          {pharmacy.name}
        </ThemedText>
        
        <View style={styles.addressContainer}>
          <IconSymbol
            name="mappin"
            size={14}
            color={Colors[colorScheme].icon}
            style={styles.icon}
          />
          <ThemedText style={styles.address}>
            {pharmacy.address}, {pharmacy.city}
          </ThemedText>
        </View>
        
        {formattedDistance && (
          <View style={styles.distanceContainer}>
            <IconSymbol
              name="location"
              size={14}
              color={Colors[colorScheme].icon}
              style={styles.icon}
            />
            <ThemedText style={styles.distance}>
              {formattedDistance}
            </ThemedText>
          </View>
        )}
        
        {report && (
          <View style={styles.reportContainer}>
            {report.drug && (
              <ThemedText style={styles.drugName}>
                {report.drug.nameFR}
              </ThemedText>
            )}
            <AvailabilityStatus
              status={report.status}
              timestamp={report.createdAt}
              compact
            />
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
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 4,
  },
  address: {
    fontSize: 14,
    opacity: 0.7,
    flex: 1,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  distance: {
    fontSize: 14,
    fontWeight: '500',
  },
  reportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  drugName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  chevronContainer: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
});
