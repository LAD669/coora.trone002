import { supabase } from './supabaseClient';

/**
 * Assist-Interface für TypeScript
 */
export interface Assist {
  id: string;
  match_id: string;
  player_id: string;
  minute: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Assist mit Spieler-Details
 */
export interface AssistWithPlayerDetails extends Assist {
  player_name: string;
  first_name: string | null;
  last_name: string | null;
  team_score: number;
  opponent_score: number;
  opponent_name: string | null;
  match_title: string;
  match_date: string;
  team_name: string;
}

/**
 * Assist-Input für die Erstellung
 */
export interface AssistInput {
  match_id: string;
  player_id: string;
  minute?: number | null;
}

/**
 * Erstellt einen neuen Assist-Eintrag
 * @param assistData - Die Assist-Daten
 * @returns Der erstellte Assist
 */
export async function createAssist(assistData: AssistInput): Promise<Assist> {
  try {
    console.log('🎯 Erstelle neuen Assist:', {
      match_id: assistData.match_id,
      player_id: assistData.player_id,
      minute: assistData.minute
    });

    const { data: assist, error } = await supabase
      .from('assists')
      .insert({
        match_id: assistData.match_id,
        player_id: assistData.player_id,
        minute: assistData.minute || null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Fehler beim Erstellen des Assists:', error);
      throw error;
    }

    if (!assist) {
      throw new Error('Assist konnte nicht erstellt werden');
    }

    console.log('✅ Assist erfolgreich erstellt:', assist.id);
    return assist;

  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Assists:', error);
    throw error;
  }
}

/**
 * Erstellt mehrere Assists für einen Match
 * @param assists - Array von Assist-Inputs
 * @returns Array der erstellten Assists
 */
export async function createAssistsForMatch(assists: AssistInput[]): Promise<Assist[]> {
  try {
    console.log(`🎯 Erstelle ${assists.length} Assists für Match`);

    if (assists.length === 0) {
      return [];
    }

    const { data: createdAssists, error } = await supabase
      .from('assists')
      .insert(assists)
      .select();

    if (error) {
      console.error('❌ Fehler beim Erstellen der Assists:', error);
      throw error;
    }

    if (!createdAssists) {
      throw new Error('Assists konnten nicht erstellt werden');
    }

    console.log(`✅ ${createdAssists.length} Assists erfolgreich erstellt`);
    return createdAssists;

  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Assists:', error);
    throw error;
  }
}

/**
 * Lädt alle Assists für einen Match
 * @param matchId - Die Match-ID
 * @returns Array der Assists mit Spieler-Details
 */
export async function getAssistsForMatch(matchId: string): Promise<AssistWithPlayerDetails[]> {
  try {
    console.log('📊 Lade Assists für Match:', matchId);

    const { data: assists, error } = await supabase
      .from('assists_with_details')
      .select('*')
      .eq('match_id', matchId)
      .order('minute', { ascending: true });

    if (error) {
      console.error('❌ Fehler beim Laden der Assists:', error);
      throw error;
    }

    console.log(`✅ ${assists?.length || 0} Assists für Match geladen`);
    return assists || [];

  } catch (error) {
    console.error('❌ Fehler beim Laden der Assists:', error);
    throw error;
  }
}

/**
 * Lädt alle Assists für ein Team
 * @param teamId - Die Team-ID
 * @param limit - Maximale Anzahl der Assists (Standard: 100)
 * @returns Array der Assists mit Spieler-Details
 */
export async function getTeamAssists(teamId: string, limit: number = 100): Promise<AssistWithPlayerDetails[]> {
  try {
    console.log('📊 Lade Team-Assists für Team:', teamId);

    const { data: assists, error } = await supabase
      .from('assists_with_details')
      .select('*')
      .eq('team_id', teamId)
      .order('match_date', { ascending: false })
      .order('minute', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('❌ Fehler beim Laden der Team-Assists:', error);
      throw error;
    }

    console.log(`✅ ${assists?.length || 0} Team-Assists geladen`);
    return assists || [];

  } catch (error) {
    console.error('❌ Fehler beim Laden der Team-Assists:', error);
    throw error;
  }
}

/**
 * Lädt alle Assists eines Spielers
 * @param playerId - Die Spieler-ID
 * @param limit - Maximale Anzahl der Assists (Standard: 100)
 * @returns Array der Assists mit Spieler-Details
 */
export async function getPlayerAssists(playerId: string, limit: number = 100): Promise<AssistWithPlayerDetails[]> {
  try {
    console.log('📊 Lade Assists für Spieler:', playerId);

    const { data: assists, error } = await supabase
      .from('assists_with_details')
      .select('*')
      .eq('player_id', playerId)
      .order('match_date', { ascending: false })
      .order('minute', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('❌ Fehler beim Laden der Spieler-Assists:', error);
      throw error;
    }

    console.log(`✅ ${assists?.length || 0} Spieler-Assists geladen`);
    return assists || [];

  } catch (error) {
    console.error('❌ Fehler beim Laden der Spieler-Assists:', error);
    throw error;
  }
}

/**
 * Aktualisiert einen Assist
 * @param assistId - Die Assist-ID
 * @param updates - Die zu aktualisierenden Felder
 * @returns Der aktualisierte Assist
 */
export async function updateAssist(
  assistId: string,
  updates: Partial<Pick<Assist, 'player_id' | 'minute'>>
): Promise<Assist> {
  try {
    console.log('✏️ Aktualisiere Assist:', assistId, updates);

    const { data: assist, error } = await supabase
      .from('assists')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', assistId)
      .select()
      .single();

    if (error) {
      console.error('❌ Fehler beim Aktualisieren des Assists:', error);
      throw error;
    }

    if (!assist) {
      throw new Error('Assist konnte nicht aktualisiert werden');
    }

    console.log('✅ Assist erfolgreich aktualisiert:', assistId);
    return assist;

  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren des Assists:', error);
    throw error;
  }
}

/**
 * Löscht einen Assist
 * @param assistId - Die Assist-ID
 * @returns true wenn erfolgreich gelöscht
 */
export async function deleteAssist(assistId: string): Promise<boolean> {
  try {
    console.log('🗑️ Lösche Assist:', assistId);

    const { error } = await supabase
      .from('assists')
      .delete()
      .eq('id', assistId);

    if (error) {
      console.error('❌ Fehler beim Löschen des Assists:', error);
      throw error;
    }

    console.log('✅ Assist erfolgreich gelöscht:', assistId);
    return true;

  } catch (error) {
    console.error('❌ Fehler beim Löschen des Assists:', error);
    throw error;
  }
}

/**
 * Löscht alle Assists für einen Match
 * @param matchId - Die Match-ID
 * @returns Anzahl der gelöschten Assists
 */
export async function deleteAssistsForMatch(matchId: string): Promise<number> {
  try {
    console.log('🗑️ Lösche alle Assists für Match:', matchId);

    const { data: assists, error: fetchError } = await supabase
      .from('assists')
      .select('id')
      .eq('match_id', matchId);

    if (fetchError) {
      console.error('❌ Fehler beim Laden der Assists:', fetchError);
      throw fetchError;
    }

    if (!assists || assists.length === 0) {
      console.log('ℹ️ Keine Assists zum Löschen gefunden');
      return 0;
    }

    const { error: deleteError } = await supabase
      .from('assists')
      .delete()
      .eq('match_id', matchId);

    if (deleteError) {
      console.error('❌ Fehler beim Löschen der Assists:', deleteError);
      throw deleteError;
    }

    console.log(`✅ ${assists.length} Assists erfolgreich gelöscht`);
    return assists.length;

  } catch (error) {
    console.error('❌ Fehler beim Löschen der Assists:', error);
    throw error;
  }
}

/**
 * Lädt Assist-Statistiken für ein Team
 * @param teamId - Die Team-ID
 * @returns Assist-Statistiken
 */
export async function getTeamAssistStats(teamId: string): Promise<{
  totalAssists: number;
  assistsByPlayer: { player_id: string; player_name: string; assists: number }[];
  assistsByMatch: { match_id: string; match_title: string; assists: number }[];
}> {
  try {
    console.log('📊 Lade Assist-Statistiken für Team:', teamId);

    const { data: assists, error } = await supabase
      .from('assists_with_details')
      .select('*')
      .eq('team_id', teamId);

    if (error) {
      console.error('❌ Fehler beim Laden der Assist-Statistiken:', error);
      throw error;
    }

    if (!assists || assists.length === 0) {
      return {
        totalAssists: 0,
        assistsByPlayer: [],
        assistsByMatch: []
      };
    }

    // Assists pro Spieler
    const assistsByPlayer = assists.reduce((acc, assist) => {
      const existing = acc.find(p => p.player_id === assist.player_id);
      if (existing) {
        existing.assists++;
      } else {
        acc.push({
          player_id: assist.player_id,
          player_name: assist.player_name,
          assists: 1
        });
      }
      return acc;
    }, [] as { player_id: string; player_name: string; assists: number }[]);

    // Assists pro Match
    const assistsByMatch = assists.reduce((acc, assist) => {
      const existing = acc.find(m => m.match_id === assist.match_id);
      if (existing) {
        existing.assists++;
      } else {
        acc.push({
          match_id: assist.match_id,
          match_title: assist.match_title,
          assists: 1
        });
      }
      return acc;
    }, [] as { player_id: string; match_title: string; assists: number }[]);

    const stats = {
      totalAssists: assists.length,
      assistsByPlayer: assistsByPlayer.sort((a, b) => b.assists - a.assists),
      assistsByMatch: assistsByMatch.sort((a, b) => b.assists - a.assists)
    };

    console.log('✅ Assist-Statistiken erfolgreich geladen:', stats);
    return stats;

  } catch (error) {
    console.error('❌ Fehler beim Laden der Assist-Statistiken:', error);
    throw error;
  }
}
