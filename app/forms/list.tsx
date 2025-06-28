import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import AlertContainer from '../../components/AlertContainer';
import TopBar from '../../components/TopBar';
import { useTheme } from '../../contexts/ThemeContext';
import { database, Form } from '../../services/database';

export default function FormsListScreen() {
  const router = useRouter();
  const { isDarkTheme, colors, styles: themeStyles } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [forms, setForms] = useState<Form[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadForms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Loading downloaded forms...');
      
      // Initialize database and get forms
      await database.initialize();
      const downloadedForms = await database.getForms();
      
      console.log('Downloaded forms loaded:', downloadedForms.length);
      setForms(downloadedForms);
    } catch (err) {
      console.error('Error loading forms:', err);
      setError('An error occurred while loading forms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

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
          text: 'Synchronize Data',
          onPress: () => handleSyncForm(form),
        },
        {
          text: 'Delete Form',
          style: 'destructive',
          onPress: () => handleDeleteForm(form),
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

  const handleSyncForm = async (form: Form) => {
    // TODO: Implement sync functionality
    Toast.show({
      type: 'info',
      text1: 'Sync Feature',
      text2: 'Form synchronization will be implemented soon',
    });
  };

  const handleDeleteForm = (form: Form) => {
    Alert.alert(
      'Delete Form',
      `Are you sure you want to delete "${form.title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDeleteForm(form),
        },
      ]
    );
  };

  const performDeleteForm = async (form: Form) => {
    try {
      const success = await database.deleteForm(form.id);
      if (success) {
        Toast.show({
          type: 'success',
          text1: 'Form Deleted',
          text2: `"${form.title}" has been removed`,
        });
        // Reload forms list
        loadForms();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Delete Failed',
          text2: 'Could not delete the form. Please try again.',
        });
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Delete Error',
        text2: 'An error occurred while deleting the form',
      });
    }
  };

  const navigateToDownload = () => {
    router.push('/forms/download' as any);
  };

  const renderFormItem = (form: Form, index: number) => {
    const formattedTitle = form.title.charAt(0).toUpperCase() + form.title.slice(1).toLowerCase();

    return (
      <TouchableOpacity
        key={form.id}
        style={[localStyles.formItem, { backgroundColor: colors.card, marginBottom: index === forms.length - 1 ? 0 : 8 }]}
        onPress={() => handleFormPress(form)}
        onLongPress={() => handleFormLongPress(form)}
        activeOpacity={0.7}
      >
        <View style={localStyles.formContent}>
          <Text style={[localStyles.formTitle, { color: colors.text }]}>{formattedTitle}</Text>
          <Text style={[localStyles.formSubtitle, { color: colors.textSecondary }]}>
            Last updated: {new Date(form.updated_at).toLocaleDateString()}
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
    <SafeAreaView style={[themeStyles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <TopBar title="Forms" />
      
      <ScrollView contentContainerStyle={localStyles.scrollContainer}>
        {/* Main Content */}
        <View style={localStyles.main}>
          {isLoading ? (
            <View style={localStyles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[localStyles.loadingText, { color: colors.text }]}>
                Please wait, Loading forms ...
              </Text>
            </View>
          ) : error ? (
            <AlertContainer
              icon="fa-exclamation-triangle"
              title="Error"
              message={error}
              isDarkTheme={isDarkTheme}
            />
          ) : forms.length === 0 ? (
            <View style={localStyles.emptyStateContainer}>
              <AlertContainer
                icon="fa-exclamation-triangle"
                title="No forms found"
                message="You have not downloaded any forms yet. Download forms from the cloud to get started."
                isDarkTheme={isDarkTheme}
              />
              <TouchableOpacity
                style={[localStyles.downloadButton, { backgroundColor: colors.primary }]}
                onPress={navigateToDownload}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="cloud-download-outline"
                  size={20}
                  color="#ffffff"
                  style={localStyles.downloadIcon}
                />
                <Text style={localStyles.downloadText}>Download Forms</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={localStyles.formsContainer}>
              <View style={localStyles.sectionHeader}>
                <Text style={[localStyles.sectionTitle, { color: colors.text }]}>
                  Downloaded Forms ({forms.length})
                </Text>
                <TouchableOpacity onPress={navigateToDownload}>
                  <Text style={[localStyles.downloadLink, { color: colors.primary }]}>Download More</Text>
                </TouchableOpacity>
              </View>

              <View style={localStyles.formsList}>
                {forms.map((form, index) => renderFormItem(form, index))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      
      <Toast />
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  themeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  downloadIcon: {
    marginRight: 8,
  },
  downloadText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  formsContainer: {
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
  downloadLink: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  formsList: {
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
    color: '#111827',
  },
  formSubtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  formIcon: {
    opacity: 0.5,
  },
});