import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AlertContainerProps {
  icon: string;
  title: string;
  message: string;
  isDarkTheme?: boolean;
}

export default function AlertContainer({ icon, title, message, isDarkTheme = false }: AlertContainerProps) {
  const iconName = getIoniconName(icon);
  
  return (
    <View style={styles.container}>
      <Ionicons 
        name={iconName} 
        size={48} 
        color="#10B981" 
        style={styles.icon}
      />
      <Text style={[styles.title, { color: isDarkTheme ? '#f9fafb' : '#111827' }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: isDarkTheme ? '#9ca3af' : '#6b7280' }]}>
        {message}
      </Text>
    </View>
  );
}

// Helper function to map FontAwesome classes to Ionicons
function getIoniconName(fontAwesomeIcon: string): any {
  const iconMap: { [key: string]: string } = {
    'fa-exclamation-triangle': 'warning-outline',
    'fa-gear': 'settings-outline',
    'fa-spin': 'settings-outline', // For spinning gear, we'll handle animation separately if needed
    'fa-gear fa-spin': 'settings-outline',
    'fa-chart-bar': 'bar-chart-outline',
    'fa-download': 'download-outline',
    'fa-files': 'documents-outline',
  };

  return iconMap[fontAwesomeIcon] || 'alert-circle-outline';
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    opacity: 0.6,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
