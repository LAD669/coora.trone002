import { 
  createMessage, 
  getTeamMessages, 
  deleteMessage, 
  updateMessage,
  Message 
} from '@/lib/messages';

/**
 * Beispiele für die Verwendung der Message-Funktionalität mit automatischen Push-Benachrichtigungen
 */

// Beispiel 1: Einfache Nachricht erstellen
export async function sendSimpleMessage(
  userId: string, 
  teamId: string, 
  content: string
) {
  try {
    console.log('📝 Sende einfache Nachricht...');
    
    const message = await createMessage({
      content: content,
      author_id: userId,
      team_id: teamId,
      message_type: 'general'
    });
    
    console.log('✅ Nachricht erfolgreich gesendet:', message.id);
    console.log('📱 Push-Benachrichtigungen wurden automatisch an alle Teammitglieder gesendet');
    
    return message;
  } catch (error) {
    console.error('❌ Fehler beim Senden der Nachricht:', error);
    throw error;
  }
}

// Beispiel 2: Team-Ankündigung senden
export async function sendTeamAnnouncement(
  userId: string, 
  teamId: string, 
  announcement: string
) {
  try {
    console.log('📢 Sende Team-Ankündigung...');
    
    const message = await createMessage({
      content: announcement,
      author_id: userId,
      team_id: teamId,
      message_type: 'announcement',
      is_pinned: true // Wichtige Ankündigungen werden angepinnt
    });
    
    console.log('✅ Team-Ankündigung erfolgreich gesendet:', message.id);
    console.log('📱 Alle Teammitglieder erhalten eine Push-Benachrichtigung');
    
    return message;
  } catch (error) {
    console.error('❌ Fehler beim Senden der Team-Ankündigung:', error);
    throw error;
  }
}

// Beispiel 3: Training-Erinnerung senden
export async function sendTrainingReminder(
  userId: string, 
  teamId: string, 
  trainingTime: string, 
  location: string
) {
  try {
    console.log('⚽ Sende Training-Erinnerung...');
    
    const reminderContent = `Training heute um ${trainingTime} in ${location}. Bitte nicht vergessen!`;
    
    const message = await createMessage({
      content: reminderContent,
      author_id: userId,
      team_id: teamId,
      message_type: 'reminder'
    });
    
    console.log('✅ Training-Erinnerung erfolgreich gesendet:', message.id);
    console.log('📱 Alle Teammitglieder erhalten eine Push-Benachrichtigung');
    
    return message;
  } catch (error) {
    console.error('❌ Fehler beim Senden der Training-Erinnerung:', error);
    throw error;
  }
}

// Beispiel 4: Frage an das Team stellen
export async function askTeamQuestion(
  userId: string, 
  teamId: string, 
  question: string
) {
  try {
    console.log('❓ Stelle Frage an das Team...');
    
    const message = await createMessage({
      content: question,
      author_id: userId,
      team_id: teamId,
      message_type: 'question'
    });
    
    console.log('✅ Frage erfolgreich gestellt:', message.id);
    console.log('📱 Alle Teammitglieder erhalten eine Push-Benachrichtigung');
    
    return message;
  } catch (error) {
    console.error('❌ Fehler beim Stellen der Frage:', error);
    throw error;
  }
}

// Beispiel 5: Nachrichten für ein Team laden
export async function loadTeamMessages(teamId: string, limit: number = 20) {
  try {
    console.log(`📚 Lade die letzten ${limit} Nachrichten für Team ${teamId}...`);
    
    const messages = await getTeamMessages(teamId, limit);
    
    console.log(`✅ ${messages.length} Nachrichten erfolgreich geladen`);
    
    // Zeige eine Zusammenfassung der Nachrichten
    messages.forEach((message, index) => {
      const authorName = message.author?.name || 'Unbekannt';
      const content = message.content.length > 50 
        ? message.content.substring(0, 50) + '...' 
        : message.content;
      
      console.log(`${index + 1}. ${authorName}: ${content}`);
    });
    
    return messages;
  } catch (error) {
    console.error('❌ Fehler beim Laden der Team-Nachrichten:', error);
    throw error;
  }
}

// Beispiel 6: Nachricht bearbeiten
export async function editMessage(
  messageId: string, 
  userId: string, 
  newContent: string
) {
  try {
    console.log('✏️ Bearbeite Nachricht...');
    
    const updatedMessage = await updateMessage(
      messageId,
      { content: newContent },
      userId
    );
    
    console.log('✅ Nachricht erfolgreich bearbeitet:', messageId);
    console.log('📝 Neuer Inhalt:', updatedMessage.content);
    
    return updatedMessage;
  } catch (error) {
    console.error('❌ Fehler beim Bearbeiten der Nachricht:', error);
    throw error;
  }
}

// Beispiel 7: Nachricht löschen
export async function removeMessage(messageId: string, userId: string) {
  try {
    console.log('🗑️ Lösche Nachricht...');
    
    const success = await deleteMessage(messageId, userId);
    
    if (success) {
      console.log('✅ Nachricht erfolgreich gelöscht:', messageId);
    } else {
      console.log('⚠️ Nachricht konnte nicht gelöscht werden');
    }
    
    return success;
  } catch (error) {
    console.error('❌ Fehler beim Löschen der Nachricht:', error);
    throw error;
  }
}

// Beispiel 8: Batch-Nachrichten senden
export async function sendBatchMessages(
  userId: string, 
  teamId: string, 
  messages: Array<{
    content: string;
    type: 'general' | 'announcement' | 'reminder' | 'question';
    isPinned?: boolean;
  }>
) {
  try {
    console.log(`📤 Sende ${messages.length} Nachrichten im Batch...`);
    
    const results = [];
    
    for (const messageData of messages) {
      try {
        const message = await createMessage({
          content: messageData.content,
          author_id: userId,
          team_id: teamId,
          message_type: messageData.type,
          is_pinned: messageData.isPinned || false
        });
        
        results.push({ success: true, message });
        console.log(`✅ Nachricht gesendet: ${message.id}`);
        
        // Kleine Verzögerung zwischen Nachrichten
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Fehler beim Senden der Nachricht: ${messageData.content}`, error);
        results.push({ success: false, error: error.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    console.log(`📊 Batch-Ergebnis: ${successCount} erfolgreich, ${errorCount} Fehler`);
    
    return results;
  } catch (error) {
    console.error('❌ Fehler beim Batch-Senden der Nachrichten:', error);
    throw error;
  }
}

// Beispiel 9: Nachrichten-Statistiken abrufen
export async function getMessageStats(teamId: string) {
  try {
    console.log('📊 Lade Nachrichten-Statistiken...');
    
    const messages = await getTeamMessages(teamId, 1000); // Alle Nachrichten laden
    
    const stats = {
      total: messages.length,
      byType: {
        general: messages.filter(m => m.message_type === 'general').length,
        announcement: messages.filter(m => m.message_type === 'announcement').length,
        reminder: messages.filter(m => m.message_type === 'reminder').length,
        question: messages.filter(m => m.message_type === 'question').length
      },
      pinned: messages.filter(m => m.is_pinned).length,
      recent: messages.filter(m => {
        const messageDate = new Date(m.created_at);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return messageDate > oneWeekAgo;
      }).length
    };
    
    console.log('📊 Nachrichten-Statistiken:', stats);
    
    return stats;
  } catch (error) {
    console.error('❌ Fehler beim Laden der Nachrichten-Statistiken:', error);
    throw error;
  }
}

// Beispiel 10: Nachrichten nach Typ filtern
export async function getMessagesByType(
  teamId: string, 
  messageType: 'general' | 'announcement' | 'reminder' | 'question'
) {
  try {
    console.log(`🔍 Lade Nachrichten vom Typ: ${messageType}`);
    
    const allMessages = await getTeamMessages(teamId, 1000);
    const filteredMessages = allMessages.filter(m => m.message_type === messageType);
    
    console.log(`✅ ${filteredMessages.length} Nachrichten vom Typ '${messageType}' gefunden`);
    
    return filteredMessages;
  } catch (error) {
    console.error('❌ Fehler beim Filtern der Nachrichten:', error);
    throw error;
  }
}
