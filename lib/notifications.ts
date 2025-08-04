import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Safe notification handler configuration with error handling
let notificationHandlerConfigured = false;

export function configureNotificationHandler() {
  try {
    if (notificationHandlerConfigured) {
      console.log('Notification handler already configured');
      return;
    }

    // Configure how notifications are handled when the app is in the foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    notificationHandlerConfigured = true;
    console.log('Notification handler configured successfully');
  } catch (error) {
    console.error('Error configuring notification handler:', error);
    // Don't throw - allow app to continue without notifications
  }
}

// Validate expo-notifications configuration
export function validateNotificationsConfig(): boolean {
  try {
    // Check if Notifications is available
    if (!Notifications) {
      console.error('expo-notifications is not available');
      return false;
    }

    // Check if required methods exist
    const requiredMethods = [
      'setNotificationHandler',
      'getPermissionsAsync',
      'requestPermissionsAsync',
      'getExpoPushTokenAsync',
      'setNotificationChannelAsync',
      'addNotificationReceivedListener',
      'addNotificationResponseReceivedListener',
    ] as const;

    for (const method of requiredMethods) {
      if (typeof (Notifications as any)[method] !== 'function') {
        console.error(`Required method ${method} is not available in expo-notifications`);
        return false;
      }
    }

    console.log('expo-notifications configuration validated successfully');
    return true;
  } catch (error) {
    console.error('Error validating notifications config:', error);
    return false;
  }
}

// Safe notification channel setup for Android
export async function setupNotificationChannel(): Promise<boolean> {
  try {
    if (Platform.OS !== 'android') {
      return true; // Not needed for iOS
    }

    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    console.log('Android notification channel configured successfully');
    return true;
  } catch (error) {
    console.error('Error setting up Android notification channel:', error);
    return false;
  }
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    // Validate configuration first
    if (!validateNotificationsConfig()) {
      console.error('Notifications configuration validation failed');
      return null;
    }

    // Configure notification handler
    configureNotificationHandler();

    // Setup Android notification channel
    const channelSetup = await setupNotificationChannel();
    if (!channelSetup) {
      console.error('Failed to setup notification channel');
      return null;
    }

    // Check permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return null;
    }
    
    // Get the token that uniquely identifies this device
    const projectId = process.env.EXPO_PROJECT_ID;
    if (!projectId) {
      console.error('EXPO_PROJECT_ID is not configured');
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    
    if (!tokenResponse?.data) {
      console.error('Failed to get push token');
      return null;
    }
    
    console.log('Push token registered successfully:', tokenResponse.data);
    return tokenResponse.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

export async function sendPushNotification(
  expoPushToken: string, 
  title: string, 
  body: string, 
  data?: any
): Promise<boolean> {
  try {
    if (!expoPushToken) {
      console.error('Invalid push token provided');
      return false;
    }

    const message = {
      to: expoPushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data || {},
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Push notification send failed:', response.status, response.statusText);
      return false;
    }

    console.log('Push notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription | null {
  try {
    if (typeof callback !== 'function') {
      console.error('Invalid callback provided for notification received listener');
      return null;
    }

    const subscription = Notifications.addNotificationReceivedListener(callback);
    console.log('Notification received listener added successfully');
    return subscription;
  } catch (error) {
    console.error('Error adding notification received listener:', error);
    return null;
  }
}

export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription | null {
  try {
    if (typeof callback !== 'function') {
      console.error('Invalid callback provided for notification response listener');
      return null;
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(callback);
    console.log('Notification response listener added successfully');
    return subscription;
  } catch (error) {
    console.error('Error adding notification response listener:', error);
    return null;
  }
}

export async function getBadgeCountAsync(): Promise<number> {
  try {
    const count = await Notifications.getBadgeCountAsync();
    return count || 0;
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
}

export async function setBadgeCountAsync(count: number): Promise<boolean> {
  try {
    if (typeof count !== 'number' || count < 0) {
      console.error('Invalid badge count provided:', count);
      return false;
    }

    await Notifications.setBadgeCountAsync(count);
    console.log('Badge count set successfully:', count);
    return true;
  } catch (error) {
    console.error('Error setting badge count:', error);
    return false;
  }
}

export async function cancelAllScheduledNotificationsAsync(): Promise<boolean> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All scheduled notifications cancelled successfully');
    return true;
  } catch (error) {
    console.error('Error canceling scheduled notifications:', error);
    return false;
  }
}

export async function checkNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    const isGranted = status === 'granted';
    console.log('Notification permissions status:', status);
    return isGranted;
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    const isGranted = status === 'granted';
    console.log('Notification permissions request result:', status);
    return isGranted;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

// Initialize notifications safely on app startup
export async function initializeNotifications(): Promise<boolean> {
  try {
    console.log('Initializing notifications...');
    
    // Validate configuration
    if (!validateNotificationsConfig()) {
      console.error('Notifications initialization failed: invalid configuration');
      return false;
    }

    // Configure notification handler
    configureNotificationHandler();

    // Setup Android notification channel
    await setupNotificationChannel();

    console.log('Notifications initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return false;
  }
}

// Cleanup notifications
export function cleanupNotifications(): void {
  try {
    // Reset notification handler
    Notifications.setNotificationHandler(null);
    notificationHandlerConfigured = false;
    console.log('Notifications cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
  }
} 