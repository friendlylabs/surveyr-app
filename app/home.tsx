import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import AlertContainer from '../components/AlertContainer';
import TopBar from '../components/TopBar';
import { useTheme } from '../contexts/ThemeContext';
import { database } from '../services/database';

interface Form {
  id: string;
  title: string;
  content: string;
  theme?: string;
  created_at: string;
  updated_at: string;
  submissionCount?: number;
}

interface OverviewData {
  formsCount: number;
  submissionsCount: number;
  recentForms: Form[];
}

export default function HomeScreen() {
  const router = useRouter();
  const { isDarkTheme, colors, styles: themeStyles } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<OverviewData>({
    formsCount: 0,
    submissionsCount: 0,
    recentForms: [],
  });
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Starting database initialization...');
      
      // Initialize database
      await database.initialize();
      
      console.log('Database initialized, fetching data...');

      // Get all forms and submission data
      const allForms = await database.getForms();
      const submissionTotal = await database.countSubmissions();
      
      // Get forms with recent submissions (last 5)
      const recentFormsWithSubmissions = await database.getFormsWithRecentSubmissions(5);
      
      // Add submission counts to recent forms
      const recentFormsWithCounts = await Promise.all(
        recentFormsWithSubmissions.map(async (form) => {
          const submissionCount = await database.countSubmissionsByFormId(form.id);
          return { ...form, submissionCount };
        })
      );
      
      console.log('Data fetched:', { 
        formsCount: allForms.length, 
        submissionTotal,
        recentFormsWithSubmissions: recentFormsWithCounts.length
      });
      
      setOverviewData({
        formsCount: allForms.length,
        submissionsCount: submissionTotal,
        recentForms: recentFormsWithCounts,
      });
    } catch (err) {
      console.error('Error loading overview:', err);
      // For now, show empty state instead of error to allow app to work
      setOverviewData({
        formsCount: 0,
        submissionsCount: 0,
        recentForms: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check authentication on page load
  const checkAuthentication = useCallback(async () => {
    try {
      // Add a small delay to ensure context is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const [token, user] = await AsyncStorage.multiGet(['token', 'user']);
      
      if (!token[1] || !user[1]) {
        console.log('No valid session found, redirecting to login');
        Toast.show({
          type: 'error',
          text1: 'Session Expired',
          text2: 'Please login again',
        });
        
        // Add delay before navigation
        setTimeout(() => {
          router.replace('/');
        }, 1000);
        return;
      }
      
      // If authenticated, load the overview data
      await loadOverview();
    } catch (error) {
      console.error('Authentication check failed:', error);
      setTimeout(() => {
        router.replace('/');
      }, 1000);
    }
  }, [router, loadOverview]);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleFormPress = (form: Form) => {
    // Navigate to form show screen
    router.push(`/forms/show?id=${form.id}` as any);
  };

  const handleFormLongPress = (form: Form) => {
    Alert.alert(
      form.title,
      'Choose an action for this form',
      [
        {
          text: 'Start Collection',
          onPress: () => handleFormPress(form),
        },
        {
          text: 'View Submissions',
          onPress: () => handleViewSubmissions(form),
        },
        {
          text: 'Synchronize Data',
          onPress: () => handleSyncForm(form),
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            // Dialog will be dismissed automatically
          },
        },
      ],
      {
        cancelable: true, // Allow dismissing by tapping outside on Android
      }
    );
  };

  const handleViewSubmissions = (form: Form) => {
    // TODO: Navigate to submissions view
    Toast.show({
      type: 'info',
      text1: 'Submissions View',
      text2: 'Submissions view will be implemented soon',
    });
  };

  const handleSyncForm = async (form: Form) => {
    // TODO: Implement sync functionality
    Toast.show({
      type: 'info',
      text1: 'Sync Feature',
      text2: 'Form synchronization will be implemented soon',
    });
  };

  const navigateToForms = () => {
    router.push('forms/list' as any);
  };

  const renderFormItem = (form: Form, index: number) => {
    const formattedTitle = form.title.charAt(0).toUpperCase() + form.title.slice(1).toLowerCase();

    return (
      <TouchableOpacity
        key={form.id}
        style={[localStyles.formItem, { backgroundColor: colors.card, marginBottom: index === overviewData.recentForms.length - 1 ? 0 : 8 }]}
        onPress={() => handleFormPress(form)}
        onLongPress={() => handleFormLongPress(form)}
        activeOpacity={0.7}
      >
        <View style={localStyles.formContent}>
          <Text style={[localStyles.formTitle, { color: colors.text }]}>{formattedTitle}</Text>
          <Text style={[localStyles.formSubtitle, { color: colors.textSecondary }]}>
            {form.submissionCount ? `${form.submissionCount} submission${form.submissionCount > 1 ? 's' : ''}` : 'No submissions'} • Last updated: {new Date(form.updated_at).toLocaleDateString()}
          </Text>
        </View>
        <Ionicons
          name="documents-outline"
          size={24}
          color={colors.border}
          style={localStyles.formIcon}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[themeStyles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <TopBar title="Surveyr" />
      
      <ScrollView contentContainerStyle={localStyles.scrollContainer}>
        {/* Main Content */}
        <View style={localStyles.main}>
          {isLoading ? (
            <View style={localStyles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[localStyles.loadingText, { color: colors.text }]}>
                Please wait, Loading page ...
              </Text>
            </View>
          ) : error ? (
            <AlertContainer
              icon="fa-exclamation-triangle"
              title="Error"
              message={error}
              isDarkTheme={isDarkTheme}
            />
          ) : (
            <View style={localStyles.overviewContainer}>
              {/* Overview Cards */}
              <View style={localStyles.overviewGrid}>
                <View style={[localStyles.overviewCard, { backgroundColor: colors.card }]}>
                  <Text style={[localStyles.cardTitle, { color: colors.textSecondary }]}>Forms</Text>
                  <Text style={[localStyles.cardValue, { color: colors.primary }]}>{overviewData.formsCount}</Text>
                  <Ionicons
                    name="bar-chart-outline"
                    size={32}
                    color={colors.border}
                    style={localStyles.cardIcon}
                  />
                </View>
                
                <View style={[localStyles.overviewCard, { backgroundColor: colors.card }]}>
                  <Text style={[localStyles.cardTitle, { color: colors.textSecondary }]}>Submissions</Text>
                  <Text style={[localStyles.cardValue, { color: colors.primary }]}>{overviewData.submissionsCount}</Text>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={32}
                    color={colors.border}
                    style={localStyles.cardIcon}
                  />
                </View>
              </View>

              {/* Recent Forms Section */}
              <View style={localStyles.recentFormsSection}>
                <View style={localStyles.sectionHeader}>
                  <Text style={[localStyles.sectionTitle, { color: colors.text }]}>
                    Recent Forms
                  </Text>
                  <TouchableOpacity onPress={navigateToForms}>
                    <Text style={[localStyles.viewAllLink, { color: colors.primary }]}>View All</Text>
                  </TouchableOpacity>
                </View>

                <View style={localStyles.formsContainer}>
                  {overviewData.recentForms.length > 0 ? (
                    overviewData.recentForms.map((form, index) => renderFormItem(form, index))
                  ) : (
                    <AlertContainer
                      icon="fa-info-circle"
                      title="No forms with submissions"
                      message="No forms have received any submissions yet. Complete some forms to see them here."
                      isDarkTheme={isDarkTheme}
                    />
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      
      <Toast />
    </View>
  );
}

const localStyles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  main: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    opacity: 0.6,
    marginTop: 12,
  },
  overviewContainer: {
    flex: 1,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  overviewCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    position: 'relative',
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    opacity: 0.6,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  cardIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    opacity: 0.1,
  },
  recentFormsSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  formsContainer: {
    flex: 1,
  },
  formItem: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  formContent: {
    flex: 1,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.8,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  formIcon: {
    opacity: 0.5,
  },
});