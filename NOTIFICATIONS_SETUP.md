# Push Notifications Setup

This app has been configured with `expo-notifications` to handle push notifications.

## Setup Completed

### 1. Dependencies
- `expo-notifications` is already installed in the project

### 2. Configuration Files

#### `lib/notifications.ts`
Contains all notification helper functions:
- `registerForPushNotificationsAsync()` - Registers device for push tokens
- `sendPushNotification()` - Sends push notifications via Expo's push service
- `addNotificationReceivedListener()` - Listens for incoming notifications
- `addNotificationResponseReceivedListener()` - Listens for notification taps
- `getBadgeCountAsync()` / `setBadgeCountAsync()` - Manages badge counts

#### `app/_layout.tsx`
Updated to:
- Register for push notifications on app start
- Set up notification listeners
- Handle notification taps to navigate to specific screens
- Clean up listeners on unmount

#### `app.json`
Updated with notification plugin configuration:
- Notification icon
- Sound settings
- Platform-specific configurations

## How to Use

### 1. Getting Push Tokens
The app automatically registers for push notifications when it starts. The token is logged to the console:

```javascript
// Token is automatically logged when app starts
console.log('Push token registered:', token);
```

### 2. Sending Notifications
Use the `sendPushNotification` function:

```javascript
import { sendPushNotification } from '@/lib/notifications';

// Send a notification
await sendPushNotification(
  'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]', // Push token
  'Match Reminder', // Title
  'Your match starts in 30 minutes!', // Body
  { screen: '/(tabs)/calendar' } // Optional data
);
```

### 3. Handling Notification Taps
The app automatically handles notification taps and can navigate to specific screens based on the notification data:

```javascript
// When a notification is tapped, it can navigate to a screen
const data = response.notification.request.content.data;
if (data?.screen) {
  router.push(data.screen);
}
```

### 4. Listening for Notifications
The app listens for notifications in the foreground:

```javascript
// Notification received while app is open
notificationListener.current = addNotificationReceivedListener(notification => {
  console.log('Notification received:', notification);
  // Handle the notification here
});
```

## Testing

### 1. Physical Device Required
Push notifications only work on physical devices, not simulators.

### 2. Expo Push Tokens
To send test notifications, you'll need the Expo push token that's logged to the console when the app starts.

### 3. Sending Test Notifications
You can use Expo's push notification tool or send via the `sendPushNotification` function.

## Backend Integration

To integrate with your backend:

1. Store the push token when it's received
2. Send the token to your backend API
3. Use your backend to send notifications via Expo's push service

Example backend integration:

```javascript
// In your app, send token to backend
const token = await registerForPushNotificationsAsync();
if (token) {
  await fetch('/api/register-push-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, userId: user.id })
  });
}
```

## Permissions

The app automatically requests notification permissions when it starts. Users can:
- Grant permissions (notifications will work)
- Deny permissions (notifications won't work, but app continues)

## Platform Differences

- **iOS**: Requires explicit permission request
- **Android**: Automatically creates notification channel
- **Web**: Limited support, primarily for service workers

## Troubleshooting

1. **No token received**: Check if running on physical device
2. **Permissions denied**: User needs to enable notifications in device settings
3. **Notifications not showing**: Check notification settings in device
4. **Badge count issues**: Ensure badge permissions are granted

## Next Steps

1. Integrate with your backend to store push tokens
2. Set up server-side notification sending
3. Implement notification preferences in user settings
4. Add notification history screen
5. Implement notification categories (matches, team updates, etc.) 