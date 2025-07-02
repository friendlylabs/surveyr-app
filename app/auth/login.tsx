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
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { database } from '../../services/database';

interface LoginResponse {
  status: boolean;
  token?: string;
  projectId?: string;
  user?: any;
  message?: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const validateForm = useCallback(() => {
    const urlIsValid = /^(https?:\/\/)?((([a-zA-Z\d]([a-zA-Z\d-]*[a-zA-Z\d])*)\.)+[a-zA-Z]{2,}|((\d{1,3}\.){3}\d{1,3}))(:\d{1,5})?(\/[^\s]*)?$/.test(url);
    const usernameIsValid = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(username);
    const passwordIsValid = password.length >= 6;

    setIsFormValid(urlIsValid && usernameIsValid && passwordIsValid);
  }, [url, username, password]);

  useEffect(() => {
    validateForm();
  }, [validateForm]);

  const handleLogin = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    
    try {
      const projectUrl = url + '/api/';
      await AsyncStorage.setItem('projectUrl', projectUrl);

      const response = await fetch(url + '/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: username,
          password: password,
        }),
      });

      const data: LoginResponse = await response.json();
      handleLoginResponse(data);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: 'An error occurred during login',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginResponse = async (response: LoginResponse) => {
    if (response.status) {
      const newProjectId = response.projectId || '';
      
      // Get current project ID before updating
      const currentProjectId = await AsyncStorage.getItem('project');
      
      console.log('Manual login result:', { newProjectId, currentProjectId });
      
      await AsyncStorage.multiSet([
        ['token', response.token || ''],
        ['project', newProjectId],
        ['user', JSON.stringify(response.user || {})],
      ]);

      // Force database to switch projects if different
      if (currentProjectId !== newProjectId) {
        console.log(`Manual login: Switching from project ${currentProjectId} to ${newProjectId}`);
        try {
          await database.switchProject(newProjectId);
        } catch (dbError) {
          console.error('Database switch error during manual login:', dbError);
          // Continue anyway, the database will reinitialize when needed
        }
      }

      Toast.show({
        type: 'success',
        text1: 'Login Successful',
        text2: newProjectId !== currentProjectId ? 'Switched to new project' : 'Welcome back!',
      });

      router.push('/home');
    } else {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: response.message || 'An error occurred',
      });
    }
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  const handleCancel = () => {
    router.push('/');
  };

  const currentStyles = isDarkTheme ? { ...styles, ...darkStyles } : styles;

  return (
    <SafeAreaView style={[currentStyles.container, { backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff' }]}>
      <ScrollView contentContainerStyle={currentStyles.scrollContainer}>
        {/* Header */}
        <View style={currentStyles.header}>
          <Text style={currentStyles.headerTitle}>Project Credentials</Text>
          <TouchableOpacity style={currentStyles.themeButton} onPress={toggleTheme}>
            <Ionicons 
              name={isDarkTheme ? "sunny" : "moon"} 
              size={20} 
              color={isDarkTheme ? "#fbbf24" : "#6b7280"} 
            />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={currentStyles.main}>
          {/* URL Field */}
          <View style={currentStyles.inputContainer}>
            <TextInput
              style={currentStyles.input}
              placeholder="https://example.com"
              placeholderTextColor={isDarkTheme ? "#9ca3af" : "#6b7280"}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Text style={currentStyles.label}>Domain</Text>
          </View>

          {/* Username Field */}
          <View style={currentStyles.inputContainer}>
            <TextInput
              style={currentStyles.input}
              placeholder="john@example.com"
              placeholderTextColor={isDarkTheme ? "#9ca3af" : "#6b7280"}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Text style={currentStyles.label}>Username</Text>
          </View>

          {/* Password Field */}
          <View style={currentStyles.inputContainer}>
            <TextInput
              style={currentStyles.input}
              placeholder="password"
              placeholderTextColor={isDarkTheme ? "#9ca3af" : "#6b7280"}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Text style={currentStyles.label}>Password</Text>
          </View>

          {/* Information Notice */}
          <View style={currentStyles.infoContainer}>
            <Ionicons 
              name="information-circle-outline" 
              size={20} 
              color={isDarkTheme ? "#9ca3af" : "#6b7280"} 
              style={currentStyles.infoIcon}
            />
            <Text style={currentStyles.infoText}>
              After you add your project, you can configure it in Settings
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={currentStyles.footer}>
          <TouchableOpacity onPress={handleCancel} style={currentStyles.cancelButton}>
            <Text style={currentStyles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              currentStyles.loginButton,
              { opacity: isFormValid && !isLoading ? 1 : 0.5 }
            ]}
            onPress={handleLogin}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={currentStyles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
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
  inputContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  input: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 6,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  label: {
    position: 'absolute',
    left: 16,
    top: -8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 4,
    fontSize: 12,
    color: '#10B981',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    marginRight: 20,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#10B981',
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
});

const darkStyles = StyleSheet.create({
  headerTitle: {
    color: '#f9fafb',
  },
  themeButton: {
    backgroundColor: '#374151',
  },
  input: {
    borderColor: '#4b5563',
    color: '#f9fafb',
    backgroundColor: '#374151',
  },
  label: {
    backgroundColor: '#1f2937',
    color: '#10B981',
  },
  infoText: {
    color: '#9ca3af',
  },
  footer: {
    borderTopColor: '#4b5563',
  },
});