import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

// Konfiguriere die Standard-Benachrichtigungsdarstellung
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Registriert den Benutzer für Push-Benachrichtigungen
 * Diese Funktion wird beim App-Start nach dem Login aufgerufen
 */
export async function registerForPushNotificationsAsync() {
  let token: string | undefined;

  // Prüfe, ob es sich um ein echtes Gerät handelt
  if (Device.isDevice) {
    console.log('📱 Echtes Gerät erkannt, Push-Benachrichtigungen werden konfiguriert...');
    
    try {
      // Prüfe den aktuellen Berechtigungsstatus
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('🔐 Aktueller Berechtigungsstatus:', existingStatus);
      
      let finalStatus = existingStatus;
      
      // Wenn noch keine Berechtigung erteilt wurde, fordere sie an
      if (existingStatus !== 'granted') {
        console.log('🔐 Berechtigung wird angefordert...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('🔐 Neuer Berechtigungsstatus:', finalStatus);
      }
      
      // Wenn Berechtigung verweigert wurde, beende hier
      if (finalStatus !== 'granted') {
        console.log('❌ Push-Benachrichtigungen wurden verweigert');
        return;
      }
      
      // Generiere den Expo Push Token
      console.log('🔑 Expo Push Token wird generiert...');
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID || 'your-expo-project-id', // Ersetze dies durch deine tatsächliche Project ID
      })).data;
      
      console.log('✅ Expo Push Token erfolgreich generiert:', token);
      
      // Speichere den Token in der Supabase-Datenbank
      await saveExpoPushTokenToSupabase(token);
      
    } catch (error) {
      console.error('❌ Fehler beim Registrieren für Push-Benachrichtigungen:', error);
    }
  } else {
    console.log('💻 Emulator/Simulator erkannt, Push-Benachrichtigungen werden übersprungen');
  }

  // Konfiguriere die Plattform-spezifischen Einstellungen
  if (Platform.OS === 'android') {
    console.log('🤖 Android-spezifische Push-Notification-Konfiguration...');
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

/**
 * Speichert den Expo Push Token in der Supabase-Datenbank
 */
async function saveExpoPushTokenToSupabase(token: string) {
  try {
    // Hole den aktuellen Benutzer aus der Session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Benutzer nicht gefunden:', userError);
      return;
    }
    
    console.log('👤 Benutzer gefunden, Token wird gespeichert für ID:', user.id);
    
    // Aktualisiere das expo_push_token Feld in der users Tabelle
    const { error: updateError } = await supabase
      .from('users')
      .update({ expo_push_token: token })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('❌ Fehler beim Speichern des Expo Push Tokens:', updateError);
      
      // Falls das Feld nicht existiert, versuche es in der profiles Tabelle
      console.log('🔄 Versuche es in der profiles Tabelle...');
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          expo_push_token: token,
          updated_at: new Date().toISOString(),
        });
      
      if (profileError) {
        console.error('❌ Fehler beim Speichern in der profiles Tabelle:', profileError);
      } else {
        console.log('✅ Expo Push Token erfolgreich in der profiles Tabelle gespeichert');
      }
    } else {
      console.log('✅ Expo Push Token erfolgreich in der users Tabelle gespeichert');
    }
    
  } catch (error) {
    console.error('❌ Fehler beim Speichern des Expo Push Tokens:', error);
  }
}

/**
 * Entfernt den Expo Push Token aus der Datenbank (z.B. beim Logout)
 */
export async function removeExpoPushTokenFromSupabase() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ Benutzer nicht gefunden beim Entfernen des Tokens');
      return;
    }
    
    console.log('🗑️ Entferne Expo Push Token für Benutzer:', user.id);
    
    // Entferne den Token aus der users Tabelle
    const { error: updateError } = await supabase
      .from('users')
      .update({ expo_push_token: null })
      .eq('id', user.id);
    
    if (updateError) {
      console.log('🔄 Versuche es in der profiles Tabelle...');
      // Falls das Feld nicht existiert, versuche es in der profiles Tabelle
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          expo_push_token: null,
          updated_at: new Date().toISOString(),
        });
      
      if (profileError) {
        console.error('❌ Fehler beim Entfernen des Tokens aus der profiles Tabelle:', profileError);
      } else {
        console.log('✅ Expo Push Token erfolgreich aus der profiles Tabelle entfernt');
      }
    } else {
      console.log('✅ Expo Push Token erfolgreich aus der users Tabelle entfernt');
    }
    
  } catch (error) {
    console.error('❌ Fehler beim Entfernen des Expo Push Tokens:', error);
  }
}

/**
 * Sendet eine Push-Benachrichtigung über den Expo Push Notification Service
 * @param toToken - Der Expo Push Token des Empfängers
 * @param title - Der Titel der Benachrichtigung
 * @param body - Der Inhalt der Benachrichtigung
 */
export async function sendPushNotification(
  toToken: string,
  title: string,
  body: string
): Promise<void> {
  try {
    console.log('📤 Sende Push-Benachrichtigung:', {
      toToken: toToken.substring(0, 20) + '...',
      title,
      body
    });

    // Validiere den Token
    if (!toToken || toToken.trim() === '') {
      console.error('❌ Ungültiger Token: Token ist leer oder undefined');
      return;
    }

    // Validiere Titel und Body
    if (!title || title.trim() === '') {
      console.error('❌ Ungültiger Titel: Titel ist leer oder undefined');
      return;
    }

    if (!body || body.trim() === '') {
      console.error('❌ Ungültiger Body: Body ist leer oder undefined');
      return;
    }

    // Erstelle den Request Body für die Expo Push API
    const message = {
      to: toToken,
      title: title,
      body: body,
      sound: 'default',
      priority: 'high',
      channelId: 'default'
    };

    console.log('📋 Push-Notification-Payload:', message);

    // Sende die Benachrichtigung über die Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    // Überprüfe den HTTP-Status
    if (!response.ok) {
      const errorText = await response.text();
      console.warn('⚠️ Expo Push API HTTP-Fehler:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      // Versuche den Fehler als JSON zu parsen, falls möglich
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.errors && Array.isArray(errorJson.errors)) {
          console.warn('📋 API-Fehler-Details:', errorJson.errors);
        }
      } catch (parseError) {
        // Fehler ist kein gültiges JSON, verwende den Rohtext
        console.warn('📝 API-Fehler (Rohtext):', errorText);
      }
      return;
    }

    // Parse die JSON-Antwort
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      console.warn('⚠️ Fehler beim Parsen der API-Antwort:', parseError);
      return;
    }
    
    // Überprüfe die Struktur der Antwort
    if (!result || typeof result !== 'object') {
      console.warn('⚠️ Ungültige API-Antwort: Kein Objekt erhalten');
      return;
    }
    
    // Überprüfe das Ergebnis der Expo Push API
    if (result.data && Array.isArray(result.data)) {
      // Mehrere Nachrichten (Batch-Response)
      const successCount = result.data.filter((item: any) => item.status === 'ok').length;
      const errorCount = result.data.filter((item: any) => item.status === 'error').length;
      
      if (errorCount === 0) {
        console.log('✅ Push-Benachrichtigung erfolgreich gesendet:', {
          total: result.data.length,
          success: successCount,
          messageIds: result.data.map((item: any) => item.id).filter(Boolean)
        });
      } else {
        console.warn('⚠️ Push-Benachrichtigung teilweise fehlgeschlagen:', {
          total: result.data.length,
          success: successCount,
          errors: errorCount
        });
        
        // Logge detaillierte Fehler
        const errors = result.data.filter((item: any) => item.status === 'error');
        errors.forEach((error: any, index: number) => {
          console.warn(`❌ Fehler ${index + 1}:`, {
            status: error.status,
            message: error.message,
            details: error.details,
            code: error.code
          });
        });
      }
    } else if (result.data && result.data.status === 'ok') {
      // Einzelne Nachricht (Single-Response)
      console.log('✅ Push-Benachrichtigung erfolgreich gesendet:', {
        status: result.data.status,
        messageId: result.data.id
      });
    } else if (result.data && result.data.status === 'error') {
      // Einzelne Nachricht mit Fehler
      console.warn('⚠️ Expo Push API Fehler:', {
        status: result.data.status,
        error: result.data.message,
        details: result.data.details,
        code: result.data.code
      });
    } else if (result.errors && Array.isArray(result.errors)) {
      // API-Fehler im Standard-Format
      console.warn('⚠️ Expo Push API Fehler:', {
        errorCount: result.errors.length,
        errors: result.errors
      });
      
      result.errors.forEach((error: any, index: number) => {
        console.warn(`❌ API-Fehler ${index + 1}:`, {
          code: error.code,
          message: error.message,
          details: error.details
        });
      });
    } else {
      // Unerwartete Antwort-Struktur
      console.warn('⚠️ Unerwartete API-Antwort-Struktur:', result);
    }

  } catch (error) {
    console.error('❌ Fehler beim Senden der Push-Benachrichtigung:', error);
    
    // Detaillierte Fehlerbehandlung
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🔌 Netzwerkfehler: Überprüfe die Internetverbindung');
    } else if (error instanceof SyntaxError) {
      console.error('📝 JSON-Parsing-Fehler: Ungültige Antwort von der API');
    } else {
      console.error('💥 Unbekannter Fehler:', error);
    }
  }
}

/**
 * Sendet eine Push-Benachrichtigung an mehrere Empfänger
 * @param toTokens - Array von Expo Push Tokens
 * @param title - Der Titel der Benachrichtigung
 * @param body - Der Inhalt der Benachrichtigung
 */
export async function sendPushNotificationToMultiple(
  toTokens: string[],
  title: string,
  body: string
): Promise<void> {
  try {
    console.log('📤 Sende Push-Benachrichtigung an mehrere Empfänger:', {
      tokenCount: toTokens.length,
      title,
      body
    });

    // Validiere das Array
    if (!Array.isArray(toTokens) || toTokens.length === 0) {
      console.error('❌ Ungültige Tokens: Array ist leer oder undefined');
      return;
    }

    // Filtere ungültige Tokens
    const validTokens = toTokens.filter(token => token && token.trim() !== '');
    
    if (validTokens.length === 0) {
      console.error('❌ Keine gültigen Tokens gefunden');
      return;
    }

    if (validTokens.length !== toTokens.length) {
      console.warn('⚠️ Einige ungültige Tokens wurden gefiltert:', {
        original: toTokens.length,
        valid: validTokens.length
      });
    }

    // Erstelle den Request Body für mehrere Empfänger
    const messages = validTokens.map(token => ({
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

    // Überprüfe den HTTP-Status
    if (!response.ok) {
      const errorText = await response.text();
      console.warn('⚠️ Expo Push API HTTP-Fehler (mehrere Empfänger):', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      // Versuche den Fehler als JSON zu parsen, falls möglich
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.errors && Array.isArray(errorJson.errors)) {
          console.warn('📋 API-Fehler-Details (mehrere Empfänger):', errorJson.errors);
        }
      } catch (parseError) {
        // Fehler ist kein gültiges JSON, verwende den Rohtext
        console.warn('📝 API-Fehler (Rohtext, mehrere Empfänger):', errorText);
      }
      return;
    }

    // Parse die JSON-Antwort
    let results;
    try {
      results = await response.json();
    } catch (parseError) {
      console.warn('⚠️ Fehler beim Parsen der API-Antwort (mehrere Empfänger):', parseError);
      return;
    }
    
    // Überprüfe die Struktur der Antwort
    if (!results || typeof results !== 'object') {
      console.warn('⚠️ Ungültige API-Antwort (mehrere Empfänger): Kein Objekt erhalten');
      return;
    }
    
    // Überprüfe die Ergebnisse
    if (results.data && Array.isArray(results.data)) {
      const successCount = results.data.filter((result: any) => result.status === 'ok').length;
      const errorCount = results.data.filter((result: any) => result.status === 'error').length;
      
      if (errorCount === 0) {
        console.log('✅ Push-Benachrichtigungen an mehrere Empfänger erfolgreich gesendet:', {
          total: results.data.length,
          success: successCount,
          messageIds: results.data.map((item: any) => item.id).filter(Boolean)
        });
      } else {
        console.warn('⚠️ Push-Benachrichtigungen an mehrere Empfänger teilweise fehlgeschlagen:', {
          total: results.data.length,
          success: successCount,
          errors: errorCount
        });

        // Logge detaillierte Fehler
        const errors = results.data.filter((result: any) => result.status === 'error');
        errors.forEach((error: any, index: number) => {
          console.warn(`❌ Fehler ${index + 1} (mehrere Empfänger):`, {
            status: error.status,
            message: error.message,
            details: error.details,
            code: error.code
          });
        });
      }
    } else if (results.errors && Array.isArray(results.errors)) {
      // API-Fehler im Standard-Format
      console.warn('⚠️ Expo Push API Fehler (mehrere Empfänger):', {
        errorCount: results.errors.length,
        errors: results.errors
      });
      
      results.errors.forEach((error: any, index: number) => {
        console.warn(`❌ API-Fehler ${index + 1} (mehrere Empfänger):`, {
          code: error.code,
          message: error.message,
          details: error.details
        });
      });
    } else {
      // Unerwartete Antwort-Struktur
      console.warn('⚠️ Unerwartete API-Antwort-Struktur (mehrere Empfänger):', results);
    }

  } catch (error) {
    console.error('❌ Fehler beim Senden der Push-Benachrichtigungen an mehrere Empfänger:', error);
  }
}
