import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

interface BottomNavigationProps {
  isDarkTheme?: boolean;
}

export default function BottomNavigation({ isDarkTheme: propIsDarkTheme }: BottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isDarkTheme, colors } = useTheme();
  
  // Use the theme context, but allow prop override for compatibility
  const currentIsDarkTheme = propIsDarkTheme !== undefined ? propIsDarkTheme : isDarkTheme;

  const navItems = [
    { 
      route: '/home', 
      icon: 'grid-outline' as const,
      activeIcon: 'grid' as const
    },
    { 
      route: '/forms/list', 
      icon: 'bar-chart-outline' as const,
      activeIcon: 'bar-chart' as const
    },
    { 
      route: '/forms/download', 
      icon: 'download-outline' as const,
      activeIcon: 'download' as const
    },
    { 
      route: '/settings', 
      icon: 'settings-outline' as const,
      activeIcon: 'settings' as const
    },
  ];

  const handleNavigation = (route: string) => {
    router.push(route as any);
  };

  const isActive = (route: string) => {
    return pathname === route;
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.background,
        borderTopColor: colors.border,
        paddingBottom: insets.bottom 
      }
    ]}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.route}
          style={styles.navItem}
          onPress={() => handleNavigation(item.route)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isActive(item.route) ? item.activeIcon : item.icon}
            size={24}
            color={isActive(item.route) ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  navItem: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
});
