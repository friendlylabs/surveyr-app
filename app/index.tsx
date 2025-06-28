import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera, CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

export default function Index() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [splashScreenVisible, setSplashScreenVisible] = useState(true);
  const router = useRouter();

  const checkExistingSession = useCallback(async () => {
    try {
      console.log('Starting session check...');
      
      // Add a delay to ensure app is fully loaded
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const [token, projectUrl, user] = await AsyncStorage.multiGet([
        'token',
        'projectUrl',
        'user'
      ]);

      console.log('Session data check:', {
        hasToken: !!token[1],
        hasProjectUrl: !!projectUrl[1],
        hasUser: !!user[1]
      });

      // Check if all required data exists
      if (token[1] && projectUrl[1] && user[1]) {
        console.log('Valid session found, will redirect to home after splash');
        
        // Don't navigate immediately, let splash screen control the timing
        // Store that we should navigate after splash
        setTimeout(() => {
          Toast.show({
            type: 'success',
            text1: 'Welcome back!',
            text2: 'Redirecting to home...',
          });
          
          setTimeout(() => {
            console.log('Navigating to home...');
            router.replace('./home' as any);
          }, 500);
        }, 100);
        
        return;
      } else {
        console.log('No valid session found, staying on landing page');
      }
    } catch (error) {
      console.error('Session check failed:', error);
      // Clear any corrupted data
      try {
        await AsyncStorage.multiRemove(['token', 'project', 'user', 'projectUrl']);
        console.log('Cleared corrupted session data');
      } catch (clearError) {
        console.error('Failed to clear storage:', clearError);
      }
    } finally {
      console.log('Session check completed');
      setIsCheckingSession(false);
    }
  }, [router]);

  useEffect(() => {
    console.log('App initialization started...');
    
    // Set minimum splash screen duration (5 seconds for testing)
    const minimumSplashDuration = 5000; // 5 seconds
    const startTime = Date.now();
    
    const initializeApp = async () => {
      console.log('Getting camera permissions...');
      await getCameraPermissions();
      
      console.log('Checking existing session...');
      await checkExistingSession();
      
      // Calculate remaining time for splash screen
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minimumSplashDuration - elapsedTime);
      
      if (remainingTime > 0) {
        console.log(`Waiting additional ${remainingTime}ms for minimum splash duration...`);
        setTimeout(() => {
          console.log('Splash screen minimum duration completed');
          setSplashScreenVisible(false);
        }, remainingTime);
      } else {
        console.log('Minimum splash duration already elapsed');
        setSplashScreenVisible(false);
      }
    };
    
    // Small delay before starting initialization
    const timer = setTimeout(() => {
      initializeApp().catch(error => {
        console.error('App initialization failed:', error);
        // Even if initialization fails, hide splash after minimum duration
        setTimeout(() => {
          setSplashScreenVisible(false);
        }, minimumSplashDuration);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [checkExistingSession]);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleQRCodeScan = async (data: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setShowScanner(false);

    try {
      const response = await fetch(data);
      const result = await response.json();

      if (result.status) {
        const projectUrl = new URL(data);
        
        // Store authentication data
        await AsyncStorage.multiSet([
          ['token', result.token],
          ['project', result.projectId],
          ['user', JSON.stringify(result.user)],
          ['projectUrl', projectUrl.origin + '/api/'],
        ]);

        Toast.show({
          type: 'success',
          text1: 'Authentication Successful',
          text2: 'Redirecting to home...',
        });

        // Navigate to home page (you'll need to create this)
        router.replace('./home' as any);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Authentication Failed',
          text2: result.message || 'Could not authenticate, please try again',
        });
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        Toast.show({
          type: 'error',
          text1: 'Connection Error',
          text2: 'Failed to connect to the server',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'An unknown server error occurred',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanPress = () => {
    if (hasPermission === null) {
      Alert.alert('Camera Permission', 'Requesting camera permission...');
      getCameraPermissions();
      return;
    }
    
    if (hasPermission === false) {
      Alert.alert(
        'Camera Permission Required',
        'Camera access is needed to scan QR codes. Please enable it in settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    setShowScanner(true);
  };

  const handleManualEntry = () => {
    router.push('./auth/login' as any);
  };

  if (splashScreenVisible || isCheckingSession) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="auto" />
        <View style={styles.loadingContent}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <ActivityIndicator size="large" color="#10B981" style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>
            {isCheckingSession ? 'Checking session...' : 'Loading...'}
          </Text>
        </View>
        <Toast />
      </View>
    );
  }

  if (showScanner) {
    return (
      <View style={styles.scannerContainer}>
        <StatusBar style="light" />
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={({ data }) => handleQRCodeScan(data)}
        >
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowScanner(false)}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.scannerFrame}>
              <View style={styles.scannerBox} />
              <Text style={styles.scannerText}>
                Place a barcode inside the scan area
              </Text>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.content}>
        <View style={styles.centerContent}>
          <Image
            source={require('../assets/images/logo.png')} // Using existing adaptive icon
            style={styles.logo}
            resizeMode="contain"
          />
          
          <Text style={styles.welcomeText}>Welcome to Surveyr Collect</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.scanButton, isLoading && styles.disabledButton]}
              onPress={handleScanPress}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="qr-code" size={20} color="white" style={styles.buttonIcon} />
                  <Text style={styles.scanButtonText}>Scan QR Code</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.manualButton}
              onPress={handleManualEntry}
            >
              <Ionicons name="key" size={20} color="#4B5563" style={styles.buttonIcon} />
              <Text style={styles.manualButtonText}>Enter Details</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by{' '}
            <Text style={styles.companyText}>FriendlyLabs</Text>
          </Text>
        </View>
      </View>
      
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  scanButton: {
    backgroundColor: '#4ADE80',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 50,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  manualButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  manualButtonText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
  },
  companyText: {
    color: '#10B981',
    fontWeight: '600',
  },
  // Scanner styles
  scannerContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    paddingTop: 60,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
  },
  scannerFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 50,
  },
  scannerBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  scannerText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  // Loading styles
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingSpinner: {
    marginTop: 20,
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});
