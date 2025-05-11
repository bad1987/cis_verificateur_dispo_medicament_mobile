import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { useTranslation } from '@/i18n';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type StatusType = 'in_stock' | 'out_of_stock' | 'unknown';

interface AvailabilityStatusProps {
  status: StatusType;
  timestamp?: string;
  compact?: boolean;
}

export function AvailabilityStatus({
  status,
  timestamp,
  compact = false,
}: AvailabilityStatusProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';

  // Get status text and color
  const getStatusInfo = (status: StatusType) => {
    switch (status) {
      case 'in_stock':
        return {
          text: t('inStock'),
          color: Colors[colorScheme].success,
          backgroundColor: Colors[colorScheme].successBackground,
        };
      case 'out_of_stock':
        return {
          text: t('outOfStock'),
          color: Colors[colorScheme].error,
          backgroundColor: Colors[colorScheme].errorBackground,
        };
      case 'unknown':
      default:
        return {
          text: t('unknown'),
          color: Colors[colorScheme].warning,
          backgroundColor: Colors[colorScheme].warningBackground,
        };
    }
  };

  const statusInfo = getStatusInfo(status);

  // Format timestamp if provided
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleDateString(
        undefined,
        { year: 'numeric', month: 'short', day: 'numeric' }
      )
    : null;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          compact ? styles.compactBadge : null,
          { backgroundColor: statusInfo.backgroundColor }
        ]}
      >
        <ThemedText
          style={[
            styles.statusText,
            compact ? styles.compactText : null,
            { color: statusInfo.color }
          ]}
        >
          {statusInfo.text}
        </ThemedText>
      </View>
      
      {timestamp && !compact && (
        <ThemedText style={styles.timestamp}>
          {t('lastReported')}: {formattedTime}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  badge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  compactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 14,
  },
  compactText: {
    fontSize: 12,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
});
