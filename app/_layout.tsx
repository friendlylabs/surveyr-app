import { Stack, usePathname } from "expo-router";
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../components/BottomNavigation';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

function MainLayout() {
  const pathname = usePathname();
  const { isDarkTheme } = useTheme();

  // Pages that should NOT show the bottom navigation
  const pagesWithoutNavigation = ['/', '/auth/login'];
  const shouldShowNavigation = !pagesWithoutNavigation.includes(pathname);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar 
            barStyle={isDarkTheme ? "light-content" : "dark-content"}
            backgroundColor="transparent"
            translucent={true}
          />
          <SafeAreaView style={{ flex: 1, backgroundColor: isDarkTheme ? '#121212' : '#ffffff' }}>
            <Stack 
              screenOptions={{
                headerShown: false,
              }}
            />
            {shouldShowNavigation && <BottomNavigation />}
          </SafeAreaView>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <MainLayout />
    </ThemeProvider>
  );
}
