# Manager Role Implementation

## Overview
Die Manager-Rolle wurde erfolgreich implementiert und bietet Clubverantwortlichen einen umfassenden Überblick über alle Teams und Funktionen des Vereins.

## Implementierte Features

### 1. Datenbank-Änderungen
- **Migration**: `20250116000002_add_manager_role.sql`
- Neue Rolle `manager` zum `user_role` Enum hinzugefügt
- Manager-spezifische Views und Funktionen erstellt:
  - `manager_club_overview` - Übersicht über alle Club-Daten
  - `is_manager()` Funktion für Rollenprüfung
  - RLS-Policies für Manager-Zugriff auf Club-Daten

### 2. Manager-spezifische Screens

#### Manager Dashboard (`manager-dashboard.tsx`)
- **Club Overview**: Zeigt Vereinsname, Beschreibung und Logo
- **Club Statistics**: 
  - Gesamt Teams
  - Gesamt Spieler
  - Gesamt Trainer
  - Gesamt Events
- **Quick Actions**: Schnellzugriff auf andere Manager-Funktionen
- **Recent Events**: Letzte 5 Events aller Teams
- **Recent Organization Posts**: Letzte 5 Organisations-Posts

#### Manager Playerboard (`manager-playerboard.tsx`)
- **Alle Teams**: Zeigt alle Teams des Vereins mit Farb-Indikatoren
- **Alle Mitglieder**: Spieler, Trainer und Manager aller Teams
- **Filter-Funktionen**:
  - Suche nach Name, E-Mail, Position
  - Filter nach Rolle (Player, Trainer, Manager)
  - Filter nach Team
- **Erweiterbare Team-Sektionen**: Teams können ein-/ausgeklappt werden
- **Statistiken**: Anzahl Mitglieder und Trainer

#### Manager Calendar (`manager-calendar.tsx`)
- **Alle Events**: Termine aller Teams des Vereins
- **Filter-Funktionen**:
  - Suche nach Titel, Ort, Team
  - Filter nach Event-Typ (Training, Match)
  - Filter nach Team
  - Filter nach Zeitraum (Heute, Diese Woche, Dieser Monat)
- **Event-Details**: Vollständige Informationen mit Team-Farben
- **Statistiken**: Anzahl Events, Matches, Trainings

#### Manager Infohub (`manager-infohub.tsx`)
- **Nur Organization Posts**: Zeigt ausschließlich Organisations-Posts
- **Filter-Funktionen**:
  - Suche nach Titel, Inhalt, Autor
  - Filter nach Team
- **Post-Details**: Vollständige Posts mit Bildern und Reaktionen
- **Statistiken**: Anzahl Posts und Herzen

### 3. Navigation
- **Rollenbasierte Navigation**: Manager werden automatisch zu Manager-Tabs weitergeleitet
- **Manager-spezifische Tab-Struktur**:
  - Club Dashboard (Hauptscreen)
  - Organization Hub
  - Club Calendar
  - All Teams & Members
- **Separate Layout-Dateien**: Manager haben eigene Navigation ohne Konflikte

### 4. Supabase-Funktionen
Neue Manager-spezifische Funktionen in `lib/supabase.ts`:
- `getManagerClubOverview()` - Club-Übersicht
- `getAllClubTeams()` - Alle Teams des Vereins
- `getAllClubUsers()` - Alle Benutzer des Vereins
- `getAllClubEvents()` - Alle Events des Vereins
- `getClubOrganizationPosts()` - Nur Organisations-Posts

### 5. Übersetzungen
- Deutsche und englische Übersetzungen für Manager-spezifische Begriffe hinzugefügt
- Konsistente Terminologie für alle Manager-Funktionen

## Technische Details

### Rollenprüfung
```typescript
// Automatische Weiterleitung basierend auf Rolle
if (user.role === 'manager') {
  return <Redirect href="/(app)/manager-tabs" />;
}
```

### Datenbank-Zugriff
- Manager haben Zugriff auf alle Daten ihres Vereins (`club_id`)
- RLS-Policies gewährleisten sicheren Zugriff
- Views optimieren Performance für Manager-Abfragen

### UI/UX
- Konsistentes Design mit dem Rest der App
- Manager-spezifische Farben und Icons
- Responsive Filter und Suchfunktionen
- Erweiterbare Sektionen für bessere Übersicht

## Verwendung

### Manager-Benutzer erstellen
1. Benutzer mit Rolle `manager` in der Datenbank erstellen
2. `club_id` muss gesetzt sein
3. Manager wird automatisch zu Manager-Tabs weitergeleitet

### Zugriff auf Manager-Funktionen
- Manager sehen automatisch die Manager-Navigation
- Alle anderen Rollen (Player, Trainer) sehen die normale Navigation
- Keine Änderungen für bestehende Benutzer erforderlich

## Sicherheit
- RLS-Policies gewährleisten, dass Manager nur auf Daten ihres Vereins zugreifen können
- Rollenprüfung auf Client- und Server-Seite
- Sichere Datenbank-Abfragen mit korrekten Filtern

## Erweiterungsmöglichkeiten
- Manager können weitere administrative Funktionen erhalten
- Team-Management-Funktionen
- Benutzer-Management
- Vereins-Einstellungen
- Berichte und Analytics
