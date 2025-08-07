import { Slot } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppInitializer from '@/components/AppInitializer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { NavigationContainer } from '@react-navigation/native';

export default function RootLayout() {
  const { isAppReady, navigationRef } = useFrameworkReady();

  console.log('RootLayout: isAppReady =', isAppReady);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppInitializer>
              <NavigationContainer ref={navigationRef}>
                <Slot />
                <StatusBar style="auto" />
              </NavigationContainer>
            </AppInitializer>
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
