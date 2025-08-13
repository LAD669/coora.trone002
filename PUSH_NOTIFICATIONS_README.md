# Push Notifications Setup

Diese App implementiert Push-Benachrichtigungen mit Expo Notifications und speichert die Expo Push Tokens in der Supabase-Datenbank.

## Funktionalität

### `registerForPushNotificationsAsync()`

Die Hauptfunktion `registerForPushNotificationsAsync()` wird automatisch aufgerufen:

- **Beim App-Start** nach erfolgreichem Login
- **Bei der Registrierung** neuer Benutzer
- **Beim Session-Restore** (App wird wieder geöffnet)

### Was passiert beim Aufruf:

1. **Geräteerkennung**: Funktioniert nur auf echten Geräten (nicht im Emulator/Simulator)
2. **Berechtigungen**: Fordert Push-Notification-Berechtigungen an
3. **Token-Generierung**: Generiert einen Expo Push Token
4. **Datenbank-Speicherung**: Speichert den Token in der `users` Tabelle unter `expo_push_token`
5. **Plattform-Konfiguration**: Konfiguriert Android-spezifische Einstellungen
6. **Logging**: Alle Schritte werden in der Konsole protokolliert

## Datenbank-Schema

### Neue Felder in der `users` Tabelle:

```sql
ALTER TABLE users ADD COLUMN expo_push_token TEXT;
CREATE INDEX idx_users_expo_push_token ON users(expo_push_token);
```

## Integration

### AuthProvider Integration:

Die Funktion wird automatisch in folgenden Situationen aufgerufen:

- `loadUserProfile()` - Nach dem Laden des Benutzerprofils
- `signIn()` - Nach erfolgreichem Login
- `signUp()` - Nach erfolgreicher Registrierung
- `onAuthStateChange` - Bei Session-Änderungen
- `getSession()` - Beim initialen Session-Load

### Logout-Handling:

Beim Logout wird der Token automatisch aus der Datenbank entfernt:

```typescript
const { removeExpoPushTokenFromSupabase } = await import('@/lib/pushNotifications');
await removeExpoPushTokenFromSupabase();
```

## Konfiguration

### Umgebungsvariablen:

```bash
EXPO_PROJECT_ID=your-expo-project-id
```

**Wichtig**: Ersetze `your-expo-project-id` in `lib/pushNotifications.ts` durch deine tatsächliche Expo Project ID.

### Android-Konfiguration:

- **Notification Channel**: Wird automatisch erstellt
- **Vibration Pattern**: [0, 250, 250, 250]
- **Light Color**: #FF231F7C
- **Importance**: MAX

## Verwendung

### Token abrufen:

```typescript
import { registerForPushNotificationsAsync } from '@/lib/pushNotifications';

const token = await registerForPushNotificationsAsync();
console.log('Push Token:', token);
```

### Token entfernen:

```typescript
import { removeExpoPushTokenFromSupabase } from '@/lib/pushNotifications';

await removeExpoPushTokenFromSupabase();
```

### Push-Benachrichtigungen senden:

#### Einzelne Benachrichtigung:

```typescript
import { sendPushNotification } from '@/lib/pushNotifications';

await sendPushNotification(
  'ExponentPushToken[...]', // Empfänger-Token
  'Neue Nachricht',         // Titel
  'Du hast eine neue Nachricht erhalten' // Inhalt
);
```

#### Mehrere Empfänger:

```typescript
import { sendPushNotificationToMultiple } from '@/lib/pushNotifications';

await sendPushNotificationToMultiple(
  ['Token1', 'Token2', 'Token3'], // Array von Tokens
  'Team-Update',                   // Titel
  'Neues Training geplant'         // Inhalt
);
```

## Fehlerbehandlung

Die Funktion behandelt folgende Fehler:

- **Berechtigung verweigert**: Loggt den Fehler und beendet die Ausführung
- **Datenbank-Fehler**: Versucht es in der `profiles` Tabelle, falls die `users` Tabelle fehlschlägt
- **Geräte-Erkennung**: Überspringt die Registrierung auf Emulatoren/Simulatoren

## Logs

Alle wichtigen Schritte werden in der Konsole protokolliert:

```
📱 Echtes Gerät erkannt, Push-Benachrichtigungen werden konfiguriert...
🔐 Aktueller Berechtigungsstatus: undetermined
🔐 Berechtigung wird angefordert...
🔐 Neuer Berechtigungsstatus: granted
🔑 Expo Push Token wird generiert...
✅ Expo Push Token erfolgreich generiert: ExponentPushToken[...]
👤 Benutzer gefunden, Token wird gespeichert für ID: [...]
✅ Expo Push Token erfolgreich in der users Tabelle gespeichert
```

## API-Details

### Expo Push Notification Service

Die App verwendet die offizielle Expo Push API:
- **Endpoint**: `https://exp.host/--/api/v2/push/send`
- **Methode**: `POST`
- **Content-Type**: `application/json`

### Request Payload

```json
{
  "to": "ExponentPushToken[...]",
  "title": "Titel der Benachrichtigung",
  "body": "Inhalt der Benachrichtigung",
  "sound": "default",
  "priority": "high",
  "channelId": "default"
}
```

### Response Format

#### **Erfolgreiche Antwort (Single)**
```json
{
  "data": {
    "status": "ok",
    "id": "message-id-123"
  }
}
```

#### **Erfolgreiche Antwort (Batch)**
```json
{
  "data": [
    {
      "status": "ok",
      "id": "message-id-123"
    },
    {
      "status": "ok",
      "id": "message-id-124"
    }
  ]
}
```

#### **Fehler-Antwort**
```json
{
  "data": [
    {
      "status": "error",
      "message": "Invalid token",
      "details": "Token format is invalid",
      "code": "INVALID_TOKEN"
    }
  ]
}
```

#### **API-Fehler**
```json
{
  "errors": [
    {
      "code": "TOO_MANY_REQUESTS",
      "message": "Rate limit exceeded",
      "details": "Too many requests per second"
    }
  ]
}
```

### Fehlerbehandlung

Die Funktion behandelt folgende Fehlertypen:

#### **HTTP-Status-Fehler**
- **Nicht-200 Antworten**: Werden als Warnung geloggt
- **Fehler-Text-Parsing**: Versucht JSON-Fehler zu parsen
- **Fallback auf Rohtext**: Falls JSON-Parsing fehlschlägt

#### **API-Antwort-Parsing**
- **JSON-Parsing-Fehler**: Werden abgefangen und geloggt
- **Antwort-Struktur-Validierung**: Überprüft Objekt-Format
- **Verschiedene Antwort-Formate**: Unterstützt Single- und Batch-Responses

#### **Expo API-spezifische Fehler**
- **Status-basierte Fehler**: `ok` vs `error` Status
- **Fehler-Codes**: API-spezifische Fehlercodes
- **Fehler-Details**: Detaillierte Fehlerinformationen
- **Batch-Fehler**: Einzelne Fehler in Batch-Responses

#### **Netzwerk- und Validierungsfehler**
- **Netzwerkfehler**: Verbindungsprobleme
- **Validierungsfehler**: Ungültige Parameter
- **Unerwartete Antworten**: Unbekannte API-Formate

## Message-System mit automatischen Push-Benachrichtigungen

### Übersicht

Das Message-System sendet automatisch Push-Benachrichtigungen an alle Teammitglieder, wenn eine neue Nachricht erstellt wird.

### Funktionalität

- ✅ **Automatische Push-Benachrichtigungen** bei neuen Nachrichten
- ✅ **Teammitglieder-Filterung** (außer dem Autor)
- ✅ **Token-Abruf** aus der `users` Tabelle
- ✅ **Benachrichtigungsformat**: "Neue Nachricht" + "Autor: Inhalt"

### Verwendung

```typescript
import { createMessage } from '@/lib/messages';

// Neue Nachricht erstellen (Push-Benachrichtigungen werden automatisch gesendet)
const message = await createMessage({
  content: 'Hallo Team!',
  author_id: userId,
  team_id: teamId,
  message_type: 'general'
});
```

### Nachrichtentypen

- **general**: Allgemeine Nachrichten
- **announcement**: Wichtige Ankündigungen
- **reminder**: Erinnerungen
- **question**: Fragen an das Team

### Datenbank-Schema

```sql
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES users(id),
  team_id uuid NOT NULL REFERENCES teams(id),
  message_type text DEFAULT 'general',
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Push-Benachrichtigungs-Flow

1. **Nachricht erstellen** → Speicherung in `messages` Tabelle
2. **Teammitglieder laden** → Filter: `team_id = user.team_id` UND `id != user.id`
3. **Push-Token abrufen** → Aus `users.expo_push_token` Feld
4. **Benachrichtigungen senden** → Titel: "Neue Nachricht", Inhalt: "Autor: Nachricht"
5. **Logging** → Alle Schritte werden protokolliert

## Nächste Schritte

Um Push-Benachrichtigungen zu senden:

1. **Expo Push Service** konfigurieren
2. **Server-Side Logic** implementieren
3. **Notification Payloads** definieren
4. **Token-Validierung** implementieren

## Troubleshooting

### Häufige Probleme:

1. **"Project ID not found"**: Überprüfe die EXPO_PROJECT_ID
2. **"Permission denied"**: Benutzer hat Push-Benachrichtigungen deaktiviert
3. **"Database error"**: Überprüfe die Datenbankverbindung und das Schema
4. **"Not a device"**: Funktioniert nur auf echten Geräten

### Debugging:

Alle Funktionen haben umfangreiches Logging. Überprüfe die Konsole für detaillierte Informationen.
