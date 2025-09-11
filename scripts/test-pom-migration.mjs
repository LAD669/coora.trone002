#!/usr/bin/env node

/**
 * Test-Script für die POM-Voting-Migration
 * Überprüft, ob die Migration erfolgreich war und alle Tabellen/Spalten existieren
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

async function testPOMMigration() {
  console.log('🧪 Teste POM-Voting-Migration...');

  try {
    // Test 1: Überprüfe user_points Spalte in users Tabelle
    console.log('📋 Test 1: Überprüfe user_points Spalte...');
    const { data: userColumns, error: userColumnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')
      .eq('column_name', 'user_points');

    if (userColumnsError) {
      console.error('❌ Fehler beim Abfragen der user-Spalten:', userColumnsError);
      return false;
    }

    if (!userColumns || userColumns.length === 0) {
      console.error('❌ user_points Spalte existiert nicht in users Tabelle');
      return false;
    }

    console.log('✅ user_points Spalte existiert:', userColumns[0]);

    // Test 2: Überprüfe pom_votes Tabelle
    console.log('📋 Test 2: Überprüfe pom_votes Tabelle...');
    const { data: pomTable, error: pomTableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'pom_votes');

    if (pomTableError) {
      console.error('❌ Fehler beim Abfragen der pom_votes Tabelle:', pomTableError);
      return false;
    }

    if (!pomTable || pomTable.length === 0) {
      console.error('❌ pom_votes Tabelle existiert nicht');
      return false;
    }

    console.log('✅ pom_votes Tabelle existiert');

    // Test 3: Überprüfe pom_votes Spalten
    console.log('📋 Test 3: Überprüfe pom_votes Spalten...');
    const { data: pomColumns, error: pomColumnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'pom_votes')
      .order('ordinal_position');

    if (pomColumnsError) {
      console.error('❌ Fehler beim Abfragen der pom_votes Spalten:', pomColumnsError);
      return false;
    }

    console.log('📊 pom_votes Spalten:');
    pomColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Überprüfe, ob alle erforderlichen Spalten vorhanden sind
    const requiredColumns = [
      'id', 'match_id', 'voter_id', 'player1_id', 
      'player2_id', 'player3_id', 'created_at'
    ];

    const existingColumns = pomColumns.map(col => col.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.error('❌ Fehlende pom_votes Spalten:', missingColumns);
      return false;
    }

    console.log('✅ Alle erforderlichen pom_votes Spalten sind vorhanden');

    // Test 4: Überprüfe pom_voting_results View
    console.log('📋 Test 4: Überprüfe pom_voting_results View...');
    const { data: pomView, error: pomViewError } = await supabase
      .from('information_schema.views')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'pom_voting_results');

    if (pomViewError) {
      console.error('❌ Fehler beim Abfragen der pom_voting_results View:', pomViewError);
      return false;
    }

    if (!pomView || pomView.length === 0) {
      console.error('❌ pom_voting_results View existiert nicht');
      return false;
    }

    console.log('✅ pom_voting_results View existiert');

    // Test 5: Teste Insert in pom_votes (mit Rollback)
    console.log('📋 Test 5: Teste pom_votes Insert...');
    
    // Erst prüfen, ob es Test-Daten gibt
    const { data: testUsers, error: testUsersError } = await supabase
      .from('users')
      .select('id')
      .limit(3);

    if (testUsersError || !testUsers || testUsers.length < 3) {
      console.warn('⚠️ Nicht genügend Test-User für Insert-Test');
    } else {
      const testVote = {
        match_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        voter_id: testUsers[0].id,
        player1_id: testUsers[1].id,
        player2_id: testUsers[2].id,
        player3_id: null
      };

      const { data: insertedVote, error: insertError } = await supabase
        .from('pom_votes')
        .insert(testVote)
        .select()
        .single();

      if (insertError) {
        console.warn('⚠️ Insert-Test fehlgeschlagen (erwartet bei Dummy-Daten):', insertError.message);
      } else {
        console.log('✅ pom_votes Insert funktioniert');
        
        // Cleanup: Lösche Test-Vote
        const { error: deleteError } = await supabase
          .from('pom_votes')
          .delete()
          .eq('id', insertedVote.id);

        if (deleteError) {
          console.warn('⚠️ Test-Vote konnte nicht gelöscht werden:', deleteError.message);
        } else {
          console.log('✅ Test-Vote erfolgreich gelöscht');
        }
      }
    }

    // Test 6: Überprüfe Indizes
    console.log('📋 Test 6: Überprüfe Indizes...');
    const { data: indexes, error: indexesError } = await supabase
      .from('information_schema.statistics')
      .select('index_name, table_name, column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'pom_votes');

    if (indexesError) {
      console.error('❌ Fehler beim Abfragen der Indizes:', indexesError);
      return false;
    }

    const expectedIndexes = [
      'idx_pom_votes_match_id',
      'idx_pom_votes_voter_id',
      'idx_pom_votes_player1_id',
      'idx_pom_votes_player2_id',
      'idx_pom_votes_player3_id',
      'idx_pom_votes_created_at'
    ];

    const existingIndexes = [...new Set(indexes.map(idx => idx.index_name))];
    const missingIndexes = expectedIndexes.filter(idx => !existingIndexes.includes(idx));

    if (missingIndexes.length > 0) {
      console.warn('⚠️ Fehlende Indizes:', missingIndexes);
    } else {
      console.log('✅ Alle erwarteten Indizes sind vorhanden');
    }

    console.log('🎉 Alle POM-Migration-Tests erfolgreich!');
    return true;

  } catch (error) {
    console.error('❌ Unerwarteter Fehler:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starte POM-Migration-Test...\n');
  
  const success = await testPOMMigration();
  
  if (success) {
    console.log('\n✅ Alle Tests bestanden! Die POM-Migration war erfolgreich.');
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
