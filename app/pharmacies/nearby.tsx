import { useState, useEffect } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, View, TouchableOpacity, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { PharmacyListItem } from '@/components/PharmacyListItem';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTranslation } from '@/i18n';
import pharmacyService, { Pharmacy } from '@/services/pharmacyService';

export default function NearbyPharmaciesScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [radius, setRadius] = useState(5); // 5km default radius
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLocationAndPharmacies();
  }, [radius]);

  const fetchLocationAndPharmacies = async () => {
    try {
      setLoading(true);

      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');

      // Get user location if permission granted
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});

        // Validate location data
        if (!location.coords ||
            typeof location.coords.latitude !== 'number' ||
            typeof location.coords.longitude !== 'number') {
          console.error('Invalid location coordinates');
          Alert.alert(t('error'), t('invalidLocationData'));
          setLocationPermission(false);
          return;
        }

        const userLoc = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };
        setUserLocation(userLoc);

        // Fetch nearby pharmacies
        try {
          const nearbyPharmacies = await pharmacyService.getNearbyPharmacies(
            userLoc.latitude,
            userLoc.longitude,
            radius,
            50 // Limit to 50 results
          );

          // Make sure we have an array of pharmacies
          if (Array.isArray(nearbyPharmacies)) {
            setPharmacies(nearbyPharmacies);
          } else {
            console.error('Unexpected response format from getNearbyPharmacies');
            setPharmacies([]);
            Alert.alert(t('error'), t('genericError'));
          }
        } catch (error) {
          console.error('Error fetching nearby pharmacies:', error);
          if (error instanceof Error) {
            Alert.alert(t('error'), error.message);
          } else {
            Alert.alert(t('error'), t('genericError'));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching nearby pharmacies:', error);
      Alert.alert(t('error'), t('genericError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLocationAndPharmacies();
  };

  const handlePharmacyPress = (pharmacyId: number) => {
    router.push({
      pathname: '/pharmacies/[pharmacyId]',
      params: { pharmacyId }
    });
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
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

  return (
    <>
      <Stack.Screen
        options={{
          title: t('nearbyPharmacies'),
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors[colorScheme].background
          },
          headerTintColor: Colors[colorScheme].text,
        }}
      />
      <ThemedView style={styles.container}>
        {/* Radius Filter */}
        <ThemedView style={styles.radiusContainer}>
          <ThemedText style={styles.radiusLabel}>{t('searchRadius')}:</ThemedText>
          <View style={styles.radiusButtons}>
            {[1, 2, 5, 10, 20].map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.radiusButton,
                  radius === r && { backgroundColor: Colors[colorScheme].tint }
                ]}
                onPress={() => handleRadiusChange(r)}
              >
                <ThemedText
                  style={[
                    styles.radiusButtonText,
                    radius === r && { color: '#fff' }
                  ]}
                >
                  {r}km
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>

        {locationPermission === false ? (
          <ThemedView style={styles.permissionContainer}>
            <IconSymbol name="location.slash" size={48} color={Colors[colorScheme].warning} />
            <ThemedText style={styles.permissionText}>
              {t('locationError')}
            </ThemedText>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: Colors[colorScheme].tint }]}
              onPress={fetchLocationAndPharmacies}
            >
              <ThemedText style={styles.buttonText}>{t('retry')}</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          </View>
        ) : (
          <FlatList
            data={pharmacies}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <PharmacyListItem
                pharmacy={item}
                distance={
                  userLocation
                    ? calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        item.latitude,
                        item.longitude
                      )
                    : undefined
                }
                onPress={() => handlePharmacyPress(item.id)}
              />
            )}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <ThemedView style={styles.emptyContainer}>
                <IconSymbol name="mappin.slash" size={48} color={Colors[colorScheme].icon} />
                <ThemedText style={styles.emptyText}>
                  {t('noNearbyPharmacies')}
                </ThemedText>
              </ThemedView>
            }
          />
        )}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  radiusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  radiusLabel: {
    marginRight: 8,
    fontWeight: '600',
  },
  radiusButtons: {
    flexDirection: 'row',
    flex: 1,
  },
  radiusButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginHorizontal: 4,
    backgroundColor: '#f0f0f0',
  },
  radiusButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    textAlign: 'center',
  },
});
