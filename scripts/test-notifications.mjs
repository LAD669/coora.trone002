#!/usr/bin/env node

/**
 * Test-Script für die neue notifications-Struktur
 * Überprüft, ob die Migration erfolgreich war und die sent-Spalte existiert
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL oder Key fehlt in den Environment Variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNotificationsSchema() {
  console.log('🧪 Teste notifications-Schema...');

  try {
    // Test 1: Überprüfe, ob die notifications-Tabelle existiert
    console.log('📋 Test 1: Überprüfe Tabellen-Existenz...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'notifications');

    if (tablesError) {
      console.error('❌ Fehler beim Abfragen der Tabellen:', tablesError);
      return false;
    }

    if (!tables || tables.length === 0) {
      console.error('❌ notifications-Tabelle existiert nicht');
      return false;
    }

    console.log('✅ notifications-Tabelle existiert');

    // Test 2: Überprüfe Spalten-Struktur
    console.log('📋 Test 2: Überprüfe Spalten-Struktur...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'notifications')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Fehler beim Abfragen der Spalten:', columnsError);
      return false;
    }

    console.log('📊 Gefundene Spalten:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Überprüfe, ob alle erforderlichen Spalten vorhanden sind
    const requiredColumns = [
      'id', 'notification_type', 'title', 'message', 
      'event_id', 'team_id', 'scheduled_for', 'sent', 
      'read_by', 'created_at'
    ];

    const existingColumns = columns.map(col => col.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.error('❌ Fehlende Spalten:', missingColumns);
      return false;
    }

    console.log('✅ Alle erforderlichen Spalten sind vorhanden');

    // Test 3: Teste Query mit sent-Spalte
    console.log('📋 Test 3: Teste Query mit sent-Spalte...');
    const { data: notifications, error: queryError } = await supabase
      .from('notifications')
      .select('id, sent, team_id')
      .limit(1);

    if (queryError) {
      console.error('❌ Fehler beim Abfragen der notifications:', queryError);
      return false;
    }

    console.log('✅ Query mit sent-Spalte funktioniert');
    console.log(`📊 Gefundene Notifications: ${notifications?.length || 0}`);

    // Test 4: Teste Insert mit neuer Struktur
    console.log('📋 Test 4: Teste Insert mit neuer Struktur...');
    const testNotification = {
      notification_type: 'general',
      title: 'Test Notification',
      message: 'Dies ist eine Test-Notification',
      team_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      scheduled_for: new Date().toISOString(),
      sent: false,
      read_by: []
    };

    const { data: insertedNotification, error: insertError } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Fehler beim Insert-Test:', insertError);
      return false;
    }

    console.log('✅ Insert mit neuer Struktur funktioniert');
    console.log(`📊 Erstellte Notification ID: ${insertedNotification.id}`);

    // Cleanup: Lösche Test-Notification
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', insertedNotification.id);

    if (deleteError) {
      console.warn('⚠️ Warnung: Test-Notification konnte nicht gelöscht werden:', deleteError);
    } else {
      console.log('✅ Test-Notification erfolgreich gelöscht');
    }

    console.log('🎉 Alle Tests erfolgreich! Die notifications-Struktur ist korrekt.');
    return true;

  } catch (error) {
    console.error('❌ Unerwarteter Fehler:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starte notifications-Schema-Test...\n');
  
  const success = await testNotificationsSchema();
  
  if (success) {
    console.log('\n✅ Alle Tests bestanden! Die DB-Migration war erfolgreich.');
    process.exit(0);
  } else {
    console.log('\n❌ Tests fehlgeschlagen! Überprüfe die Migration.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Script-Fehler:', error);
  process.exit(1);
});
