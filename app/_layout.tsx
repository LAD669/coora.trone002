import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { usePermissions } from '@/hooks/usePermissions';
import { NavigationContainer } from '@react-navigation/native';
import { Slot } from 'expo-router';
import { 
  initializeNotifications,
  addNotificationReceivedListener, 
  addNotificationResponseReceivedListener,
  cleanupNotifications
} from '@/lib/notifications';

function RootLayoutNav() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const { checkNotificationPermissions } = usePermissions();
  const [notificationsInitialized, setNotificationsInitialized] = useState(false);

  // Safe notifications initialization
  useEffect(() => {
    const initNotifications = async () => {
      try {
        console.log('Starting safe notifications initialization...');
        
        // Initialize notifications safely
        const success = await initializeNotifications();
        if (success) {
          setNotificationsInitialized(true);
          console.log('Notifications initialized successfully');
          
          // Check permissions and set up listeners only if granted
          const hasPermissions = await checkNotificationPermissions();
          if (hasPermissions) {
            console.log('Setting up notification listeners...');
            
            // Set up notification listeners only if permissions are granted
            notificationListener.current = addNotificationReceivedListener(notification => {
              console.log('Notification received:', notification);
            });

            responseListener.current = addNotificationResponseReceivedListener(response => {
              console.log('Notification response:', response);
              const data = response.notification.request.content.data;
              if (data?.screen) {
                // Use safe navigation for notification responses
                router.push(data.screen as any);
              }
            });
          } else {
            console.log('Notification permissions not granted, listeners not set up');
          }
        } else {
          console.log('Notifications initialization failed, continuing without notifications');
        }
      } catch (error) {
        console.error('Error during notifications initialization:', error);
        // Continue app execution even if notifications fail
      }
    };

    initNotifications();

    // Cleanup on unmount
    return () => {
      try {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
        cleanupNotifications();
      } catch (error) {
        console.error('Error cleaning up notifications:', error);
      }
    };
  }, [checkNotificationPermissions, router]);

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
  const { isAppReady, isNavigationMounted, navigationRef } = useFrameworkReady();
  const { safePush, safeReplace, safeBack } = useNavigationGuard(isAppReady);

  // Safety guard: Prevent any navigation before app is ready
  useEffect(() => {
    if (!isAppReady) {
      console.log('App not ready, blocking navigation attempts');
    } else {
      console.log('App ready, navigation enabled');
    }
  }, [isAppReady]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Render immediately without waiting for fonts or navigation
  return (
    <LanguageProvider>
      <AuthProvider isAppReady={isAppReady}>
        <NavigationContainer 
          ref={navigationRef}
          onReady={() => {
            console.log('NavigationContainer onReady called');
          }}
          onStateChange={(state) => {
            console.log('Navigation state changed:', state?.routes?.length || 0, 'routes');
          }}
        >
          <Slot />
        </NavigationContainer>
        <StatusBar style="auto" />
      </AuthProvider>
    </LanguageProvider>
  );
}
