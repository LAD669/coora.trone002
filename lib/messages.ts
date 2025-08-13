import { supabase } from './supabaseClient';
import { sendPushNotification } from './pushNotifications';

/**
 * Message-Interface für TypeScript
 */
export interface Message {
  id: string;
  content: string;
  author_id: string;
  team_id: string;
  message_type: 'general' | 'announcement' | 'reminder' | 'question';
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Erstellt eine neue Nachricht und sendet automatisch Push-Benachrichtigungen an alle Teammitglieder
 * @param messageData - Die Nachrichtendaten
 * @returns Die erstellte Nachricht
 */
export async function createMessage(messageData: {
  content: string;
  author_id: string;
  team_id: string;
  message_type?: 'general' | 'announcement' | 'reminder' | 'question';
  is_pinned?: boolean;
}): Promise<Message> {
  try {
    console.log('📝 Erstelle neue Nachricht:', {
      content: messageData.content.substring(0, 50) + '...',
      author_id: messageData.author_id,
      team_id: messageData.team_id,
      message_type: messageData.message_type
    });

    // Erstelle die Nachricht in der Datenbank
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        content: messageData.content,
        author_id: messageData.author_id,
        team_id: messageData.team_id,
        message_type: messageData.message_type || 'general',
        is_pinned: messageData.is_pinned || false,
      })
      .select()
      .single();

    if (messageError) {
      console.error('❌ Fehler beim Erstellen der Nachricht:', messageError);
      throw messageError;
    }

    if (!message) {
      throw new Error('Nachricht konnte nicht erstellt werden');
    }

    console.log('✅ Nachricht erfolgreich erstellt:', message.id);

    // Sende Push-Benachrichtigungen an alle Teammitglieder (außer dem Autor)
    await sendPushNotificationsToTeamMembers(message);

    return message;

  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Nachricht:', error);
    throw error;
  }
}

/**
 * Sendet Push-Benachrichtigungen an alle Teammitglieder (außer dem Autor)
 * @param message - Die erstellte Nachricht
 */
async function sendPushNotificationsToTeamMembers(message: Message): Promise<void> {
  try {
    console.log('📤 Sende Push-Benachrichtigungen an Teammitglieder für Nachricht:', message.id);

    // Hole alle Teammitglieder (außer dem Autor)
    const { data: teamMembers, error: membersError } = await supabase
      .from('users')
      .select('id, expo_push_token, name, first_name, last_name')
      .eq('team_id', message.team_id)
      .neq('id', message.author_id) // Ausschluss des Autors
      .not('expo_push_token', 'is', null); // Nur Benutzer mit Push-Token

    if (membersError) {
      console.error('❌ Fehler beim Laden der Teammitglieder:', membersError);
      return;
    }

    if (!teamMembers || teamMembers.length === 0) {
      console.log('⚠️ Keine Teammitglieder mit Push-Token gefunden');
      return;
    }

    console.log(`👥 Gefunden: ${teamMembers.length} Teammitglieder mit Push-Token`);

    // Hole den Namen des Autors für die Benachrichtigung
    const { data: author, error: authorError } = await supabase
      .from('users')
      .select('name, first_name, last_name')
      .eq('id', message.author_id)
      .single();

    if (authorError) {
      console.error('❌ Fehler beim Laden des Autors:', authorError);
      return;
    }

    const authorName = author.name || `${author.first_name || ''} ${author.last_name || ''}`.trim() || 'Ein Teammitglied';

    // Erstelle den Benachrichtigungstitel und -inhalt
    const notificationTitle = 'Neue Nachricht';
    const notificationBody = `${authorName}: ${message.content}`;

    // Sende Push-Benachrichtigungen an alle Teammitglieder
    const tokens = teamMembers
      .map(member => member.expo_push_token)
      .filter(token => token && token.trim() !== '') as string[];

    if (tokens.length === 0) {
      console.log('⚠️ Keine gültigen Push-Token gefunden');
      return;
    }

    console.log(`📱 Sende Push-Benachrichtigungen an ${tokens.length} Teammitglieder`);

    // Sende die Benachrichtigungen
    await sendPushNotificationToMultiple(tokens, notificationTitle, notificationBody);

    console.log('✅ Push-Benachrichtigungen erfolgreich gesendet');

  } catch (error) {
    console.error('❌ Fehler beim Senden der Push-Benachrichtigungen:', error);
  }
}

/**
 * Sendet Push-Benachrichtigungen an mehrere Empfänger
 * @param tokens - Array von Expo Push Tokens
 * @param title - Titel der Benachrichtigung
 * @param body - Inhalt der Benachrichtigung
 */
async function sendPushNotificationToMultiple(
  tokens: string[],
  title: string,
  body: string
): Promise<void> {
  try {
    // Erstelle den Request Body für mehrere Empfänger
    const messages = tokens.map(token => ({
      to: token,
      title: title,
      body: body,
      sound: 'default',
      priority: 'high',
      channelId: 'default'
    }));

    console.log('📋 Push-Notification-Payload für mehrere Empfänger:', {
      messageCount: messages.length,
      sampleMessage: messages[0]
    });

    // Sende die Benachrichtigungen über die Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Expo Push API Fehler (mehrere Empfänger):', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return;
    }

    const results = await response.json();
    
    // Überprüfe die Ergebnisse
    if (Array.isArray(results.data)) {
      const successCount = results.data.filter((result: any) => result.status === 'ok').length;
      const errorCount = results.data.filter((result: any) => result.status === 'error').length;
      
      console.log('✅ Push-Benachrichtigungen an mehrere Empfänger gesendet:', {
        total: results.data.length,
        success: successCount,
        errors: errorCount
      });

      // Logge detaillierte Fehler
      if (errorCount > 0) {
        const errors = results.data.filter((result: any) => result.status === 'error');
        console.error('❌ Fehler beim Senden an einige Empfänger:', errors);
      }
    } else {
      console.log('⚠️ Unerwartete Antwort von Expo Push API (mehrere Empfänger):', results);
    }

  } catch (error) {
    console.error('❌ Fehler beim Senden der Push-Benachrichtigungen an mehrere Empfänger:', error);
  }
}

/**
 * Lädt alle Nachrichten für ein Team
 * @param teamId - Die Team-ID
 * @param limit - Maximale Anzahl der Nachrichten (Standard: 50)
 * @returns Array der Nachrichten
 */
export async function getTeamMessages(
  teamId: string, 
  limit: number = 50
): Promise<Message[]> {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        author:users!messages_author_id_fkey(
          id,
          name,
          first_name,
          last_name
        )
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Fehler beim Laden der Team-Nachrichten:', error);
      throw error;
    }

    return messages || [];

  } catch (error) {
    console.error('❌ Fehler beim Laden der Team-Nachrichten:', error);
    throw error;
  }
}

/**
 * Löscht eine Nachricht (nur für den Autor oder Admin)
 * @param messageId - Die Nachrichten-ID
 * @param userId - Die Benutzer-ID (für Autorisierung)
 * @returns true wenn erfolgreich gelöscht
 */
export async function deleteMessage(messageId: string, userId: string): Promise<boolean> {
  try {
    // Prüfe, ob der Benutzer der Autor ist oder Admin-Rechte hat
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('author_id')
      .eq('id', messageId)
      .single();

    if (fetchError) {
      console.error('❌ Fehler beim Laden der Nachricht:', fetchError);
      throw fetchError;
    }

    if (!message) {
      throw new Error('Nachricht nicht gefunden');
    }

    // Prüfe Autorisierung (Autor oder Admin)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ Fehler beim Laden des Benutzers:', userError);
      throw userError;
    }

    const isAuthor = message.author_id === userId;
    const isAdmin = user?.role === 'admin' || user?.role === 'trainer';

    if (!isAuthor && !isAdmin) {
      throw new Error('Keine Berechtigung zum Löschen dieser Nachricht');
    }

    // Lösche die Nachricht
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (deleteError) {
      console.error('❌ Fehler beim Löschen der Nachricht:', deleteError);
      throw deleteError;
    }

    console.log('✅ Nachricht erfolgreich gelöscht:', messageId);
    return true;

  } catch (error) {
    console.error('❌ Fehler beim Löschen der Nachricht:', error);
    throw error;
  }
}

/**
 * Aktualisiert eine Nachricht (nur für den Autor)
 * @param messageId - Die Nachrichten-ID
 * @param updates - Die zu aktualisierenden Felder
 * @param userId - Die Benutzer-ID (für Autorisierung)
 * @returns Die aktualisierte Nachricht
 */
export async function updateMessage(
  messageId: string,
  updates: Partial<Pick<Message, 'content' | 'message_type' | 'is_pinned'>>,
  userId: string
): Promise<Message> {
  try {
    // Prüfe, ob der Benutzer der Autor ist
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('author_id')
      .eq('id', messageId)
      .single();

    if (fetchError) {
      console.error('❌ Fehler beim Laden der Nachricht:', fetchError);
      throw fetchError;
    }

    if (!message) {
      throw new Error('Nachricht nicht gefunden');
    }

    if (message.author_id !== userId) {
      throw new Error('Keine Berechtigung zum Bearbeiten dieser Nachricht');
    }

    // Aktualisiere die Nachricht
    const { data: updatedMessage, error: updateError } = await supabase
      .from('messages')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Fehler beim Aktualisieren der Nachricht:', updateError);
      throw updateError;
    }

    if (!updatedMessage) {
      throw new Error('Nachricht konnte nicht aktualisiert werden');
    }

    console.log('✅ Nachricht erfolgreich aktualisiert:', messageId);
    return updatedMessage;

  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Nachricht:', error);
    throw error;
  }
}
