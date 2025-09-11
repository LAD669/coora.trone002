import { supabase } from './supabaseClient';

/**
 * Team Notification-Interface für TypeScript (neue Struktur)
 */
export interface TeamNotification {
  id: string;
  notification_type: 'post_match' | 'event_reminder' | 'general';
  title: string;
  message: string;
  event_id: string | null;
  team_id: string;
  scheduled_for: string;
  sent: boolean;
  read_by: any[]; // JSON array of user IDs
  created_at: string;
}

/**
 * Team Notification-Input für die Erstellung
 */
export interface TeamNotificationInput {
  notification_type: 'post_match' | 'event_reminder' | 'general';
  title: string;
  message: string;
  event_id?: string | null;
  team_id: string;
  scheduled_for: string;
}

/**
 * Erstellt eine neue Team Notification
 * @param notificationData - Die Notification-Daten
 * @returns Die erstellte Notification
 */
export async function createTeamNotification(notificationData: TeamNotificationInput): Promise<TeamNotification> {
  try {
    console.log('🔔 Erstelle neue Team Notification:', {
      notification_type: notificationData.notification_type,
      title: notificationData.title,
      team_id: notificationData.team_id
    });

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        notification_type: notificationData.notification_type,
        title: notificationData.title,
        message: notificationData.message,
        event_id: notificationData.event_id || null,
        team_id: notificationData.team_id,
        scheduled_for: notificationData.scheduled_for,
        sent: false,
        read_by: []
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Fehler beim Erstellen der Team Notification:', error);
      throw error;
    }

    console.log('✅ Team Notification erfolgreich erstellt:', notification.id);
    return notification;

  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Team Notification:', error);
    throw error;
  }
}

/**
 * Lädt alle Notifications für ein Team
 * @param teamId - Die Team-ID
 * @param limit - Maximale Anzahl der Notifications (Standard: 100)
 * @returns Array der Notifications
 */
export async function getTeamNotifications(teamId: string, limit: number = 100): Promise<TeamNotification[]> {
  try {
    console.log('📊 Lade Notifications für Team:', teamId);

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('team_id', teamId)
      .order('scheduled_for', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Fehler beim Laden der Team Notifications:', error);
      throw error;
    }

    console.log(`✅ ${notifications?.length || 0} Notifications für Team geladen`);
    return notifications || [];

  } catch (error) {
    console.error('❌ Fehler beim Laden der Team Notifications:', error);
    throw error;
  }
}

/**
 * Lädt gesendete Notifications für ein Team
 * @param teamId - Die Team-ID
 * @param limit - Maximale Anzahl der Notifications (Standard: 100)
 * @returns Array der gesendeten Notifications
 */
export async function getSentTeamNotifications(teamId: string, limit: number = 100): Promise<TeamNotification[]> {
  try {
    console.log('📊 Lade gesendete Notifications für Team:', teamId);

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('team_id', teamId)
      .eq('sent', true)
      .order('scheduled_for', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Fehler beim Laden der gesendeten Team Notifications:', error);
      throw error;
    }

    console.log(`✅ ${notifications?.length || 0} gesendete Notifications für Team geladen`);
    return notifications || [];

  } catch (error) {
    console.error('❌ Fehler beim Laden der gesendeten Team Notifications:', error);
    throw error;
  }
}

/**
 * Markiert eine Notification als gesendet
 * @param notificationId - Die Notification-ID
 * @returns Die aktualisierte Notification
 */
export async function markNotificationAsSent(notificationId: string): Promise<TeamNotification> {
  try {
    console.log('📤 Markiere Notification als gesendet:', notificationId);

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ sent: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      console.error('❌ Fehler beim Markieren der Notification als gesendet:', error);
      throw error;
    }

    console.log('✅ Notification erfolgreich als gesendet markiert');
    return notification;

  } catch (error) {
    console.error('❌ Fehler beim Markieren der Notification als gesendet:', error);
    throw error;
  }
}

/**
 * Fügt einen User zu den Lesern einer Notification hinzu
 * @param notificationId - Die Notification-ID
 * @param userId - Die User-ID
 * @returns Die aktualisierte Notification
 */
export async function markNotificationAsRead(notificationId: string, userId: string): Promise<TeamNotification> {
  try {
    console.log('👁️ Markiere Notification als gelesen:', { notificationId, userId });

    // Erst die aktuelle Notification laden
    const { data: currentNotification, error: fetchError } = await supabase
      .from('notifications')
      .select('read_by')
      .eq('id', notificationId)
      .single();

    if (fetchError) {
      console.error('❌ Fehler beim Laden der Notification:', fetchError);
      throw fetchError;
    }

    // User-ID zu read_by hinzufügen (falls noch nicht vorhanden)
    const readBy = currentNotification.read_by || [];
    if (!readBy.includes(userId)) {
      readBy.push(userId);
    }

    // Notification aktualisieren
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ read_by: readBy })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      console.error('❌ Fehler beim Markieren der Notification als gelesen:', error);
      throw error;
    }

    console.log('✅ Notification erfolgreich als gelesen markiert');
    return notification;

  } catch (error) {
    console.error('❌ Fehler beim Markieren der Notification als gelesen:', error);
    throw error;
  }
}

/**
 * Löscht eine Notification
 * @param notificationId - Die Notification-ID
 * @returns True wenn erfolgreich gelöscht
 */
export async function deleteTeamNotification(notificationId: string): Promise<boolean> {
  try {
    console.log('🗑️ Lösche Team Notification:', notificationId);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('❌ Fehler beim Löschen der Team Notification:', error);
      throw error;
    }

    console.log('✅ Team Notification erfolgreich gelöscht');
    return true;

  } catch (error) {
    console.error('❌ Fehler beim Löschen der Team Notification:', error);
    throw error;
  }
}

/**
 * Lädt Notification-Statistiken für ein Team
 * @param teamId - Die Team-ID
 * @returns Statistiken der Notifications
 */
export async function getTeamNotificationStats(teamId: string): Promise<{
  totalNotifications: number;
  sentNotifications: number;
  unsentNotifications: number;
  latestNotification?: string;
}> {
  try {
    console.log('📊 Lade Notification-Statistiken für Team:', teamId);

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('sent, scheduled_for')
      .eq('team_id', teamId);

    if (error) {
      console.error('❌ Fehler beim Laden der Notification-Statistiken:', error);
      throw error;
    }

    const totalNotifications = notifications?.length || 0;
    const sentNotifications = notifications?.filter(n => n.sent).length || 0;
    const unsentNotifications = totalNotifications - sentNotifications;
    const latestNotification = notifications?.length > 0 
      ? notifications.sort((a, b) => new Date(b.scheduled_for).getTime() - new Date(a.scheduled_for).getTime())[0].scheduled_for
      : undefined;

    console.log(`✅ Statistiken geladen: ${totalNotifications} total, ${sentNotifications} gesendet`);
    return {
      totalNotifications,
      sentNotifications,
      unsentNotifications,
      latestNotification
    };

  } catch (error) {
    console.error('❌ Fehler beim Laden der Notification-Statistiken:', error);
    throw error;
  }
}
