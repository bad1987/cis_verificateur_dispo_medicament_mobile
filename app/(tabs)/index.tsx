import { StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SearchBar } from '@/components/SearchBar';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { DrugListItem } from '@/components/DrugListItem';
import { PharmacyListItem } from '@/components/PharmacyListItem';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTranslation } from '@/i18n';
import drugService, { Drug } from '@/services/drugService';
import pharmacyService, { Pharmacy } from '@/services/pharmacyService';

export default function HomeScreen() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [popularDrugs, setPopularDrugs] = useState<Drug[]>([]);
  const [nearbyPharmacies, setNearbyPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status === 'granted');

        // Get user location if permission granted
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });

          // Fetch nearby pharmacies
          try {
            // Make sure we have valid coordinates
            if (location.coords &&
                typeof location.coords.latitude === 'number' &&
                typeof location.coords.longitude === 'number') {
              const pharmacies = await pharmacyService.getNearbyPharmacies(
                location.coords.latitude,
                location.coords.longitude,
                5, // 5km radius
                5  // Limit to 5 results
              );

              // Make sure we have an array of pharmacies
              if (Array.isArray(pharmacies)) {
                setNearbyPharmacies(pharmacies);
              } else {
                console.error('Unexpected response format from getNearbyPharmacies');
                setNearbyPharmacies([]);
              }
            } else {
              console.error('Invalid location coordinates');
              setLocationPermission(false);
            }
          } catch (error) {
            console.error('Error fetching nearby pharmacies:', error);
            // Don't show an alert on the home screen to avoid disrupting the user experience
            // Just log the error and continue with empty pharmacies list
          }
        }

        // Fetch popular drugs (just get a few drugs to display)
        try {
          const drugsResponse = await drugService.searchDrugs('', language, 1, 5);
          setPopularDrugs(drugsResponse.drugs);
        } catch (error) {
          console.error('Error fetching drugs:', error);
        }
      } catch (error) {
        console.error('Error in home screen setup:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [language]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/drugs/search',
        params: { query: searchQuery }
      });
    }
  };

  const handleDrugPress = (drugId: number) => {
    router.push({
      pathname: '/drugs/[drugId]',
      params: { drugId }
    });
  };

  const handlePharmacyPress = (pharmacyId: number) => {
    router.push({
      pathname: '/pharmacies/[pharmacyId]',
      params: { pharmacyId }
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('homeTab'),
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors[colorScheme].background
          },
          headerTintColor: Colors[colorScheme].text,
        }}
      />
      <ScrollView>
        <ThemedView style={styles.container}>
          {/* Disclaimer Banner */}
          <DisclaimerBanner />

          {/* Welcome Section */}
          <ThemedView style={styles.welcomeSection}>
            <ThemedText type="title" style={styles.welcomeTitle}>
              {t('welcomeMessage')}
            </ThemedText>
          </ThemedView>

          {/* Search Bar */}
          <SearchBar
            placeholder={t('searchDrugs')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmit={handleSearch}
          />

          {loading ? (
            <ActivityIndicator style={styles.loader} size="large" color={Colors[colorScheme].tint} />
          ) : (
            <>
              {/* Nearby Pharmacies Section */}
              <ThemedView style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    {t('nearbyPharmacies')}
                  </ThemedText>
                  <TouchableOpacity onPress={() => router.push('/pharmacies/nearby')}>
                    <ThemedText style={[styles.viewAllText, { color: Colors[colorScheme].tint }]}>
                      {t('viewAll')}
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                {locationPermission === false && (
                  <ThemedView
                    variant="surface"
                    style={styles.permissionMessage}
                  >
                    <IconSymbol name="location.slash" size={24} color={Colors[colorScheme].warning} />
                    <ThemedText style={styles.permissionText}>
                      {t('locationError')}
                    </ThemedText>
                  </ThemedView>
                )}

                {locationPermission && nearbyPharmacies.length === 0 && (
                  <ThemedView
                    variant="surface"
                    style={styles.emptyState}
                  >
                    <ThemedText style={styles.emptyStateText}>
                      No nearby pharmacies found.
                    </ThemedText>
                  </ThemedView>
                )}

                {nearbyPharmacies.map(pharmacy => (
                  <PharmacyListItem
                    key={pharmacy.id}
                    pharmacy={pharmacy}
                    distance={
                      userLocation
                        ? calculateDistance(
                            userLocation.latitude,
                            userLocation.longitude,
                            pharmacy.latitude,
                            pharmacy.longitude
                          )
                        : undefined
                    }
                    onPress={() => handlePharmacyPress(pharmacy.id)}
                  />
                ))}
              </ThemedView>

              {/* Popular Drugs Section */}
              <ThemedView style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    {t('popularDrugs')}
                  </ThemedText>
                  <TouchableOpacity onPress={() => router.push('/drugs/search')}>
                    <ThemedText style={[styles.viewAllText, { color: Colors[colorScheme].tint }]}>
                      {t('viewAll')}
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                {popularDrugs.length === 0 ? (
                  <ThemedView
                    variant="surface"
                    style={styles.emptyState}
                  >
                    <ThemedText style={styles.emptyStateText}>
                      No medications found.
                    </ThemedText>
                  </ThemedView>
                ) : (
                  popularDrugs.map(drug => (
                    <DrugListItem
                      key={drug.id}
                      drug={drug}
                      onPress={() => handleDrugPress(drug.id)}
                    />
                  ))
                )}
              </ThemedView>
            </>
          )}
        </ThemedView>
      </ScrollView>
    </>
  );
}

// Calculate distance between two coordinates in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 24,
  },
  welcomeSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontWeight: '600',
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
  },
  permissionMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  permissionText: {
    marginLeft: 8,
    flex: 1,
  },
});
