import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { AuthProvider, useAuth } from '@/contexts/AuthProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppInitializer from '@/components/AppInitializer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useDeepLinking } from '@/lib/deepLinking';
import * as Linking from 'expo-linking';
import { queryClient } from '@/lib/queryClient';

function RootLayoutContent() {
  const { session, isManager, sessionLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const nav = useRootNavigationState();
  const { handleDeepLink } = useDeepLinking();

  useEffect(() => {
    // Wait until router is ready before performing redirects
    if (!sessionLoaded || !nav?.key) return;
    
    // Handle logout: redirect to app group when session becomes null
    if (session === null) {
      const group = segments[0];
      if (group === "(manager)") {
        console.log('User logged out, redirecting from manager to app group');
        router.replace("/(app)/(tabs)/dashboard");
      }
      return;
    }
    
    // Only redirect if we have a valid session
    if (session === null || !session?.user) return;
    
    const group = segments[0]; // "(manager)" | "(app)" | ...
    
    if (isManager && group !== "(manager)") {
      console.log('Manager user detected, redirecting to manager tabs');
      router.replace("/(manager)/(tabs)/dashboard");
    } else if (!isManager && group === "(manager)") {
      console.log('Non-manager user in manager section, redirecting to app tabs');
      router.replace("/(app)/(tabs)/dashboard");
    }
  }, [sessionLoaded, session, isManager, segments, nav?.key]);

  // Handle deep linking
  useEffect(() => {
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await handleDeepLink(initialUrl);
      }
    };

    const handleURL = (event: { url: string }) => {
      handleDeepLink(event.url);
    };

    // Handle initial URL
    handleInitialURL();

    // Listen for incoming URLs
    const subscription = Linking.addEventListener('url', handleURL);

    return () => {
      subscription?.remove();
    };
  }, [handleDeepLink]);

  // Don't render until session is loaded and router is ready to prevent flicker
  if (!sessionLoaded || !nav?.key) {
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
