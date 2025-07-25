import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Urbanist_400Regular,
  Urbanist_500Medium,
  Urbanist_600SemiBold,
  Urbanist_700Bold,
} from '@expo-google-fonts/urbanist';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Redirect, useRouter, useNavigationContainerRef } from 'expo-router';

function RootLayoutNav() {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const router = useRouter();
  const navigationRef = useNavigationContainerRef();

  // Wait for navigation to be ready before redirecting
  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated && navigationRef.isReady()) {
      // Use setTimeout to ensure navigation happens after render
      setTimeout(() => {
        router.replace('/auth/login');
      }, 0);
    }
  }, [isInitialized, isLoading, isAuthenticated, navigationRef.isReady()]);
  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false,
          gestureEnabled: isAuthenticated 
        }} 
      />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="live-ticker" />
      <Stack.Screen 
        name="auth" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
          animationTypeForReplace: 'pop'
        }} 
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Urbanist-Regular': Urbanist_400Regular,
    'Urbanist-Medium': Urbanist_500Medium,
    'Urbanist-SemiBold': Urbanist_600SemiBold,
    'Urbanist-Bold': Urbanist_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <RootLayoutNav />
<StatusBar style="auto" />
      </AuthProvider>
    </LanguageProvider>
  );
}
