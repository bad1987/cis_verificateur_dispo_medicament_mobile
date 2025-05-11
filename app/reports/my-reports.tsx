import { useState, useEffect } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, View } from 'react-native';
import { Stack, router } from 'expo-router';
import axios from 'axios';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AvailabilityStatus } from '@/components/AvailabilityStatus';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import reportService, { AvailabilityReport } from '@/services/reportService';

export default function MyReportsScreen() {
  const { t, language } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const { isAuthenticated } = useAuth();

  const [reports, setReports] = useState<AvailabilityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'in_stock' | 'out_of_stock' | 'unknown' | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchReports(1, true);
    } else {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, statusFilter]);

  const fetchReports = async (pageToFetch: number, reset: boolean = false) => {
    try {
      setLoading(true);

      const response = await reportService.getUserReports(
        pageToFetch,
        20, // 20 items per page
        statusFilter || undefined
      );

      const newReports = response.reports;

      if (reset) {
        setReports(newReports);
      } else {
        setReports(prev => [...prev, ...newReports]);
      }

      setPage(pageToFetch);
      setHasMore(newReports.length > 0 && pageToFetch < response.totalPages);
    } catch (error) {
      console.error('Error fetching user reports:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Token expired or invalid
        Alert.alert(
          t('sessionExpired'),
          t('pleaseLoginAgain'),
          [
            { text: 'OK', onPress: () => router.push('/auth/login') }
          ]
        );
      } else {
        Alert.alert(t('error'), t('genericError'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReports(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchReports(page + 1);
    }
  };

  const handleStatusFilter = (status: 'in_stock' | 'out_of_stock' | 'unknown' | null) => {
    setStatusFilter(status);
  };

  const handleDeleteReport = async (reportId: number) => {
    Alert.alert(
      t('confirmDelete'),
      t('deleteReportConfirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await reportService.deleteReport(reportId);
              // Remove the deleted report from the list
              setReports(prev => prev.filter(report => report.id !== reportId));
            } catch (error) {
              console.error('Error deleting report:', error);
              if (axios.isAxiosError(error) && error.response?.status === 401) {
                // Token expired or invalid
                Alert.alert(
                  t('sessionExpired'),
                  t('pleaseLoginAgain'),
                  [
                    { text: 'OK', onPress: () => router.push('/auth/login') }
                  ]
                );
              } else if (axios.isAxiosError(error) && error.response?.status === 403) {
                // Not authorized to delete this report
                Alert.alert(t('error'), t('notAuthorizedToDelete'));
              } else {
                Alert.alert(t('error'), t('genericError'));
              }
            }
          }
        }
      ]
    );
  };

  const handleEditReport = (report: AvailabilityReport) => {
    router.push({
      pathname: '/(tabs)/report',
      params: {
        editMode: 'true',
        reportId: report.id.toString(),
        drugId: report.drugId.toString(),
        pharmacyId: report.pharmacyId.toString(),
        status: report.status,
        price: report.price?.toString() || '',
        notes: report.notes || '',
        expiryDate: report.expiryDate || ''
      }
    });
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      undefined,
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('myReports'),
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors[colorScheme].background
          },
          headerTintColor: Colors[colorScheme].text,
        }}
      />
      <ThemedView style={styles.container}>
        {/* Status Filter */}
        <ThemedView style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === null && { backgroundColor: Colors[colorScheme].tint }
            ]}
            onPress={() => handleStatusFilter(null)}
          >
            <ThemedText
              style={[
                styles.filterButtonText,
                statusFilter === null && { color: '#fff' }
              ]}
            >
              {t('all')}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === 'in_stock' && { backgroundColor: Colors[colorScheme].success }
            ]}
            onPress={() => handleStatusFilter('in_stock')}
          >
            <ThemedText
              style={[
                styles.filterButtonText,
                statusFilter === 'in_stock' && { color: '#fff' }
              ]}
            >
              {t('inStock')}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === 'out_of_stock' && { backgroundColor: Colors[colorScheme].error }
            ]}
            onPress={() => handleStatusFilter('out_of_stock')}
          >
            <ThemedText
              style={[
                styles.filterButtonText,
                statusFilter === 'out_of_stock' && { color: '#fff' }
              ]}
            >
              {t('outOfStock')}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === 'unknown' && { backgroundColor: Colors[colorScheme].warning }
            ]}
            onPress={() => handleStatusFilter('unknown')}
          >
            <ThemedText
              style={[
                styles.filterButtonText,
                statusFilter === 'unknown' && { color: '#fff' }
              ]}
            >
              {t('unknown')}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          </View>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <ThemedView
                style={[styles.reportItem, { borderColor: Colors[colorScheme].border }]}
              >
                <ThemedView style={styles.reportHeader}>
                  <TouchableOpacity
                    style={styles.drugNameContainer}
                    onPress={() => handleDrugPress(item.drug!.id)}
                  >
                    <ThemedText style={styles.drugName}>
                      {language === 'FR' ? item.drug?.nameFR : item.drug?.nameEN}
                    </ThemedText>
                  </TouchableOpacity>

                  <AvailabilityStatus
                    status={item.status}
                    compact
                  />
                </ThemedView>

                <TouchableOpacity
                  style={styles.pharmacyContainer}
                  onPress={() => handlePharmacyPress(item.pharmacy!.id)}
                >
                  <IconSymbol name="mappin" size={14} color={Colors[colorScheme].icon} style={styles.icon} />
                  <ThemedText style={styles.pharmacyName}>
                    {item.pharmacy?.name}
                  </ThemedText>
                </TouchableOpacity>

                <ThemedView style={styles.reportDetails}>
                  {item.price && (
                    <ThemedText style={styles.price}>
                      {item.price} {t('currency')}
                    </ThemedText>
                  )}

                  {item.notes && (
                    <ThemedText style={styles.notes} numberOfLines={2}>
                      {item.notes}
                    </ThemedText>
                  )}
                </ThemedView>

                <ThemedView style={styles.reportFooter}>
                  <ThemedText style={styles.date}>
                    {formatDate(item.createdAt)}
                  </ThemedText>

                  <ThemedView style={styles.actions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditReport(item)}
                    >
                      <IconSymbol name="pencil" size={16} color={Colors[colorScheme].icon} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteReport(item.id)}
                    >
                      <IconSymbol name="trash" size={16} color={Colors[colorScheme].error} />
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
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
              <ThemedView style={styles.emptyContainer}>
                <IconSymbol name="doc.text" size={48} color={Colors[colorScheme].icon} />
                <ThemedText style={styles.emptyText}>
                  {t('noReports')}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginVertical: 20,
  },
  reportItem: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    margin: 8,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  drugNameContainer: {
    flex: 1,
    marginRight: 8,
  },
  drugName: {
    fontSize: 16,
    fontWeight: '600',
  },
  pharmacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 4,
  },
  pharmacyName: {
    opacity: 0.7,
  },
  reportDetails: {
    marginBottom: 8,
  },
  price: {
    fontWeight: '600',
    marginBottom: 4,
  },
  notes: {
    opacity: 0.7,
    fontSize: 14,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
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
