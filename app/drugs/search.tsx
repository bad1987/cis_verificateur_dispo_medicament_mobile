import { useState, useEffect } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, View } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SearchBar } from '@/components/SearchBar';
import { DrugListItem } from '@/components/DrugListItem';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTranslation } from '@/i18n';
import drugService, { Drug } from '@/services/drugService';

export default function DrugSearchScreen() {
  const params = useLocalSearchParams<{ query: string }>();
  const { t, language } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';

  const [searchQuery, setSearchQuery] = useState(params.query || '');
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Initial search with the query from params
    if (params.query) {
      searchDrugs(params.query, 1, true);
    } else {
      // If no query provided, just load some drugs
      searchDrugs('', 1, true);
    }
  }, [params.query]);

  const searchDrugs = async (query: string, pageToFetch: number, reset: boolean = false) => {
    try {
      if (reset) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const response = await drugService.searchDrugs(
        query,
        language,
        pageToFetch,
        20 // 20 items per page
      );

      const newDrugs = response.drugs;

      if (reset) {
        setDrugs(newDrugs);
      } else {
        setDrugs(prev => [...prev, ...newDrugs]);
      }

      setPage(pageToFetch);
      setHasMore(newDrugs.length > 0 && pageToFetch < response.totalPages);
      setSearchQuery(query);
    } catch (error) {
      console.error('Error searching drugs:', error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim() !== '') {
      searchDrugs(searchQuery, 1, true);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      searchDrugs(searchQuery, page + 1);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    searchDrugs(searchQuery, 1, true);
  };

  const handleDrugPress = (drugId: number) => {
    router.push({
      pathname: '/drugs/[drugId]',
      params: { drugId }
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('searchDrugs'),
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors[colorScheme].background
          },
          headerTintColor: Colors[colorScheme].text,
        }}
      />
      <ThemedView style={styles.container}>
        <SearchBar
          placeholder={t('searchDrugs')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={handleSearch}
        />

        {initialLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          </View>
        ) : (
          <FlatList
            data={drugs}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <DrugListItem
                drug={item}
                onPress={() => handleDrugPress(item.id)}
              />
            )}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loading ? (
                <ActivityIndicator style={styles.loader} size="large" color={Colors[colorScheme].tint} />
              ) : null
            }
            ListEmptyComponent={
              <ThemedView style={styles.emptyContainer}>
                <IconSymbol name="magnifyingglass" size={48} color={Colors[colorScheme].icon} />
                <ThemedText style={styles.emptyText}>
                  {searchQuery.trim() !== ''
                    ? t('noDrugsFound')
                    : t('searchToFindDrugs')}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});
