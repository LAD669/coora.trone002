import { 
  createNotification, 
  getUserNotifications, 
  getUserNotificationsWithDetails,
  getUnreadUserNotifications,
  markNotificationAsRead,
  markAllUserNotificationsAsRead,
  deleteNotification,
  deleteAllUserNotifications,
  getUserNotificationStats
} from '@/lib/databaseNotifications';

/**
 * Beispiele für die Verwendung der Notification-Funktionalität
 */

// 1. Neue Notification erstellen
export async function exampleCreateNotification() {
  try {
    const notification = await createNotification({
      user_id: 'user-uuid-here',
      title: 'Neue Nachricht',
      body: 'Du hast eine neue Nachricht von deinem Team erhalten.'
    });
    
    console.log('✅ Notification erstellt:', notification.id);
    return notification;
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Notification:', error);
  }
}

// 2. Alle Notifications eines Users laden
export async function exampleGetUserNotifications(userId: string) {
  try {
    const notifications = await getUserNotifications(userId, 50);
    console.log(`📊 ${notifications.length} Notifications geladen`);
    return notifications;
  } catch (error) {
    console.error('❌ Fehler beim Laden der Notifications:', error);
  }
}

// 3. Notifications mit User-Details laden
export async function exampleGetUserNotificationsWithDetails(userId: string) {
  try {
    const notifications = await getUserNotificationsWithDetails(userId, 50);
    console.log(`📊 ${notifications.length} Notifications mit Details geladen`);
    
    // Beispiel für die Verwendung der User-Details
    notifications.forEach(notification => {
      console.log(`📝 ${notification.title} - von ${notification.user_name} (${notification.email})`);
    });
    
    return notifications;
  } catch (error) {
    console.error('❌ Fehler beim Laden der Notifications mit Details:', error);
  }
}

// 4. Ungelesene Notifications laden
export async function exampleGetUnreadNotifications(userId: string) {
  try {
    const unreadNotifications = await getUnreadUserNotifications(userId);
    console.log(`📊 ${unreadNotifications.length} ungelesene Notifications gefunden`);
    return unreadNotifications;
  } catch (error) {
    console.error('❌ Fehler beim Laden der ungelesenen Notifications:', error);
  }
}

// 5. Notification als gelesen markieren
export async function exampleMarkNotificationAsRead(notificationId: string) {
  try {
    const updatedNotification = await markNotificationAsRead(notificationId);
    console.log('✅ Notification als gelesen markiert:', updatedNotification.id);
    return updatedNotification;
  } catch (error) {
    console.error('❌ Fehler beim Markieren der Notification als gelesen:', error);
  }
}

// 6. Alle Notifications eines Users als gelesen markieren
export async function exampleMarkAllNotificationsAsRead(userId: string) {
  try {
    const updatedCount = await markAllUserNotificationsAsRead(userId);
    console.log(`✅ ${updatedCount} Notifications als gelesen markiert`);
    return updatedCount;
  } catch (error) {
    console.error('❌ Fehler beim Markieren aller Notifications als gelesen:', error);
  }
}

// 7. Einzelne Notification löschen
export async function exampleDeleteNotification(notificationId: string) {
  try {
    const success = await deleteNotification(notificationId);
    if (success) {
      console.log('✅ Notification erfolgreich gelöscht');
    }
    return success;
  } catch (error) {
    console.error('❌ Fehler beim Löschen der Notification:', error);
  }
}

// 8. Alle Notifications eines Users löschen
export async function exampleDeleteAllUserNotifications(userId: string) {
  try {
    const deletedCount = await deleteAllUserNotifications(userId);
    console.log(`✅ ${deletedCount} Notifications erfolgreich gelöscht`);
    return deletedCount;
  } catch (error) {
    console.error('❌ Fehler beim Löschen aller Notifications:', error);
  }
}

// 9. Notification-Statistiken laden
export async function exampleGetNotificationStats(userId: string) {
  try {
    const stats = await getUserNotificationStats(userId);
    console.log('📊 Notification-Statistiken:', {
      total: stats.totalNotifications,
      unread: stats.unreadNotifications,
      read: stats.readNotifications,
      latest: stats.latestNotification
    });
    return stats;
  } catch (error) {
    console.error('❌ Fehler beim Laden der Notification-Statistiken:', error);
  }
}

// 10. Komplettes Notification-Management für einen User
export async function exampleCompleteNotificationManagement(userId: string) {
  try {
    console.log('🔄 Starte komplettes Notification-Management...');
    
    // Statistiken laden
    const stats = await getUserNotificationStats(userId);
    console.log(`📊 Aktuelle Statistiken: ${stats.totalNotifications} total, ${stats.unreadNotifications} ungelesen`);
    
    // Ungelesene Notifications laden
    const unreadNotifications = await getUnreadUserNotifications(userId);
    console.log(`📝 ${unreadNotifications.length} ungelesene Notifications gefunden`);
    
    // Alle als gelesen markieren
    if (unreadNotifications.length > 0) {
      const updatedCount = await markAllUserNotificationsAsRead(userId);
      console.log(`✅ ${updatedCount} Notifications als gelesen markiert`);
    }
    
    // Aktualisierte Statistiken
    const updatedStats = await getUserNotificationStats(userId);
    console.log(`📊 Aktualisierte Statistiken: ${updatedStats.totalNotifications} total, ${updatedStats.unreadNotifications} ungelesen`);
    
    return {
      originalStats: stats,
      updatedStats: updatedStats,
      unreadCount: unreadNotifications.length
    };
  } catch (error) {
    console.error('❌ Fehler beim Notification-Management:', error);
  }
}

// 11. Batch-Operationen für mehrere Users
export async function exampleBatchNotificationsForUsers(userIds: string[], title: string, body: string) {
  try {
    console.log(`🔄 Erstelle Batch-Notifications für ${userIds.length} Users...`);
    
    const createdNotifications = [];
    
    for (const userId of userIds) {
      try {
        const notification = await createNotification({
          user_id: userId,
          title: title,
          body: body
        });
        createdNotifications.push(notification);
        console.log(`✅ Notification für User ${userId} erstellt`);
      } catch (error) {
        console.error(`❌ Fehler beim Erstellen der Notification für User ${userId}:`, error);
      }
    }
    
    console.log(`📊 ${createdNotifications.length} von ${userIds.length} Notifications erfolgreich erstellt`);
    return createdNotifications;
  } catch (error) {
    console.error('❌ Fehler bei Batch-Operation:', error);
  }
}

// 12. Notification mit automatischem Cleanup nach Ablauf
export async function exampleCreateNotificationWithCleanup(
  userId: string, 
  title: string, 
  body: string,
  expiresAfterHours: number = 24
) {
  try {
    // Notification erstellen
    const notification = await createNotification({
      user_id: userId,
      title: title,
      body: body
    });
    
    console.log(`✅ Notification erstellt (läuft in ${expiresAfterHours} Stunden ab):`, notification.id);
    
    // Cleanup nach Ablauf planen (in einer echten App würde man einen Cron-Job oder Timer verwenden)
    setTimeout(async () => {
      try {
        await deleteNotification(notification.id);
        console.log(`🗑️ Notification ${notification.id} nach ${expiresAfterHours} Stunden gelöscht`);
      } catch (error) {
        console.error(`❌ Fehler beim automatischen Löschen der Notification ${notification.id}:`, error);
      }
    }, expiresAfterHours * 60 * 60 * 1000);
    
    return notification;
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Notification mit Cleanup:', error);
  }
}
