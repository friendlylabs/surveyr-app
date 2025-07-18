import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import TopBar from '../components/TopBar';
import { useTheme } from '../contexts/ThemeContext';

interface User {
  fullname: string;
  email: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, styles: themeStyles } = useTheme();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadUserDetails();
  }, []);

  const loadUserDetails = async () => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        const userData = JSON.parse(userString);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  const openHelpDocs = async () => {
    const url = 'https://app.surveyr.co/docs';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Cannot open link',
          text2: 'Unable to open the documentation link',
        });
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to open documentation',
      });
    }
  };

  const showUnderDevelopment = () => {
    Alert.alert(
      'Under Development',
      'This feature is currently under development and will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  };

  const performLogout = async () => {
    try {
      // Clear all stored data
      await AsyncStorage.multiRemove([
        'token',
        'project',
        'user',
        'projectUrl',
      ]);

      Toast.show({
        type: 'success',
        text1: 'Logged out',
        text2: 'You have been successfully logged out',
      });

      // Navigate to login screen
      router.replace('/auth/login' as any);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Logout Error',
        text2: 'Failed to logout properly',
      });
    }
  };

  return (
    <SafeAreaView style={[themeStyles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <TopBar title="Settings" />
      
      <ScrollView contentContainerStyle={localStyles.scrollContainer}>
        {/* Main Content */}
        <View style={localStyles.main}>
          {/* User Profile Section */}
          <View style={[localStyles.profileSection, { backgroundColor: colors.card }]}>
            <View style={localStyles.avatarContainer}>
              <Image
                source={require('../assets/images/icon.png')} // Using app icon as default avatar
                style={localStyles.avatar}
                resizeMode="cover"
              />
            </View>
            <View style={localStyles.userInfo}>
              <Text style={[localStyles.userName, { color: colors.text }]}>
                {user?.fullname || 'User Name'}
              </Text>
              <Text style={[localStyles.userEmail, { color: colors.textSecondary }]}>
                {user?.email || 'user@example.com'}
              </Text>
            </View>
          </View>

          {/* Divider: <View style={[localStyles.divider, { backgroundColor: colors.border }]} /> */}

          {/* Menu Items */}
          <View style={localStyles.menuSection}>
            <TouchableOpacity
              style={[localStyles.menuItem, { backgroundColor: colors.card }]}
              onPress={openHelpDocs}
              activeOpacity={0.7}
            >
              <View style={localStyles.menuItemContent}>
                <Ionicons
                  name="help-circle-outline"
                  size={24}
                  color={colors.primary}
                  style={localStyles.menuIcon}
                />
                <Text style={[localStyles.menuText, { color: colors.text }]}>
                  Help & Docs
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[localStyles.menuItem, { backgroundColor: colors.card }]}
              onPress={showUnderDevelopment}
              activeOpacity={0.7}
            >
              <View style={localStyles.menuItemContent}>
                <Ionicons
                  name="key-outline"
                  size={24}
                  color={colors.primary}
                  style={localStyles.menuIcon}
                />
                <Text style={[localStyles.menuText, { color: colors.text }]}>
                  Survey Mode Pin
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[localStyles.menuItem, { backgroundColor: colors.card }]}
              onPress={showUnderDevelopment}
              activeOpacity={0.7}
            >
              <View style={localStyles.menuItemContent}>
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={colors.primary}
                  style={localStyles.menuIcon}
                />
                <Text style={[localStyles.menuText, { color: colors.text }]}>
                  App Settings
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[localStyles.menuItem, { backgroundColor: colors.card }]}
              onPress={showUnderDevelopment}
              activeOpacity={0.7}
            >
              <View style={localStyles.menuItemContent}>
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color={colors.primary}
                  style={localStyles.menuIcon}
                />
                <Text style={[localStyles.menuText, { color: colors.text }]}>
                  About
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={[localStyles.logoutButton, { backgroundColor: colors.error }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color="#ffffff"
              style={localStyles.logoutIcon}
            />
            <Text style={localStyles.logoutText}>Logout</Text>
          </TouchableOpacity>
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
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 24,
  },
  menuSection: {
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});