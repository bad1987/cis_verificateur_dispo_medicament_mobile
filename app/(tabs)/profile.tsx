import { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Switch, View } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import reportService, { AvailabilityReport } from '@/services/reportService';

export default function ProfileScreen() {
  const { t, language, changeLanguage } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const [userReports, setUserReports] = useState<AvailabilityReport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserReports();
    }
  }, [isAuthenticated]);

  const fetchUserReports = async () => {
    try {
      setLoading(true);
      const response = await reportService.getUserReports(1, 5);
      setUserReports(response.reports);
    } catch (error) {
      console.error('Error fetching user reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert(t('error'), t('genericError'));
    }
  };

  const handleLanguageToggle = () => {
    changeLanguage(language === 'FR' ? 'EN' : 'FR');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      undefined,
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return Colors[colorScheme].success;
      case 'out_of_stock':
        return Colors[colorScheme].error;
      default:
        return Colors[colorScheme].warning;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_stock':
        return t('inStock');
      case 'out_of_stock':
        return t('outOfStock');
      default:
        return t('unknown');
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t('profileTab'),
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors[colorScheme].background
          },
          headerTintColor: Colors[colorScheme].text,
        }}
      />
      <ScrollView style={styles.container}>
        <ThemedView style={styles.content}>
          {/* User Info Section */}
          <ThemedView style={styles.userSection}>
            <ThemedView style={[styles.avatarContainer, { backgroundColor: Colors[colorScheme].tint }]}>
              <ThemedText style={styles.avatarText}>
                {user?.username ? user.username.charAt(0).toUpperCase() : '?'}
              </ThemedText>
            </ThemedView>

            {isAuthenticated ? (
              <ThemedView style={styles.userInfo}>
                <ThemedText type="title" style={styles.username}>
                  {user?.username}
                </ThemedText>
                <ThemedText style={styles.email}>
                  {user?.email}
                </ThemedText>
              </ThemedView>
            ) : (
              <ThemedView style={styles.userInfo}>
                <ThemedText type="title" style={styles.username}>
                  {t('guest')}
                </ThemedText>
                <TouchableOpacity
                  style={[styles.loginButton, { backgroundColor: Colors[colorScheme].tint }]}
                  onPress={() => router.push('/auth/login')}
                >
                  <ThemedText style={styles.loginButtonText}>
                    {t('login')}
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}
          </ThemedView>

          {/* Settings Section */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t('settings')}
            </ThemedText>

            <ThemedView
              variant="surface"
              style={[styles.settingItem, { borderColor: Colors[colorScheme].border }]}
            >
              <ThemedView style={styles.settingContent}>
                <IconSymbol name="globe" size={24} color={Colors[colorScheme].icon} />
                <ThemedText style={styles.settingText}>{t('language')}</ThemedText>
              </ThemedView>

              <ThemedView style={styles.languageToggle}>
                <ThemedText style={language === 'FR' ? styles.activeLanguage : styles.inactiveLanguage}>
                  FR
                </ThemedText>
                <Switch
                  value={language === 'EN'}
                  onValueChange={handleLanguageToggle}
                  trackColor={{ false: '#767577', true: Colors[colorScheme].tint }}
                  thumbColor="#f4f3f4"
                />
                <ThemedText style={language === 'EN' ? styles.activeLanguage : styles.inactiveLanguage}>
                  EN
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <TouchableOpacity
              onPress={() => router.push('/about')}
            >
              <ThemedView
                variant="surface"
                style={[styles.settingItem, { borderColor: Colors[colorScheme].border }]}
              >
                <ThemedView style={styles.settingContent}>
                  <IconSymbol name="info.circle" size={24} color={Colors[colorScheme].icon} />
                  <ThemedText style={styles.settingText}>{t('about')}</ThemedText>
                </ThemedView>
                <IconSymbol name="chevron.right" size={20} color={Colors[colorScheme].icon} />
              </ThemedView>
            </TouchableOpacity>

            {isAuthenticated && (
              <TouchableOpacity
                onPress={handleLogout}
              >
                <ThemedView
                  variant="surface"
                  style={[styles.settingItem, { borderColor: Colors[colorScheme].border }]}
                >
                  <ThemedView style={styles.settingContent}>
                    <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color={Colors[colorScheme].error} />
                    <ThemedText style={[styles.settingText, { color: Colors[colorScheme].error }]}>
                      {t('logout')}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </TouchableOpacity>
            )}
          </ThemedView>

          {/* Recent Reports Section */}
          {isAuthenticated && (
            <ThemedView style={styles.section}>
              <ThemedView style={styles.sectionHeader}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  {t('myReports')}
                </ThemedText>
                <TouchableOpacity onPress={() => router.push('/reports/my-reports')}>
                  <ThemedText style={[styles.viewAllText, { color: Colors[colorScheme].tint }]}>
                    {t('viewAll')}
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>

              {loading ? (
                <ActivityIndicator style={styles.loader} color={Colors[colorScheme].tint} />
              ) : userReports.length > 0 ? (
                userReports.map(report => (
                  <ThemedView
                    key={report.id}
                    variant="surface"
                    style={[styles.reportItem, { borderColor: Colors[colorScheme].border }]}
                  >
                    <ThemedView style={styles.reportHeader}>
                      <ThemedText style={styles.reportDrug}>
                        {language === 'FR' ? report.drug?.nameFR : report.drug?.nameEN}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.reportStatus,
                          { color: getStatusColor(report.status) }
                        ]}
                      >
                        {getStatusText(report.status)}
                      </ThemedText>
                    </ThemedView>

                    <ThemedView style={styles.reportDetails}>
                      <ThemedText style={styles.reportPharmacy}>
                        {report.pharmacy?.name}
                      </ThemedText>
                      <ThemedText style={styles.reportDate}>
                        {formatDate(report.createdAt)}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                ))
              ) : (
                <ThemedView
                  variant="surface"
                  style={styles.emptyState}
                >
                  <ThemedText style={styles.emptyStateText}>
                    {t('noReports')}
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>
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
  content: {
    padding: 16,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  username: {
    fontSize: 20,
    marginBottom: 4,
  },
  email: {
    opacity: 0.7,
  },
  loginButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 12,
    fontSize: 16,
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeLanguage: {
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  inactiveLanguage: {
    opacity: 0.5,
    marginHorizontal: 8,
  },
  reportItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportDrug: {
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
  },
  reportStatus: {
    fontWeight: '600',
  },
  reportDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reportPharmacy: {
    opacity: 0.7,
    flex: 1,
  },
  reportDate: {
    opacity: 0.7,
    fontSize: 12,
  },
  loader: {
    marginVertical: 20,
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
