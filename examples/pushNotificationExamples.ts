import { 
  sendPushNotification, 
  sendPushNotificationToMultiple,
  registerForPushNotificationsAsync 
} from '@/lib/pushNotifications';

/**
 * Beispiele für die Verwendung der Push-Notification-Funktionen
 */

// Beispiel 1: Einzelne Benachrichtigung senden
export async function sendWelcomeNotification(userToken: string, userName: string) {
  try {
    await sendPushNotification(
      userToken,
      'Willkommen bei COORA! 🎉',
      `Hallo ${userName}, wir freuen uns, dass du dabei bist!`
    );
    console.log('✅ Willkommens-Benachrichtigung gesendet');
  } catch (error) {
    console.error('❌ Fehler beim Senden der Willkommens-Benachrichtigung:', error);
  }
}

// Beispiel 2: Team-Update an alle Teammitglieder senden
export async function sendTeamUpdateNotification(teamTokens: string[], updateMessage: string) {
  try {
    await sendPushNotificationToMultiple(
      teamTokens,
      '🏆 Team-Update',
      updateMessage
    );
    console.log('✅ Team-Update an alle Mitglieder gesendet');
  } catch (error) {
    console.error('❌ Fehler beim Senden des Team-Updates:', error);
  }
}

// Beispiel 3: Training-Erinnerung senden
export async function sendTrainingReminder(userToken: string, trainingTime: string, location: string) {
  try {
    await sendPushNotification(
      userToken,
      '⚽ Training-Erinnerung',
      `Training heute um ${trainingTime} in ${location}. Bitte nicht vergessen!`
    );
    console.log('✅ Training-Erinnerung gesendet');
  } catch (error) {
    console.error('❌ Fehler beim Senden der Training-Erinnerung:', error);
  }
}

// Beispiel 4: Match-Ergebnis-Benachrichtigung
export async function sendMatchResultNotification(
  userToken: string, 
  opponent: string, 
  result: string, 
  score: string
) {
  try {
    await sendPushNotification(
      userToken,
      '🏆 Match-Ergebnis',
      `Gegen ${opponent}: ${result} (${score})`
    );
    console.log('✅ Match-Ergebnis-Benachrichtigung gesendet');
  } catch (error) {
    console.error('❌ Fehler beim Senden der Match-Ergebnis-Benachrichtigung:', error);
  }
}

// Beispiel 5: Benachrichtigung an alle Spieler eines Teams
export async function sendTeamAnnouncement(
  teamTokens: string[], 
  announcement: string, 
  priority: 'low' | 'medium' | 'high' = 'medium'
) {
  try {
    const priorityEmoji = {
      low: '📢',
      medium: '🔔',
      high: '🚨'
    };

    await sendPushNotificationToMultiple(
      teamTokens,
      `${priorityEmoji[priority]} Team-Ankündigung`,
      announcement
    );
    
    console.log(`✅ Team-Ankündigung (${priority}) an alle Mitglieder gesendet`);
  } catch (error) {
    console.error('❌ Fehler beim Senden der Team-Ankündigung:', error);
  }
}

// Beispiel 6: Benutzer für Push-Benachrichtigungen registrieren
export async function setupUserForNotifications() {
  try {
    const token = await registerForPushNotificationsAsync();
    
    if (token) {
      console.log('✅ Benutzer erfolgreich für Push-Benachrichtigungen registriert');
      
      // Optional: Sende eine Test-Benachrichtigung
      setTimeout(async () => {
        await sendPushNotification(
          token,
          '🔔 Test-Benachrichtigung',
          'Push-Benachrichtigungen funktionieren!'
        );
      }, 2000);
      
    } else {
      console.log('⚠️ Push-Benachrichtigungen konnten nicht aktiviert werden');
    }
  } catch (error) {
    console.error('❌ Fehler beim Einrichten der Push-Benachrichtigungen:', error);
  }
}

// Beispiel 7: Batch-Benachrichtigungen mit Fehlerbehandlung
export async function sendBatchNotifications(
  notifications: Array<{
    token: string;
    title: string;
    body: string;
  }>
) {
  try {
    console.log(`📤 Sende ${notifications.length} Benachrichtigungen...`);
    
    // Gruppiere nach Token für effizientes Senden
    const tokenGroups = new Map<string, Array<{ title: string; body: string }>>();
    
    notifications.forEach(({ token, title, body }) => {
      if (!tokenGroups.has(token)) {
        tokenGroups.set(token, []);
      }
      tokenGroups.get(token)!.push({ title, body });
    });
    
    // Sende jede Gruppe
    for (const [token, messages] of tokenGroups) {
      for (const message of messages) {
        await sendPushNotification(token, message.title, message.body);
        // Kleine Verzögerung zwischen Benachrichtigungen
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('✅ Alle Batch-Benachrichtigungen gesendet');
  } catch (error) {
    console.error('❌ Fehler beim Senden der Batch-Benachrichtigungen:', error);
  }
}

// Beispiel 8: Benachrichtigung mit benutzerdefinierten Optionen
export async function sendCustomNotification(
  userToken: string,
  title: string,
  body: string,
  options: {
    sound?: string;
    priority?: 'default' | 'normal' | 'high';
    badge?: number;
    data?: Record<string, any>;
  } = {}
) {
  try {
    // Erstelle den Request Body
    const message = {
      to: userToken,
      title,
      body,
      sound: options.sound || 'default',
      priority: options.priority || 'high',
      channelId: 'default',
      ...(options.badge && { badge: options.badge }),
      ...(options.data && { data: options.data })
    };

    // Sende über die Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Benutzerdefinierte Benachrichtigung gesendet:', result);
    
  } catch (error) {
    console.error('❌ Fehler beim Senden der benutzerdefinierten Benachrichtigung:', error);
  }
}
