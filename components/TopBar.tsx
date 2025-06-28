import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface TopBarProps {
  title: string;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
}

export default function TopBar({ 
  title, 
  leftComponent,
  rightComponent 
}: TopBarProps) {
  const { isDarkTheme, toggleTheme, colors } = useTheme();

  return (
    <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
      <View style={styles.leftSection}>
        {leftComponent}
      </View>
      
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        {title}
      </Text>
      
      <View style={styles.rightSection}>
        {rightComponent}
        <TouchableOpacity 
          style={[styles.themeButton, { backgroundColor: colors.surface }]} 
          onPress={toggleTheme}
        >
          <Ionicons 
            name={isDarkTheme ? "sunny" : "moon"} 
            size={20} 
            color={colors.text} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  leftSection: {
    minWidth: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    justifyContent: 'flex-end',
  },
  themeButton: {
    padding: 8,
    borderRadius: 8,
  },
});
