import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Urbanist_400Regular,
  Urbanist_500Medium,
  Urbanist_600SemiBold,
  Urbanist_700Bold,
} from '@expo-google-fonts/urbanist';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useRouter, useNavigationContainerRef } from 'expo-router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { 
  registerForPushNotificationsAsync, 
  addNotificationReceivedListener, 
  addNotificationResponseReceivedListener 
} from '@/lib/notifications';

function RootLayoutNav() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const navigationRef = useNavigationContainerRef();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Set up push notifications
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log('Push token registered:', token);
      }
    });

    notificationListener.current = addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      const data = response.notification.request.content.data;
      if (data?.screen) {
        router.push(data.screen as any);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!isAuthenticated && navigationRef.isReady()) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, navigationRef.isReady()]);

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
      <Stack.Screen name="EditProfileScreen" />
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

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
