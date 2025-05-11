import { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, View, Alert } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { AvailabilityStatus } from '@/components/AvailabilityStatus';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import drugService, { Drug, AvailabilityReport } from '@/services/drugService';

export default function DrugDetailScreen() {
  const params = useLocalSearchParams<{ drugId: string }>();
  const drugId = params?.drugId;
  const { t, language } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const { isAuthenticated } = useAuth();

  const [drug, setDrug] = useState<Drug | null>(null);
  const [reports, setReports] = useState<AvailabilityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to prevent multiple fetches
  const fetchingRef = useRef(false);
  const fetchedIdRef = useRef<number | null>(null);

  // Effect for fetching drug details - completely rewritten to prevent infinite loops
  useEffect(() => {
    // Skip if no drug ID
    if (!drugId) {
      console.log('No drug ID provided');
      setError(t('genericError'));
      setLoading(false);
      return;
    }

    // Validate drug ID is a number
    const drugIdNum = parseInt(drugId);
    if (isNaN(drugIdNum)) {
      console.log('Invalid drug ID:', drugId);
      setError(t('invalidDrugId'));
      setLoading(false);
      return;
    }

    // Skip if we've already fetched this drug
    if (fetchedIdRef.current === drugIdNum && drug) {
      console.log('Already fetched drug ID:', drugIdNum);
      return;
    }

    // Skip if we're already fetching
    if (fetchingRef.current) {
      console.log('Already fetching data, skipping');
      return;
    }

    // Mark that we're fetching
    fetchingRef.current = true;

    // Set loading state
    setLoading(true);
    setError(null);

    // Define the fetch function
    const fetchData = async () => {
      try {
        console.log('Fetching drug details for ID:', drugIdNum);

        // Fetch drug details
        const drugData = await drugService.getDrugById(drugIdNum);
        console.log('Drug data received successfully');

        // Set drug data
        setDrug(drugData);

        // Fetch availability reports
        console.log('Fetching availability reports');
        const availabilityData = await drugService.getDrugAvailability(drugIdNum);

        // Process reports
        if (availabilityData && Array.isArray(availabilityData.reports)) {
          console.log(`Setting ${availabilityData.reports.length} reports`);
          setReports(availabilityData.reports);
        } else if (availabilityData && Array.isArray(availabilityData.availability)) {
          console.log(`Setting ${availabilityData.availability.length} reports from availability field`);
          setReports(availabilityData.availability);
        } else {
          console.error('Invalid availability data format');
          setReports([]);
        }

        // Mark that we've fetched this ID
        fetchedIdRef.current = drugIdNum;
      } catch (error) {
        console.error('Error fetching drug details:', error);
        setError(t('genericError'));
      } finally {
        // Clear loading state and fetching flag
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    // Execute the fetch
    fetchData();

    // Cleanup function
    return () => {
      // Nothing to clean up here since we're using refs
    };
  }, [drugId, t]);

  const handleReportPress = () => {
    if (!isAuthenticated) {
      Alert.alert(
        t('login'),
        t('loginRequired'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('login'), onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }

    if (drug) {
      router.push({
        pathname: '/(tabs)/report',
        params: { preselectedDrugId: drug.id }
      });
    }
  };

  const handlePharmacyPress = (pharmacyId: number) => {
    router.push({
      pathname: '/pharmacies/[pharmacyId]',
      params: { pharmacyId }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      undefined,
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </ThemedView>
    );
  }

  if (error || !drug) {
    return (
      <ThemedView style={styles.errorContainer}>
        <IconSymbol name="exclamationmark.triangle" size={48} color={Colors[colorScheme].error} />
        <ThemedText style={styles.errorText}>{error || t('genericError')}</ThemedText>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: Colors[colorScheme].tint }]}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.buttonText}>{t('back')}</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Get drug name based on language
  const drugName = language === 'FR' ? drug.nameFR : drug.nameEN;
  const drugDescription = language === 'FR' ? drug.descriptionFR : drug.descriptionEN;

  return (
    <>
      <Stack.Screen
        options={{
          title: t('drugDetails'),
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors[colorScheme].background
          },
          headerTintColor: Colors[colorScheme].text,
        }}
      />
      <ScrollView style={styles.container}>
        <DisclaimerBanner />

        <ThemedView style={styles.content}>
          {/* Drug Info */}
          <ThemedView style={styles.drugInfoContainer}>
            <ThemedText type="title" style={styles.drugName}>
              {drugName}
            </ThemedText>

            {drug.dosageForm && drug.strength && (
              <ThemedView style={styles.detailsRow}>
                <ThemedText style={styles.detailsLabel}>{t('dosageForm')}:</ThemedText>
                <ThemedText style={styles.detailsValue}>
                  {drug.dosageForm}, {drug.strength}
                </ThemedText>
              </ThemedView>
            )}

            {drug.commonBrandNames && drug.commonBrandNames.length > 0 && (
              <ThemedView style={styles.detailsRow}>
                <ThemedText style={styles.detailsLabel}>{t('brandNames')}:</ThemedText>
                <ThemedText style={styles.detailsValue}>
                  {drug.commonBrandNames.join(', ')}
                </ThemedText>
              </ThemedView>
            )}

            {drugDescription && (
              <ThemedText style={styles.description}>
                {drugDescription}
              </ThemedText>
            )}
          </ThemedView>

          {/* Report Button */}
          <TouchableOpacity
            style={[styles.reportButton, { backgroundColor: Colors[colorScheme].tint }]}
            onPress={handleReportPress}
          >
            <IconSymbol name="plus" size={20} color="#fff" />
            <ThemedText style={styles.reportButtonText}>
              {t('reportAvailability')}
            </ThemedText>
          </TouchableOpacity>

          {/* Availability Reports */}
          <ThemedView style={styles.reportsContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t('availabilityStatus')}
            </ThemedText>

            {reports.length === 0 ? (
              <ThemedView
                variant="surface"
                style={styles.emptyState}
              >
                <ThemedText style={styles.emptyStateText}>
                  {t('noReports')}
                </ThemedText>
              </ThemedView>
            ) : (
              reports.map(report => (
                <TouchableOpacity
                  key={report.id}
                  style={[
                    styles.reportItem,
                    { borderColor: Colors[colorScheme].border }
                  ]}
                  onPress={() => handlePharmacyPress(report.pharmacy!.id)}
                >
                  <ThemedView style={styles.reportHeader}>
                    <ThemedText style={styles.pharmacyName}>
                      {report.pharmacy?.name}
                    </ThemedText>
                    <AvailabilityStatus
                      status={report.status}
                      compact
                    />
                  </ThemedView>

                  <ThemedText style={styles.pharmacyAddress}>
                    {report.pharmacy?.address}, {report.pharmacy?.city}
                  </ThemedText>

                  <ThemedView style={styles.reportFooter}>
                    {report.price && (
                      <ThemedText style={styles.price}>
                        {report.price} {t('currency')}
                      </ThemedText>
                    )}

                    <ThemedView style={styles.reportInfo}>
                      <ThemedText style={styles.reportDate}>
                        {formatDate(report.createdAt)}
                      </ThemedText>

                      {report.reporter && (
                        <ThemedText style={styles.reporterName}>
                          {t('reportedBy')}: {report.reporter.username}
                        </ThemedText>
                      )}
                    </ThemedView>
                  </ThemedView>
                </TouchableOpacity>
              ))
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  drugInfoContainer: {
    marginBottom: 24,
  },
  drugName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailsLabel: {
    fontWeight: '600',
    marginRight: 8,
  },
  detailsValue: {
    flex: 1,
  },
  description: {
    marginTop: 16,
    lineHeight: 22,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  reportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  reportsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 8,
  },
  emptyStateText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  reportItem: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  pharmacyAddress: {
    marginBottom: 12,
    opacity: 0.7,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  price: {
    fontWeight: '600',
    fontSize: 16,
  },
  reportInfo: {
    alignItems: 'flex-end',
  },
  reportDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  reporterName: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
});
