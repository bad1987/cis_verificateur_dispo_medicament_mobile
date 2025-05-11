import { useState, useEffect } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, View, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SearchBar } from '@/components/SearchBar';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { PharmacyListItem } from '@/components/PharmacyListItem';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTranslation } from '@/i18n';
import pharmacyService, { Pharmacy } from '@/services/pharmacyService';

export default function PharmaciesScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cityFilter, setCityFilter] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocationAndPharmacies = async () => {
      try {
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
        }

        // Fetch pharmacies
        await fetchPharmacies(1, true);
      } catch (error) {
        console.error('Error in pharmacies screen setup:', error);
        setLoading(false);
      }
    };

    fetchLocationAndPharmacies();
  }, []);

  // Filter pharmacies when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '' && !cityFilter) {
      setFilteredPharmacies(pharmacies);
      return;
    }

    const filtered = pharmacies.filter(pharmacy => {
      const matchesSearch = searchQuery.trim() === '' ||
        pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pharmacy.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCity = !cityFilter || pharmacy.city === cityFilter;

      return matchesSearch && matchesCity;
    });

    setFilteredPharmacies(filtered);
  }, [searchQuery, pharmacies, cityFilter]);

  const fetchPharmacies = async (pageToFetch: number, reset: boolean = false) => {
    if (!hasMore && !reset) return;

    try {
      setLoading(true);

      const response = await pharmacyService.searchPharmacies(
        '', // No search query for initial load
        cityFilter || undefined,
        pageToFetch,
        20 // 20 items per page
      );

      const newPharmacies = response.pharmacies;

      if (reset) {
        setPharmacies(newPharmacies);
      } else {
        setPharmacies(prev => [...prev, ...newPharmacies]);
      }

      setPage(pageToFetch);
      setHasMore(newPharmacies.length > 0 && pageToFetch < response.totalPages);
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchPharmacies(page + 1);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPharmacies(1, true);
  };

  const handleSearch = () => {
    // Just let the useEffect filter the pharmacies
  };

  const handlePharmacyPress = (pharmacyId: number) => {
    router.push({
      pathname: '/pharmacies/[pharmacyId]',
      params: { pharmacyId }
    });
  };

  const handleCityFilter = (city: string | null) => {
    setCityFilter(city);
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

  // Get unique cities from pharmacies
  const cities = Array.from(new Set(pharmacies.map(pharmacy => pharmacy.city))).sort();

  return (
    <>
      <Stack.Screen
        options={{
          title: t('pharmaciesTab'),
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors[colorScheme].background
          },
          headerTintColor: Colors[colorScheme].text,
        }}
      />
      <ThemedView style={styles.container}>
        {/* Disclaimer Banner */}
        <DisclaimerBanner compact />

        {/* Search Bar */}
        <SearchBar
          placeholder={t('search')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={handleSearch}
        />

        {/* City Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityFilterContainer}>
          <TouchableOpacity
            style={[
              styles.cityFilterButton,
              { backgroundColor: colorScheme === 'dark' ? '#333333' : '#f0f0f0' },
              !cityFilter && { backgroundColor: Colors[colorScheme].tint }
            ]}
            onPress={() => handleCityFilter(null)}
          >
            <ThemedText
              style={[
                styles.cityFilterText,
                { color: colorScheme === 'dark' ? '#ECEDEE' : '#11181C' },
                !cityFilter && { color: '#fff' }
              ]}
            >
              {t('all')}
            </ThemedText>
          </TouchableOpacity>

          {cities.map(city => (
            <TouchableOpacity
              key={city}
              style={[
                styles.cityFilterButton,
                { backgroundColor: colorScheme === 'dark' ? '#333333' : '#f0f0f0' },
                cityFilter === city && { backgroundColor: Colors[colorScheme].tint }
              ]}
              onPress={() => handleCityFilter(city)}
            >
              <ThemedText
                style={[
                  styles.cityFilterText,
                  { color: colorScheme === 'dark' ? '#ECEDEE' : '#11181C' },
                  cityFilter === city && { color: '#fff' }
                ]}
              >
                {city}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pharmacies List */}
        <FlatList
          data={filteredPharmacies}
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
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && !refreshing ? (
              <ActivityIndicator style={styles.loader} size="large" color={Colors[colorScheme].tint} />
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <ThemedView style={styles.emptyContainer}>
                <IconSymbol name="magnifyingglass" size={48} color={Colors[colorScheme].icon} />
                <ThemedText style={styles.emptyText}>
                  {searchQuery.trim() !== '' || cityFilter
                    ? t('noPharmaciesFound')
                    : t('noPharmacies')}
                </ThemedText>
              </ThemedView>
            ) : null
          }
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginVertical: 20,
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
  cityFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  cityFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cityFilterText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
