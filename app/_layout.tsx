import 'react-native-screens';
import 'react-native-gesture-handler';
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
import { useRouter } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { usePermissions } from '@/hooks/usePermissions';
import { Slot } from 'expo-router';
import { 
  initializeNotifications,
  addNotificationReceivedListener, 
  addNotificationResponseReceivedListener,
  cleanupNotifications
} from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
  const { safePush, safeReplace, safeBack } = useNavigationGuard(true);
  const [appIsReady, setAppIsReady] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [layoutMounted, setLayoutMounted] = useState(false);
  const router = useRouter();

  // Set layout as mounted after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setLayoutMounted(true);
      console.log('Layout mounted');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Session check on mount
  useEffect(() => {
    const checkSession = async () => {
      console.log('Checking session on mount...');
      try {
        const { data: { session: sessionData }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
        }
        
        setSession(sessionData);
        setSessionChecked(true);
        
        if (!sessionData) {
          console.log('No session found, will redirect to login after layout is mounted');
        } else {
          console.log('Session found, proceeding with app initialization');
        }
      } catch (error) {
        console.error('Error during session check:', error);
        setSessionChecked(true);
      }
    };

    checkSession();
  }, []);

  // Redirect to login if no session and layout is mounted
  useEffect(() => {
    if (sessionChecked && layoutMounted && !session) {
      console.log('No session found and layout is mounted, redirecting to login');
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 0);
    }
  }, [sessionChecked, layoutMounted, session, router]);

  // Simplified initialization with safe try/catch/finally
  useEffect(() => {
    const initializeApp = async () => {
      console.log('Starting app initialization...');
      
      try {
        // Wait for fonts to load
        console.log('Waiting for fonts to load...');
        if (!fontsLoaded && !fontError) {
          // Wait for fonts to complete loading
          await new Promise<void>((resolve) => {
            const checkFonts = () => {
              if (fontsLoaded || fontError) {
                resolve();
              } else {
                setTimeout(checkFonts, 50);
              }
            };
            checkFonts();
          });
        }
        console.log('Fonts loaded:', fontsLoaded, 'Font error:', fontError);

        // Additional async tasks can be added here
        console.log('All initialization tasks completed successfully');
        
      } catch (error) {
        console.error('Error during app initialization:', error);
        // Continue with app execution even if initialization fails
      } finally {
        console.log('Hiding splash screen...');
        try {
          await SplashScreen.hideAsync();
          console.log('Splash screen hidden successfully');
        } catch (error) {
          console.error('Error hiding splash screen:', error);
        }
        
        console.log('Setting app as ready...');
        setAppIsReady(true);
        console.log('App initialization complete');
      }
    };

    initializeApp();
  }, [fontsLoaded, fontError]);

  // Safety guard: Prevent any navigation before app is ready
  useEffect(() => {
    if (!appIsReady) {
      console.log('App not ready, blocking navigation attempts');
    } else {
      console.log('App ready, navigation enabled');
    }
  }, [appIsReady]);

  // Don't render Slot until session is checked and app is ready
  if (!sessionChecked || !appIsReady) {
    return null;
  }

  // Render the app wrapped in SafeAreaProvider and AuthProvider
  return (
    <SafeAreaProvider>
      <AuthProvider isAppReady={appIsReady}>
        <Slot />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
