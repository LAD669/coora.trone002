import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }
  
  // Get the token that uniquely identifies this device
  token = (await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PROJECT_ID, // You'll need to set this in your app.json
  })).data;
  
  console.log('Push token:', token);

  return token;
}

export async function sendPushNotification(expoPushToken: string, title: string, body: string, data?: any) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data || {},
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

export function addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseReceivedListener(callback: (response: Notifications.NotificationResponse) => void) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

export async function getBadgeCountAsync(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

export async function setBadgeCountAsync(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

// Function to cancel all scheduled notifications
export async function cancelAllScheduledNotificationsAsync() {
  await Notifications.cancelAllScheduledNotificationsAsync();
} 