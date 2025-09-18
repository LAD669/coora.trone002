import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/contexts/AuthProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppInitializer from '@/components/AppInitializer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function RootLayoutContent() {
  const { session, isManager, sessionLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if session is loaded and we have a valid session
    if (!sessionLoaded || session === null || !session?.user) return;
    
    const group = segments[0]; // "(manager)" | "(app)" | ...
    
    if (isManager && group !== "(manager)") {
      console.log('Manager user detected, redirecting to manager tabs');
      router.replace("/(manager)/(tabs)/dashboard");
    } else if (!isManager && group === "(manager)") {
      console.log('Non-manager user in manager section, redirecting to app tabs');
      router.replace("/(app)/(tabs)/dashboard");
    }
  }, [sessionLoaded, session, isManager, segments]);

  // Don't render until session is loaded to prevent flicker
  if (!sessionLoaded) {
    return null;
  }

  return <Slot />;
}

export default function RootLayout() {
  const { isAppReady } = useFrameworkReady();

  console.log('RootLayout: isAppReady =', isAppReady);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SafeAreaProvider>
            <LanguageProvider>
              <AppInitializer>
                <RootLayoutContent />
                <StatusBar style="auto" />
              </AppInitializer>
            </LanguageProvider>
          </SafeAreaProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
