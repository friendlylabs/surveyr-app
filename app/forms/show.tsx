import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { NativeSurveyRenderer } from '../../components/NativeSurveyRenderer';
import TopBar from '../../components/TopBar';
import { useTheme } from '../../contexts/ThemeContext';
import { database, Form } from '../../services/database';
import { createSurveyState, parseSurveyJS, type SurveyState } from '../../utils/surveyParser';

console.log(FileSystem.documentDirectory);

export default function ShowSurveyScreen() {
    const router = useRouter();
    const { id: formId } = useLocalSearchParams<{ id: string }>();
    const { isDarkTheme, colors } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [form, setForm] = useState<Form | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploadedFileIds, setUploadedFileIds] = useState<number[]>([]);
    const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
    const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean>(false);
    const [surveyState, setSurveyState] = useState<SurveyState | null>(null);
    const [surveyKey, setSurveyKey] = useState(0);

    const loadForm = useCallback(async () => {
        if (!formId) {
            setError('No form ID provided');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            await database.initialize();
            const formData = await database.getFormById(formId);
            
            if (!formData) {
                setError('Form not found');
                return;
            }

            setForm(formData);

            // Initialize native survey parser
            try {
                const surveyJSON = JSON.parse(formData.content);
                const parsedSurvey = parseSurveyJS(surveyJSON);
                const nativeSurveyState = createSurveyState(parsedSurvey);
                setSurveyState(nativeSurveyState);
                console.log('Survey parsed successfully for native rendering');
            } catch (parseError) {
                console.error('Survey parsing error:', parseError);
                setError('Failed to parse survey for native rendering');
                return;
            }
        } catch (err) {
            console.error('Error loading form:', err);
            setError('An error occurred while loading the form. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [formId]);

    const requestLocationPermission = useCallback(async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationPermissionGranted(status === 'granted');
            
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });
                setCurrentLocation(location);
                console.log('Location obtained:', location);
            } else {
                console.log('Location permission denied');
                Toast.show({
                    type: 'info',
                    text1: 'Location Permission',
                    text2: 'Location access denied. Some survey features may be limited.',
                });
            }
        } catch (error) {
            console.error('Error requesting location permission:', error);
            Toast.show({
                type: 'error',
                text1: 'Location Error',
                text2: 'Failed to get location. Please check your settings.',
            });
        }
    }, []);

    useEffect(() => {
        loadForm();
        requestLocationPermission();
    }, [loadForm, requestLocationPermission]);

    // Update survey theme when app theme changes
    useEffect(() => {
        // Native surveys automatically inherit the app theme through the theme context
        // No additional action needed for native rendering
    }, [isDarkTheme]);

    const handleNativeFileUpload = async (questionName: string, allowedTypes?: string[], maxFileSize?: number) => {
        try {
            // Show document picker
            const result = await DocumentPicker.getDocumentAsync({
                type: allowedTypes || '*/*',
                copyToCacheDirectory: true,
                multiple: false,
            }) as DocumentPicker.DocumentPickerResult;

            if (result.canceled) {
                return null; // User canceled
            }

            const file = result.assets[0];
            
            // Check file size if specified
            if (maxFileSize && file.size && file.size > maxFileSize) {
                Toast.show({
                    type: 'error',
                    text1: 'File Too Large',
                    text2: `File must be smaller than ${Math.round(maxFileSize / (1024 * 1024))}MB`,
                });
                throw new Error('File too large');
            }

            // Generate date-based filename following your convention
            const now = new Date();
            const datePrefix = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const hash = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
            const fileExtension = file.name.split('.').pop() || '';
            const hashedFileName = `${hash}.${fileExtension}`;
            const localFileName = `${datePrefix}-${hashedFileName}`;

            // Create attachments directory if it doesn't exist
            const attachmentsDir = `${FileSystem.documentDirectory}surveyr/attachments/`;
            await FileSystem.makeDirectoryAsync(attachmentsDir, { intermediates: true });

            // Copy file to our attachments directory
            const localFilePath = `${attachmentsDir}${localFileName}`;
            await FileSystem.copyAsync({
                from: file.uri,
                to: localFilePath
            });

            // Get project URL from AsyncStorage to construct server URL
            const projectUrl = await AsyncStorage.getItem('projectUrl');
            if (!projectUrl) {
                throw new Error('Project URL not found in storage');
            }
            
            // Remove '/api/' suffix and add storage path
            const baseUrl = projectUrl.replace('/api/', '');
            const serverUrl = `${baseUrl}/storage/attachments/${datePrefix.replace(/-/g, '/')}/${hashedFileName}`;

            // Save file record to database
            const fileRecord = await database.addFile({
                local_filename: localFileName,
                original_filename: file.name,
                server_url: serverUrl,
                local_path: localFilePath,
                file_size: file.size || undefined,
                mime_type: file.mimeType || undefined,
                form_id: formId,
                is_synced: false,
                created_at: new Date().toISOString()
            });

            // Track uploaded file for potential submission linking
            setUploadedFileIds(prev => [...prev, fileRecord]);

            console.log('File uploaded successfully:', {
                original: file.name,
                local: localFileName,
                serverUrl: serverUrl,
                fileId: fileRecord
            });

            return {
                fileUrl: serverUrl,
                fileName: file.name,
                fileSize: file.size,
                localPath: localFilePath
            };

        } catch (error) {
            console.error('File upload error:', error);
            Toast.show({
                type: 'error',
                text1: 'Upload Failed',
                text2: 'Failed to upload file. Please try again.',
            });
            throw error;
        }
    };

    const handleNativeLocationRequest = async (questionName: string) => {
        try {
            if (!locationPermissionGranted) {
                // Request permission again if not granted
                await requestLocationPermission();
                
                if (!locationPermissionGranted) {
                    throw new Error('Location permission denied');
                }
            }

            // Get current location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            
            setCurrentLocation(location);

            console.log('Location obtained for survey:', location);

            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
                timestamp: location.timestamp
            };

        } catch (error) {
            console.error('Location request error:', error);
            Toast.show({
                type: 'error',
                text1: 'Location Error',
                text2: 'Failed to get current location. Please try again.',
            });
            throw error;
        }
    };

    const handleNativeSurveyComplete = async (surveyData: Record<string, any>) => {
        try {
            if (!formId) return;

            const submissionId = await database.addSubmission({
                form_id: formId,
                content: JSON.stringify(surveyData),
                created_at: new Date().toISOString(),
            });

            // Link any uploaded files to this submission
            if (uploadedFileIds.length > 0) {
                for (const fileId of uploadedFileIds) {
                    await database.updateFileSubmissionId(fileId, submissionId);
                }
                console.log(`Linked ${uploadedFileIds.length} files to submission ${submissionId}`);
            }

            // Clear uploaded files for next submission
            setUploadedFileIds([]);

            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Form submitted successfully!',
            });

            // Show confirmation dialog
            Alert.alert(
                'Form Submitted',
                'Your response has been saved. Would you like to submit another response?',
                [
                    {
                        text: 'Go Back',
                        style: 'cancel',
                        onPress: () => router.back(),
                    },
                    {
                        text: 'Submit Another',
                        onPress: () => {
                            // Reset the survey
                            if (surveyState) {
                                surveyState.currentPageIndex = 0;
                                surveyState.surveyData = {};
                                surveyState.evaluator.updateData({});
                                setSurveyState({ ...surveyState });
                            }
                            setUploadedFileIds([]);
                            setSurveyKey(prev => prev + 1);
                        },
                    },
                ]
            );
        } catch (err) {
            console.error('Error saving submission:', err);
            Toast.show({
                type: 'error',
                text1: 'Save Error',
                text2: 'Failed to save your response. Please try again.',
            });
        }
    };

    const handleNativeSurveyError = (error: string) => {
        console.error('Native survey error:', error);
        Toast.show({
            type: 'error',
            text1: 'Survey Error',
            text2: error,
        });
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
            flex: 1,
            marginLeft: 12,
        },
        headerButton: {
            padding: 8,
            borderRadius: 6,
            backgroundColor: colors.surface,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.background,
        },
        loadingText: {
            marginTop: 16,
            fontSize: 16,
            color: colors.textSecondary,
        },
        webView: {
            flex: 1,
            backgroundColor: colors.background,
        },
        surveyLoadingOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        },
        surveyLoadingText: {
            marginTop: 16,
            fontSize: 16,
            color: colors.textSecondary,
            textAlign: 'center',
        },
    });

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.headerButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons 
                            name="arrow-back" 
                            size={16} 
                            color={colors.text} 
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Loading Survey...</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator 
                        size="large" 
                        color={colors.primary} 
                    />
                    <Text style={styles.loadingText}>Loading survey...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !form) {
        return (
            <SafeAreaView style={styles.container}>
                <TopBar 
                    title="Error"
                    leftComponent={
                        <TouchableOpacity 
                            style={styles.headerButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons 
                                name="arrow-back" 
                                size={20} 
                                color={colors.text} 
                            />
                        </TouchableOpacity>
                    }
                />
                <View style={styles.loadingContainer}>
                    <Ionicons 
                        name="alert-circle" 
                        size={64} 
                        color={colors.error} 
                    />
                    <Text style={[styles.loadingText, { marginTop: 20, textAlign: 'center' }]}>
                        {error || 'Form not found'}
                    </Text>
                    <TouchableOpacity 
                        style={{
                            marginTop: 20,
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            backgroundColor: colors.primary,
                            borderRadius: 8,
                        }}
                        onPress={loadForm}
                    >
                        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                            Try Again
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <TopBar 
                title={form.title}
                leftComponent={
                    <TouchableOpacity 
                        style={styles.headerButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons 
                            name="arrow-back" 
                            size={20} 
                            color={colors.text} 
                        />
                    </TouchableOpacity>
                }
            />
            
            <View style={{ flex: 1 }}>
                {/* Native Survey Renderer */}
                {form && surveyState ? (
                    <NativeSurveyRenderer
                        key={surveyKey}
                        surveyJSON={JSON.parse(form.content)}
                        onComplete={handleNativeSurveyComplete}
                        onError={handleNativeSurveyError}
                        onFileUpload={handleNativeFileUpload}
                        onLocationRequest={handleNativeLocationRequest}
                        currentLocation={currentLocation}
                        isDarkTheme={isDarkTheme}
                    />
                ) : (
                    <View style={styles.surveyLoadingOverlay}>
                        <ActivityIndicator 
                            size="large" 
                            color={colors.primary} 
                        />
                        <Text style={styles.surveyLoadingText}>
                            Initializing Native Survey...{'\n'}
                            Please wait while we prepare your survey
                        </Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}