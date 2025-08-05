import { Slot } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppInitializer from '@/components/AppInitializer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  const { isAppReady } = useFrameworkReady();

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <LanguageProvider>
          <AuthProvider isAppReady={isAppReady}>
            <AppInitializer>
              <Slot />
              <StatusBar style="auto" />
            </AppInitializer>
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
