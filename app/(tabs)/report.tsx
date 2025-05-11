import { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  View,
  Modal,
  FlatList,
  Platform
} from 'react-native';
import { Stack, router } from 'expo-router';
import * as Location from 'expo-location';
import axios from 'axios';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { SearchBar } from '@/components/SearchBar';
import { DrugListItem } from '@/components/DrugListItem';
import { PharmacyListItem } from '@/components/PharmacyListItem';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import drugService, { Drug } from '@/services/drugService';
import pharmacyService, { Pharmacy } from '@/services/pharmacyService';
import reportService from '@/services/reportService';
import DateTimePicker from '@react-native-community/datetimepicker';

// Import DateTimePicker conditionally to avoid errors
// let DateTimePicker: any;
// try {
//   DateTimePicker = require('@react-native-community/datetimepicker').default;
// } catch (error) {
//   console.warn('DateTimePicker not available:', error);
//   // Provide a fallback or handle the absence of the component
//   DateTimePicker = ({ onChange }: any) => (
//     <TouchableOpacity onPress={() => onChange(null, new Date())}>
//       <View style={{ padding: 10 }}>
//         <ThemedText>Select Date (DateTimePicker not available)</ThemedText>
//       </View>
//     </TouchableOpacity>
//   );
// }

type Status = 'in_stock' | 'out_of_stock' | 'unknown';

export default function ReportScreen() {
  const { t, language } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Form state
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [status, setStatus] = useState<Status>('in_stock');
  const [price, setPrice] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Modal state
  const [drugModalVisible, setDrugModalVisible] = useState(false);
  const [pharmacyModalVisible, setPharmacyModalVisible] = useState(false);
  const [drugSearchQuery, setDrugSearchQuery] = useState('');
  const [pharmacySearchQuery, setPharmacySearchQuery] = useState('');
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loadingDrugs, setLoadingDrugs] = useState(false);
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Form submission state
  const [submitting, setSubmitting] = useState(false);

  // Get user location
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
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    getUserLocation();
  }, []);

  // Search drugs
  const searchDrugs = async (query: string) => {
    try {
      setLoadingDrugs(true);
      const response = await drugService.searchDrugs(query, language);
      setDrugs(response.drugs);
    } catch (error) {
      console.error('Error searching drugs:', error);
      Alert.alert(t('error'), t('genericError'));
    } finally {
      setLoadingDrugs(false);
    }
  };

  // Search pharmacies
  const searchPharmacies = async (query: string) => {
    try {
      setLoadingPharmacies(true);
      const response = await pharmacyService.searchPharmacies(query);
      setPharmacies(response.pharmacies);
    } catch (error) {
      console.error('Error searching pharmacies:', error);
      Alert.alert(t('error'), t('genericError'));
    } finally {
      setLoadingPharmacies(false);
    }
  };

  // Handle drug search
  const handleDrugSearch = () => {
    searchDrugs(drugSearchQuery);
  };

  // Handle pharmacy search
  const handlePharmacySearch = () => {
    searchPharmacies(pharmacySearchQuery);
  };

  // Select a drug
  const handleSelectDrug = (drug: Drug) => {
    setSelectedDrug(drug);
    setDrugModalVisible(false);
  };

  // Select a pharmacy
  const handleSelectPharmacy = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setPharmacyModalVisible(false);
  };

  // Handle date change
  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpiryDate(selectedDate);
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

  // Submit report
  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        t('login'),
        t('loginToAccess'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('login'), onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }

    if (!isAdmin) {
      Alert.alert(
        t('error'),
        t('adminOnlyFeature'),
        [{ text: 'OK' }]
      );
      return;
    }

    if (!selectedDrug || !selectedPharmacy) {
      Alert.alert(t('error'), t('selectDrugAndPharmacy'));
      return;
    }

    try {
      setSubmitting(true);

      const reportData = {
        drugId: selectedDrug.id,
        pharmacyId: selectedPharmacy.id,
        status,
        ...(price && { price: parseFloat(price) }),
        ...(notes && { notes }),
        ...(expiryDate && { expiryDate: expiryDate.toISOString() })
      };

      await reportService.createReport(reportData);

      Alert.alert(
        t('success'),
        t('reportSuccess'),
        [{ text: 'OK', onPress: () => resetForm() }]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
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
      setSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedDrug(null);
    setSelectedPharmacy(null);
    setStatus('in_stock');
    setPrice('');
    setNotes('');
    setExpiryDate(null);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('reportTab'),
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors[colorScheme].background
          },
          headerTintColor: Colors[colorScheme].text,
        }}
      />
      <ScrollView style={styles.container}>
        <ThemedView style={styles.content}>
          {/* Disclaimer Banner */}
          <DisclaimerBanner />

          <ThemedText type="title" style={styles.title}>
            {t('reportAvailability')}
          </ThemedText>

          {/* Drug Selection */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>{t('selectDrug')}</ThemedText>
            <TouchableOpacity
              style={[styles.selector, { borderColor: Colors[colorScheme].border }]}
              onPress={() => {
                setDrugModalVisible(true);
                searchDrugs('');
              }}
            >
              {selectedDrug ? (
                <ThemedText>{language === 'FR' ? selectedDrug.nameFR : selectedDrug.nameEN}</ThemedText>
              ) : (
                <ThemedText style={{ color: Colors[colorScheme].placeholder }}>
                  {t('selectDrug')}
                </ThemedText>
              )}
              <IconSymbol name="chevron.down" size={20} color={Colors[colorScheme].icon} />
            </TouchableOpacity>
          </ThemedView>

          {/* Pharmacy Selection */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>{t('selectPharmacy')}</ThemedText>
            <TouchableOpacity
              style={[styles.selector, { borderColor: Colors[colorScheme].border }]}
              onPress={() => {
                setPharmacyModalVisible(true);
                searchPharmacies('');
              }}
            >
              {selectedPharmacy ? (
                <ThemedText>{selectedPharmacy.name}</ThemedText>
              ) : (
                <ThemedText style={{ color: Colors[colorScheme].placeholder }}>
                  {t('selectPharmacy')}
                </ThemedText>
              )}
              <IconSymbol name="chevron.down" size={20} color={Colors[colorScheme].icon} />
            </TouchableOpacity>
          </ThemedView>

          {/* Status Selection */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>{t('selectStatus')}</ThemedText>
            <ThemedView style={styles.statusContainer}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === 'in_stock' && { backgroundColor: Colors[colorScheme].successBackground },
                  status === 'in_stock' && { borderColor: Colors[colorScheme].success }
                ]}
                onPress={() => setStatus('in_stock')}
              >
                <ThemedText
                  style={[
                    styles.statusText,
                    status === 'in_stock' && { color: Colors[colorScheme].success }
                  ]}
                >
                  {t('inStock')}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === 'out_of_stock' && { backgroundColor: Colors[colorScheme].errorBackground },
                  status === 'out_of_stock' && { borderColor: Colors[colorScheme].error }
                ]}
                onPress={() => setStatus('out_of_stock')}
              >
                <ThemedText
                  style={[
                    styles.statusText,
                    status === 'out_of_stock' && { color: Colors[colorScheme].error }
                  ]}
                >
                  {t('outOfStock')}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === 'unknown' && { backgroundColor: Colors[colorScheme].warningBackground },
                  status === 'unknown' && { borderColor: Colors[colorScheme].warning }
                ]}
                onPress={() => setStatus('unknown')}
              >
                <ThemedText
                  style={[
                    styles.statusText,
                    status === 'unknown' && { color: Colors[colorScheme].warning }
                  ]}
                >
                  {t('unknown')}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>

          {/* Price (Optional) */}
          {status === 'in_stock' && (
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>{t('addPrice')}</ThemedText>
              <ThemedView style={styles.priceContainer}>
                <TextInput
                  style={[styles.input, { borderColor: Colors[colorScheme].border }]}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={Colors[colorScheme].placeholder}
                />
                <ThemedText style={styles.currency}>{t('currency')}</ThemedText>
              </ThemedView>
            </ThemedView>
          )}

          {/* Expiry Date (Optional) */}
          {status === 'in_stock' && (
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>{t('addExpiryDate')}</ThemedText>
              <TouchableOpacity
                style={[styles.selector, { borderColor: Colors[colorScheme].border }]}
                onPress={() => setShowDatePicker(true)}
              >
                {expiryDate ? (
                  <ThemedText>
                    {expiryDate.toLocaleDateString()}
                  </ThemedText>
                ) : (
                  <ThemedText style={{ color: Colors[colorScheme].placeholder }}>
                    {t('selectDate')}
                  </ThemedText>
                )}
                <IconSymbol name="calendar" size={20} color={Colors[colorScheme].icon} />
              </TouchableOpacity>

              {showDatePicker && (
                Platform.OS === 'ios' ? (
                  <Modal
                    transparent={true}
                    animationType="slide"
                    visible={showDatePicker}
                  >
                    <View style={styles.datePickerModalContainer}>
                      <View style={[styles.datePickerContainer, { backgroundColor: Colors[colorScheme].background }]}>
                        <View style={styles.datePickerHeader}>
                          <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <ThemedText style={{ color: Colors[colorScheme].tint }}>{t('cancel')}</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDateChange({ type: 'set' }, expiryDate || new Date())}>
                            <ThemedText style={{ color: Colors[colorScheme].tint }}>{t('confirm')}</ThemedText>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={expiryDate || new Date()}
                          mode="date"
                          display="spinner"
                          onChange={(_: any, date?: Date) => {
                            if (date) setExpiryDate(date);
                          }}
                          minimumDate={new Date()}
                          style={{ height: 200 }}
                        />
                      </View>
                    </View>
                  </Modal>
                ) : (
                  <DateTimePicker
                    value={expiryDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )
              )}
            </ThemedView>
          )}

          {/* Notes (Optional) */}
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>{t('addNotes')}</ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { borderColor: Colors[colorScheme].border }
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('addNotes')}
              placeholderTextColor={Colors[colorScheme].placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </ThemedView>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: Colors[colorScheme].tint },
              (submitting || !selectedDrug || !selectedPharmacy) && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={submitting || !selectedDrug || !selectedPharmacy}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.submitButtonText}>{t('submit')}</ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>

      {/* Drug Selection Modal */}
      <Modal
        visible={drugModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDrugModalVisible(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={[styles.modalContent, { backgroundColor: Colors[colorScheme].background }]}>
            <ThemedView style={styles.modalHeader}>
              <ThemedText type="subtitle">{t('selectDrug')}</ThemedText>
              <TouchableOpacity onPress={() => setDrugModalVisible(false)}>
                <IconSymbol name="xmark" size={24} color={Colors[colorScheme].icon} />
              </TouchableOpacity>
            </ThemedView>

            <SearchBar
              placeholder={t('searchDrugs')}
              value={drugSearchQuery}
              onChangeText={setDrugSearchQuery}
              onSubmit={handleDrugSearch}
            />

            {loadingDrugs ? (
              <ActivityIndicator style={styles.modalLoader} color={Colors[colorScheme].tint} />
            ) : (
              <FlatList
                data={drugs}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <DrugListItem
                    drug={item}
                    onPress={() => handleSelectDrug(item)}
                  />
                )}
                ListEmptyComponent={
                  <ThemedView style={styles.emptyContainer}>
                    <ThemedText>{t('noDrugsFound')}</ThemedText>
                  </ThemedView>
                }
              />
            )}
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* Pharmacy Selection Modal */}
      <Modal
        visible={pharmacyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPharmacyModalVisible(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={[styles.modalContent, { backgroundColor: Colors[colorScheme].background }]}>
            <ThemedView style={styles.modalHeader}>
              <ThemedText type="subtitle">{t('selectPharmacy')}</ThemedText>
              <TouchableOpacity onPress={() => setPharmacyModalVisible(false)}>
                <IconSymbol name="xmark" size={24} color={Colors[colorScheme].icon} />
              </TouchableOpacity>
            </ThemedView>

            <SearchBar
              placeholder={t('search')}
              value={pharmacySearchQuery}
              onChangeText={setPharmacySearchQuery}
              onSubmit={handlePharmacySearch}
            />

            {loadingPharmacies ? (
              <ActivityIndicator style={styles.modalLoader} color={Colors[colorScheme].tint} />
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
                    onPress={() => handleSelectPharmacy(item)}
                  />
                )}
                ListEmptyComponent={
                  <ThemedView style={styles.emptyContainer}>
                    <ThemedText>{t('noPharmaciesFound')}</ThemedText>
                  </ThemedView>
                }
              />
            )}
          </ThemedView>
        </ThemedView>
      </Modal>
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
  title: {
    marginVertical: 16,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderColor: '#e0e0e0',
  },
  statusText: {
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currency: {
    marginLeft: 8,
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalLoader: {
    marginTop: 40,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  // Date picker styles
  datePickerModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
});
