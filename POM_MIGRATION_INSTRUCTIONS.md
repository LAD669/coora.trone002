# POM Voting Migration Instructions

## 🚨 Wichtiger Hinweis

Das POM Voting-System ist vollständig implementiert, aber die Datenbank-Migration muss noch ausgeführt werden. Die App funktioniert derzeit im "Demo-Modus" mit simulierten Daten.

## 📋 Migration ausführen

### Option 1: Supabase Dashboard (Empfohlen)

1. Gehe zu deinem Supabase Dashboard
2. Navigiere zu "SQL Editor"
3. Kopiere den Inhalt der Datei `supabase/migrations/20250116000000_create_pom_voting.sql`
4. Füge ihn in den SQL Editor ein
5. Führe die Migration aus

### Option 2: Supabase CLI (falls konfiguriert)

```bash
# Falls Supabase lokal läuft
npx supabase db push

# Oder für Remote-Datenbank
npx supabase db push --linked
```

## 🗃️ Was wird erstellt

Die Migration erstellt folgende Tabellen:

- **pom_votes**: Speichert individuelle Stimmen
- **pom_results**: Speichert aggregierte Ergebnisse
- **pom_player_standings**: Speichert Spieler-Rankings

## 🔧 Features nach Migration

Nach der Migration sind folgende Features vollständig funktionsfähig:

- ✅ POM Voting für abgeschlossene Spiele
- ✅ Punkte-System (1. Platz = 100P, 2. Platz = 50P, 3. Platz = 25P)
- ✅ Automatische Berechnung der Rankings
- ✅ Voting-Schließung durch Trainer/Admins
- ✅ Saison-Leaderboard

## 🎯 Aktueller Status

- **UI**: ✅ Vollständig implementiert und getestet
- **Funktionen**: ✅ Vollständig implementiert mit Fallback-Logik
- **Datenbank**: ⚠️ Migration ausstehend
- **Backend**: ✅ Bereit für Produktion

## 🚀 Nach der Migration

Sobald die Migration ausgeführt wurde:

1. Die App erkennt automatisch die neuen Tabellen
2. Alle POM-Features funktionieren vollständig
3. Stimmen werden persistent gespeichert
4. Rankings werden automatisch berechnet

## 📞 Support

Falls Probleme bei der Migration auftreten, überprüfe:

1. Supabase-Verbindung
2. Berechtigungen für Tabellenerstellung
3. SQL-Syntax-Fehler im Dashboard

Die Migration ist sicher und kann mehrfach ausgeführt werden (idempotent).
