import { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, View, Alert, Linking, Platform } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { DrugListItem } from '@/components/DrugListItem';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import pharmacyService, { Pharmacy, AvailabilityReport } from '@/services/pharmacyService';

export default function PharmacyDetailScreen() {
  const params = useLocalSearchParams<{ pharmacyId: string }>();
  const pharmacyId = params?.pharmacyId;
  const { t, language } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const { isAuthenticated } = useAuth();

  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [reports, setReports] = useState<AvailabilityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  // Effect for getting user location
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        }
      } catch (locationError) {
        console.error('Error getting location:', locationError);
      }
    };

    getUserLocation();
  }, []);

  // Effect for calculating distance when userLocation or pharmacy changes
  useEffect(() => {
    if (userLocation && pharmacy) {
      const dist = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        pharmacy.latitude,
        pharmacy.longitude
      );
      setDistance(dist);
    }
  }, [userLocation, pharmacy]);

  // Use a ref to prevent multiple fetches
  const fetchingRef = useRef(false);
  const fetchedIdRef = useRef<number | null>(null);

  // Effect for fetching pharmacy details - completely rewritten to prevent infinite loops
  useEffect(() => {
    // Skip if no pharmacy ID
    if (!pharmacyId) {
      console.log('No pharmacy ID provided');
      setError(t('genericError'));
      setLoading(false);
      return;
    }

    // Validate pharmacy ID is a number
    const pharmacyIdNum = parseInt(pharmacyId);
    if (isNaN(pharmacyIdNum)) {
      console.log('Invalid pharmacy ID:', pharmacyId);
      setError(t('invalidPharmacyId'));
      setLoading(false);
      return;
    }

    // Skip if we've already fetched this pharmacy
    if (fetchedIdRef.current === pharmacyIdNum && pharmacy) {
      console.log('Already fetched pharmacy ID:', pharmacyIdNum);
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
        console.log('Fetching pharmacy details for ID:', pharmacyIdNum);

        // Fetch pharmacy details
        const pharmacyData = await pharmacyService.getPharmacyById(pharmacyIdNum);
        console.log('Pharmacy data received successfully');

        // Set pharmacy data
        setPharmacy(pharmacyData);

        // Fetch availability reports
        console.log('Fetching availability reports');
        const availabilityData = await pharmacyService.getPharmacyAvailability(pharmacyIdNum);

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
        fetchedIdRef.current = pharmacyIdNum;
      } catch (error) {
        console.error('Error fetching pharmacy details:', error);
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
  }, [pharmacyId, t]);

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

    if (pharmacy) {
      router.push({
        pathname: '/(tabs)/report',
        params: { preselectedPharmacyId: pharmacy.id }
      });
    }
  };

  const handleDrugPress = (drugId: number) => {
    router.push({
      pathname: '/drugs/[drugId]',
      params: { drugId }
    });
  };

  const handleCallPress = () => {
    if (pharmacy?.phoneNumber) {
      Linking.openURL(`tel:${pharmacy.phoneNumber}`);
    }
  };

  const handleDirectionsPress = () => {
    if (pharmacy) {
      const scheme = Platform.select({ ios: 'maps:', android: 'geo:' });
      const url = Platform.select({
        ios: `${scheme}?q=${pharmacy.name}&ll=${pharmacy.latitude},${pharmacy.longitude}`,
        android: `${scheme}0,0?q=${pharmacy.latitude},${pharmacy.longitude}(${pharmacy.name})`
      });

      if (url) {
        Linking.openURL(url);
      }
    }
  };

  // Calculate distance between two coordinates in kilometers
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  // Format distance
  const formatDistance = (dist: number): string => {
    return dist < 1
      ? `${Math.round(dist * 1000)}m`
      : `${dist.toFixed(1)}km`;
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </ThemedView>
    );
  }

  if (error || !pharmacy) {
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

  return (
    <>
      <Stack.Screen
        options={{
          title: t('pharmacyDetails'),
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
          {/* Pharmacy Info */}
          <ThemedView style={styles.pharmacyInfoContainer}>
            <ThemedText type="title" style={styles.pharmacyName}>
              {pharmacy.name}
            </ThemedText>

            <ThemedView style={styles.detailsRow}>
              <IconSymbol name="mappin" size={16} color={Colors[colorScheme].icon} style={styles.icon} />
              <ThemedText style={styles.address}>
                {pharmacy.address}, {pharmacy.city}
              </ThemedText>
            </ThemedView>

            {distance !== null && (
              <ThemedView style={styles.detailsRow}>
                <IconSymbol name="location" size={16} color={Colors[colorScheme].icon} style={styles.icon} />
                <ThemedText style={styles.distance}>
                  {formatDistance(distance)}
                </ThemedText>
              </ThemedView>
            )}

            {pharmacy.phoneNumber && (
              <ThemedView style={styles.detailsRow}>
                <IconSymbol name="phone" size={16} color={Colors[colorScheme].icon} style={styles.icon} />
                <ThemedText style={styles.phoneNumber}>
                  {pharmacy.phoneNumber}
                </ThemedText>
              </ThemedView>
            )}

            {pharmacy.openingHours && Object.keys(pharmacy.openingHours).length > 0 && (
              <ThemedView style={styles.openingHoursContainer}>
                <ThemedText style={styles.openingHoursTitle}>{t('openingHours')}</ThemedText>
                {Object.entries(pharmacy.openingHours).map(([day, hours]) => (
                  <ThemedView key={day} style={styles.openingHoursRow}>
                    <ThemedText style={styles.openingHoursDay}>{day}</ThemedText>
                    <ThemedText style={styles.openingHoursTime}>{hours}</ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>
            )}
          </ThemedView>

          {/* Action Buttons */}
          <ThemedView style={styles.actionButtonsContainer}>
            {pharmacy.phoneNumber && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colors[colorScheme].tint }]}
                onPress={handleCallPress}
              >
                <IconSymbol name="phone.fill" size={20} color="#fff" />
                <ThemedText style={styles.actionButtonText}>{t('call')}</ThemedText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors[colorScheme].tint }]}
              onPress={handleDirectionsPress}
            >
              <IconSymbol name="map.fill" size={20} color="#fff" />
              <ThemedText style={styles.actionButtonText}>{t('directions')}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors[colorScheme].tint }]}
              onPress={handleReportPress}
            >
              <IconSymbol name="plus" size={20} color="#fff" />
              <ThemedText style={styles.actionButtonText}>{t('report')}</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {/* Available Drugs */}
          <ThemedView style={styles.drugsContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t('availableDrugs')}
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
                <DrugListItem
                  key={report.id}
                  drug={report.drug!}
                  report={report}
                  onPress={() => handleDrugPress(report.drug!.id)}
                />
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
  pharmacyInfoContainer: {
    marginBottom: 24,
  },
  pharmacyName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  address: {
    flex: 1,
  },
  distance: {
    fontWeight: '500',
  },
  phoneNumber: {
    fontWeight: '500',
  },
  openingHoursContainer: {
    marginTop: 16,
  },
  openingHoursTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  openingHoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  openingHoursDay: {
    fontWeight: '500',
  },
  openingHoursTime: {
    opacity: 0.8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },
  drugsContainer: {
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
});
