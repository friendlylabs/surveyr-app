import { Ionicons } from '@expo/vector-icons';
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
import { WebView } from 'react-native-webview';
import TopBar from '../../components/TopBar';
import { useTheme } from '../../contexts/ThemeContext';
import { database, Form } from '../../services/database';

export default function ShowSurveyScreen() {
    const router = useRouter();
    const { id: formId } = useLocalSearchParams<{ id: string }>();
    const { isDarkTheme, colors } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [form, setForm] = useState<Form | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [webViewKey, setWebViewKey] = useState(0);

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
        } catch (err) {
            console.error('Error loading form:', err);
            setError('An error occurred while loading the form. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [formId]);

    useEffect(() => {
        loadForm();
    }, [loadForm]);

    const handleWebViewMessage = async (event: any) => {
        try {
            const message = JSON.parse(event.nativeEvent.data);
            
            if (message.type === 'SURVEY_COMPLETE') {
                await handleSurveyComplete(message.data);
            } else if (message.type === 'SURVEY_ERROR') {
                console.error('Survey error:', message.error);
                Toast.show({
                    type: 'error',
                    text1: 'Survey Error',
                    text2: message.error || 'An error occurred in the survey',
                });
            }
        } catch (err) {
            console.error('Error handling WebView message:', err);
        }
    };

    const handleSurveyComplete = async (surveyData: any) => {
        try {
            if (!formId) return;

            await database.addSubmission({
                form_id: formId,
                content: JSON.stringify(surveyData),
                created_at: new Date().toISOString(),
            });

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
                            // Reload the survey
                            setWebViewKey(prev => prev + 1);
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

    const generateSurveyHTML = (form: Form) => {
        return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <title>Survey</title>
        <link rel="stylesheet" href="https://forms.camara.org/vendor/surveyjs/survey-core.min.css">
        <script src="https://forms.camara.org/vendor/surveyjs/survey.core.min.js"></script>
        <script src="https://forms.camara.org/vendor/surveyjs/survey-js-ui.min.js"></script>
        <script src="https://forms.camara.org/vendor/surveyjs/themes/index.min.js"></script>
        <style>
        .sd-title.sd-container-modern__title{
            display: none;
        }
        .sd-root-modern__wrapper {
            background-color: ${isDarkTheme ? '#121212' : '#ffffff'};
        }
        body {
            background-color: ${isDarkTheme ? '#121212' : '#ffffff'};
            color: ${isDarkTheme ? '#ffffff' : '#000000'};
        }
        </style>
    </head>
    <body>
        <div id="surveyContainer"></div>
        <script>
        try {
            const surveyJSON = ${form.content};
            const survey = new Survey.Model(surveyJSON);

            var formTheme = "Flat";
            var themeName = "${isDarkTheme ? 'DarkPanelless' : 'LightPanelless'}";
            var SurveyThemeMode = SurveyTheme[formTheme + themeName];

            document.addEventListener('DOMContentLoaded', function() {
                survey.render(document.getElementById('surveyContainer'));
                survey.applyTheme(SurveyThemeMode);
            });

            survey.onComplete.add(function(sender) {
                try {
                    const surveyData = sender.data;
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'SURVEY_COMPLETE',
                        data: surveyData
                    }));
                } catch (error) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'SURVEY_ERROR',
                        error: 'Failed to process survey completion: ' + error.message
                    }));
                }
            });
        } catch (error) {
            document.getElementById('surveyContainer').innerHTML =
                '<div style="padding: 20px; text-align: center; color: #ff0000;">' +
                    '<h3>Error Loading Survey</h3>' +
                    '<p>There was an error loading this survey. Please try again.</p>' +
                    '<p style="font-size: 12px; color: #666;">' + error.message + '</p>' +
                '</div>';
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'SURVEY_ERROR',
                error: 'Failed to initialize survey: ' + error.message
            }));
        }
        </script>
    </body>
    </html>`;
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
            
            <WebView
                key={webViewKey}
                style={styles.webView}
                source={{ html: generateSurveyHTML(form) }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                onMessage={handleWebViewMessage}
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator 
                            size="large" 
                            color={colors.primary} 
                        />
                        <Text style={styles.loadingText}>Loading survey...</Text>
                    </View>
                )}
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('WebView error: ', nativeEvent);
                    Toast.show({
                        type: 'error',
                        text1: 'WebView Error',
                        text2: 'Failed to load the survey. Please try again.',
                    });
                }}
                onHttpError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('WebView HTTP error: ', nativeEvent);
                }}
            />
        </SafeAreaView>
    );
}