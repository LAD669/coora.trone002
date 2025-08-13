import { supabase } from './supabaseClient';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Registriert das Gerät für Push-Benachrichtigungen
 * @returns Promise<string | undefined> - Der Expo Push Token oder undefined bei Fehler
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  try {
    console.log('🔔 Registriere für Push-Benachrichtigungen...');

    // Prüfe ob es ein physisches Gerät ist (nicht Simulator)
    if (!Device.isDevice) {
      console.log('⚠️ Push-Benachrichtigungen funktionieren nur auf physischen Geräten');
      return undefined;
    }

    // Prüfe aktuelle Berechtigungen
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('📱 Aktuelle Push-Berechtigung:', existingStatus);

    let finalStatus = existingStatus;

    // Falls noch nicht erlaubt: erneut fragen
    if (existingStatus !== 'granted') {
      console.log('🔐 Frage Push-Berechtigung an...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('📱 Neue Push-Berechtigung:', finalStatus);
    }

    // Bei Erfolg den Expo Push Token generieren
    if (finalStatus === 'granted') {
      console.log('✅ Push-Berechtigung erteilt, generiere Token...');
      
      // Token generieren
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '7d523146-86fe-4d7c-8d60-7d3fc4c8dde4',
      });

      console.log('🎯 Expo Push Token generiert:', token.data);
      
      // Token zurückgeben
      return token.data;
    } else {
      console.log('❌ Push-Berechtigung verweigert');
      return undefined;
    }

  } catch (error) {
    console.error('❌ Fehler bei der Push-Benachrichtigungsregistrierung:', error);
    return undefined;
  }
}

/**
 * Initialisiert Push-Benachrichtigungen beim App-Start
 * Ruft intern registerForPushNotificationsAsync() auf
 * @returns Promise<string | undefined> - Der Expo Push Token oder undefined bei Fehler
 */
export async function initializeNotifications(): Promise<string | undefined> {
  try {
    console.log('🚀 Initialisiere Push-Benachrichtigungen...');
    
    // Rufe die Registrierungsfunktion auf
    const token = await registerForPushNotificationsAsync();
    
    if (token) {
      console.log('✅ Push-Benachrichtigungen erfolgreich initialisiert');
    } else {
      console.log('⚠️ Push-Benachrichtigungen konnten nicht initialisiert werden');
    }
    
    return token;
    
  } catch (error) {
    console.error('❌ Fehler bei der Initialisierung der Push-Benachrichtigungen:', error);
    return undefined;
  }
}

/**
 * Notification-Interface für TypeScript
 */
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Notification mit User-Details
 */
export interface NotificationWithUserDetails extends Notification {
  user_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

/**
 * Notification-Input für die Erstellung
 */
export interface NotificationInput {
  user_id: string;
  title: string;
  body: string;
}

/**
 * Erstellt eine neue Notification
 * @param notificationData - Die Notification-Daten
 * @returns Die erstellte Notification
 */
export async function createNotification(notificationData: NotificationInput): Promise<Notification> {
  try {
    console.log('🔔 Erstelle neue Notification:', {
      user_id: notificationData.user_id,
      title: notificationData.title,
      body: notificationData.body
    });

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notificationData.user_id,
        title: notificationData.title,
        body: notificationData.body,
        // read wird automatisch auf false gesetzt
        // created_at wird automatisch gesetzt
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Fehler beim Erstellen der Notification:', error);
      throw error;
    }

    if (!notification) {
      throw new Error('Notification konnte nicht erstellt werden');
    }

    console.log('✅ Notification erfolgreich erstellt:', notification.id);
    return notification;

  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Notification:', error);
    throw error;
  }
}

/**
 * Lädt alle Notifications für einen User
 * @param userId - Die User-ID
 * @param limit - Maximale Anzahl der Notifications (Standard: 100)
 * @returns Array der Notifications
 */
export async function getUserNotifications(userId: string, limit: number = 100): Promise<Notification[]> {
  try {
    console.log('📊 Lade Notifications für User:', userId);

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Fehler beim Laden der Notifications:', error);
      throw error;
    }

    console.log(`✅ ${notifications?.length || 0} Notifications für User geladen`);
    return notifications || [];

  } catch (error) {
    console.error('❌ Fehler beim Laden der Notifications:', error);
    throw error;
  }
}

/**
 * Lädt alle Notifications für einen User mit User-Details
 * @param userId - Die User-ID
 * @param limit - Maximale Anzahl der Notifications (Standard: 100)
 * @returns Array der Notifications mit User-Details
 */
export async function getUserNotificationsWithDetails(userId: string, limit: number = 100): Promise<NotificationWithUserDetails[]> {
  try {
    console.log('📊 Lade Notifications mit Details für User:', userId);

    const { data: notifications, error } = await supabase
      .from('notifications_with_user_details')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Fehler beim Laden der Notifications mit Details:', error);
      throw error;
    }

    console.log(`✅ ${notifications?.length || 0} Notifications mit Details für User geladen`);
    return notifications || [];

  } catch (error) {
    console.error('❌ Fehler beim Laden der Notifications mit Details:', error);
    throw error;
  }
}

/**
 * Lädt ungelesene Notifications für einen User
 * @param userId - Die User-ID
 * @param limit - Maximale Anzahl der Notifications (Standard: 100)
 * @returns Array der ungelesenen Notifications
 */
export async function getUnreadUserNotifications(userId: string, limit: number = 100): Promise<Notification[]> {
  try {
    console.log('📊 Lade ungelesene Notifications für User:', userId);

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Fehler beim Laden der ungelesenen Notifications:', error);
      throw error;
    }

    console.log(`✅ ${notifications?.length || 0} ungelesene Notifications für User geladen`);
    return notifications || [];

  } catch (error) {
    console.error('❌ Fehler beim Laden der ungelesenen Notifications:', error);
    throw error;
  }
}

/**
 * Markiert eine Notification als gelesen
 * @param notificationId - Die Notification-ID
 * @returns Die aktualisierte Notification
 */
export async function markNotificationAsRead(notificationId: string): Promise<Notification> {
  try {
    console.log('✅ Markiere Notification als gelesen:', notificationId);

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({
        read: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      console.error('❌ Fehler beim Markieren der Notification als gelesen:', error);
      throw error;
    }

    if (!notification) {
      throw new Error('Notification konnte nicht aktualisiert werden');
    }

    console.log('✅ Notification erfolgreich als gelesen markiert:', notificationId);
    return notification;

  } catch (error) {
    console.error('❌ Fehler beim Markieren der Notification als gelesen:', error);
    throw error;
  }
}

/**
 * Markiert alle Notifications eines Users als gelesen
 * @param userId - Die User-ID
 * @returns Anzahl der aktualisierten Notifications
 */
export async function markAllUserNotificationsAsRead(userId: string): Promise<number> {
  try {
    console.log('✅ Markiere alle Notifications als gelesen für User:', userId);

    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('read', false);

    if (fetchError) {
      console.error('❌ Fehler beim Laden der ungelesenen Notifications:', fetchError);
      throw fetchError;
    }

    if (!notifications || notifications.length === 0) {
      console.log('ℹ️ Keine ungelesenen Notifications gefunden');
      return 0;
    }

    const { error: updateError } = await supabase
      .from('notifications')
      .update({
        read: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('read', false);

    if (updateError) {
      console.error('❌ Fehler beim Markieren der Notifications als gelesen:', updateError);
      throw updateError;
    }

    console.log(`✅ ${notifications.length} Notifications erfolgreich als gelesen markiert`);
    return notifications.length;

  } catch (error) {
    console.error('❌ Fehler beim Markieren der Notifications als gelesen:', error);
    throw error;
  }
}

/**
 * Löscht eine Notification
 * @param notificationId - Die Notification-ID
 * @returns true wenn erfolgreich gelöscht
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    console.log('🗑️ Lösche Notification:', notificationId);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('❌ Fehler beim Löschen der Notification:', error);
      throw error;
    }

    console.log('✅ Notification erfolgreich gelöscht:', notificationId);
    return true;

  } catch (error) {
    console.error('❌ Fehler beim Löschen der Notification:', error);
    throw error;
  }
}

/**
 * Löscht alle Notifications eines Users
 * @param userId - Die User-ID
 * @returns Anzahl der gelöschten Notifications
 */
export async function deleteAllUserNotifications(userId: string): Promise<number> {
  try {
    console.log('🗑️ Lösche alle Notifications für User:', userId);

    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('❌ Fehler beim Laden der Notifications:', fetchError);
      throw fetchError;
    }

    if (!notifications || notifications.length === 0) {
      console.log('ℹ️ Keine Notifications zum Löschen gefunden');
      return 0;
    }

    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('❌ Fehler beim Löschen der Notifications:', deleteError);
      throw deleteError;
    }

    console.log(`✅ ${notifications.length} Notifications erfolgreich gelöscht`);
    return notifications.length;

  } catch (error) {
    console.error('❌ Fehler beim Löschen der Notifications:', error);
    throw error;
  }
}

/**
 * Lädt Notification-Statistiken für einen User
 * @param userId - Die User-ID
 * @returns Notification-Statistiken
 */
export async function getUserNotificationStats(userId: string): Promise<{
  totalNotifications: number;
  unreadNotifications: number;
  readNotifications: number;
  latestNotification?: string;
}> {
  try {
    console.log('📊 Lade Notification-Statistiken für User:', userId);

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Fehler beim Laden der Notification-Statistiken:', error);
      throw error;
    }

    if (!notifications || notifications.length === 0) {
      return {
        totalNotifications: 0,
        unreadNotifications: 0,
        readNotifications: 0
      };
    }

    const stats = {
      totalNotifications: notifications.length,
      unreadNotifications: notifications.filter(n => !n.read).length,
      readNotifications: notifications.filter(n => n.read).length,
      latestNotification: notifications[0]?.created_at
    };

    console.log('✅ Notification-Statistiken erfolgreich geladen:', stats);
    return stats;

  } catch (error) {
    console.error('❌ Fehler beim Laden der Notification-Statistiken:', error);
    throw error;
  }
} 