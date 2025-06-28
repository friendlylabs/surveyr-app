import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
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

interface CloudForm {
  id: string;
  title: string;
  description: string;
  slug: string;
  content: any;
  theme?: string;
}

export default function DownloadFormsScreen() {
  const router = useRouter();
  const { isDarkTheme, colors, styles: themeStyles } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [cloudForms, setCloudForms] = useState<CloudForm[]>([]);
  const [selectedFormIds, setSelectedFormIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const checkConnectivity = async (): Promise<boolean> => {
    // Basic connectivity check - in a real app you might use a library like @react-native-async-storage/async-storage
    // For now, we'll assume connection is available
    return true;
  };

  const fetchCloudForms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const hasConnection = await checkConnectivity();
      if (!hasConnection) {
        setError('No internet connection. Please check your internet connection and try again.');
        return;
      }

      const projectUrl = await AsyncStorage.getItem('projectUrl');
      const token = await AsyncStorage.getItem('token');

      if (!projectUrl || !token) {
        setError('Missing project configuration. Please log in again.');
        return;
      }

      const requestUrl = `${projectUrl}forms`;
      
      console.log('Fetching forms from:', requestUrl);

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status && data.forms) {
        if (data.forms.length === 0) {
          setError('No forms found in this project. Please create a form and try again.');
          return;
        }
        
        console.log('Cloud forms loaded:', data.forms.length);
        setCloudForms(data.forms);
      } else {
        setError(data.message || 'Could not fetch forms from server.');
      }
    } catch (err) {
      console.error('Error fetching cloud forms:', err);
      setError('An error occurred while fetching forms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCloudForms();
  }, [fetchCloudForms]);

  const toggleFormSelection = (formId: string) => {
    setSelectedFormIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(formId)) {
        newSelection.delete(formId);
      } else {
        newSelection.add(formId);
      }
      return newSelection;
    });
  };

  const downloadSelectedForms = async () => {
    if (selectedFormIds.size === 0) {
      Toast.show({
        type: 'error',
        text1: 'No forms selected',
        text2: 'Please select at least one form to download.',
      });
      return;
    }

    try {
      setIsDownloading(true);

      const hasConnection = await checkConnectivity();
      if (!hasConnection) {
        Toast.show({
          type: 'error',
          text1: 'No internet connection',
          text2: 'Please check your internet connection and try again.',
        });
        return;
      }

      const projectUrl = await AsyncStorage.getItem('projectUrl');
      const token = await AsyncStorage.getItem('token');

      if (!projectUrl || !token) {
        Toast.show({
          type: 'error',
          text1: 'Authentication error',
          text2: 'Please log in again.',
        });
        return;
      }

      const requestUrl = `${projectUrl}forms`;
      
      // Create FormData with selected form IDs
      const formData = new FormData();
      selectedFormIds.forEach(formId => {
        formData.append('formId[]', formId);
      });

      console.log('Downloading forms:', Array.from(selectedFormIds));

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status && data.forms && data.forms.length > 0) {
        // Convert cloud forms to local form format
        const formsToSave: Form[] = data.forms.map((form: any) => ({
          id: form.id,
          title: form.title,
          content: JSON.stringify(form.content),
          theme: form.theme || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        // Save forms to local database
        const success = await database.addForms(formsToSave);

        if (success) {
          Toast.show({
            type: 'success',
            text1: 'Forms downloaded successfully',
            text2: `${formsToSave.length} form(s) have been saved to your device.`,
          });

          // Clear selection and refresh the list
          setSelectedFormIds(new Set());
          
          // Navigate back to forms list
          router.push('/forms/list' as any);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Download failed',
            text2: 'Failed to save forms to local storage.',
          });
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Download failed',
          text2: data.message || 'An error occurred while downloading forms.',
        });
      }
    } catch (err) {
      console.error('Error downloading forms:', err);
      Toast.show({
        type: 'error',
        text1: 'Download failed',
        text2: 'An error occurred while downloading forms. Please try again.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const formatTitle = (title: string) => {
    return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
  };

  const renderForm = (form: CloudForm) => {
    const isSelected = selectedFormIds.has(form.id);
    const description = form.description && form.description.length > 0 
      ? form.description 
      : 'No form description';

    return (
      <TouchableOpacity
        key={form.id}
        style={[
          styles.formItem,
          {
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.primary : 'transparent',
          }
        ]}
        onPress={() => toggleFormSelection(form.id)}
        activeOpacity={0.7}
      >
        <View style={styles.formContent}>
          <Text style={[styles.formTitle, { color: colors.text }]}>
            {formatTitle(form.title)}
          </Text>
          <Text 
            style={[styles.formDescription, { color: colors.textSecondary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {description}
          </Text>
        </View>
        
        <View style={styles.formActions}>
          <Ionicons 
            name="documents-outline" 
            size={24} 
            color={colors.border}
            style={styles.formIcon}
          />
          <View style={[
            styles.checkbox,
            {
              backgroundColor: isSelected ? colors.primary : 'transparent',
              borderColor: isSelected ? colors.primary : colors.border,
            }
          ]}>
            {isSelected && (
              <Ionicons name="checkmark" size={16} color="white" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Please wait, Fetching forms...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <AlertContainer
          icon="warning-outline"
          title="Could not fetch forms"
          message={error}
          isDarkTheme={isDarkTheme}
        />
      );
    }

    return (
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formsContainer}>
          {cloudForms.map(renderForm)}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[themeStyles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <TopBar title="Cloud Forms" />

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Download Button */}
      {!isLoading && !error && cloudForms.length > 0 && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.downloadButton,
              {
                backgroundColor: selectedFormIds.size > 0 && !isDownloading ? colors.primary : colors.textSecondary,
              }
            ]}
            onPress={downloadSelectedForms}
            disabled={selectedFormIds.size === 0 || isDownloading}
            activeOpacity={0.8}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="download" size={20} color="white" />
            )}
            <Text style={styles.downloadButtonText}>
              {isDownloading ? 'Downloading...' : 'Update Forms'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    opacity: 0.6,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  formsContainer: {
    paddingBottom: 100, // Space for download button
  },
  formItem: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  formContent: {
    flex: 1,
    marginRight: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  formDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
  formActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formIcon: {
    marginRight: 12,
    opacity: 0.1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
  },
  downloadButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
