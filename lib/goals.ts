import { supabase } from './supabaseClient';

/**
 * Goal-Interface für TypeScript
 */
export interface Goal {
  id: string;
  match_id: string;
  player_id: string;
  minute: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Goal mit Spieler-Details
 */
export interface GoalWithPlayerDetails extends Goal {
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
 * Goal-Input für die Erstellung
 */
export interface GoalInput {
  match_id: string;
  player_id: string;
  minute?: number | null;
}

/**
 * Erstellt einen neuen Goal-Eintrag
 * @param goalData - Die Goal-Daten
 * @returns Der erstellte Goal
 */
export async function createGoal(goalData: GoalInput): Promise<Goal> {
  try {
    console.log('⚽ Erstelle neuen Goal:', {
      match_id: goalData.match_id,
      player_id: goalData.player_id,
      minute: goalData.minute
    });

    const { data: goal, error } = await supabase
      .from('goals')
      .insert({
        match_id: goalData.match_id,
        player_id: goalData.player_id,
        minute: goalData.minute || null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Fehler beim Erstellen des Goals:', error);
      throw error;
    }

    if (!goal) {
      throw new Error('Goal konnte nicht erstellt werden');
    }

    console.log('✅ Goal erfolgreich erstellt:', goal.id);
    return goal;

  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Goals:', error);
    throw error;
  }
}

/**
 * Erstellt mehrere Goals für einen Match
 * @param goals - Array von Goal-Inputs
 * @returns Array der erstellten Goals
 */
export async function createGoalsForMatch(goals: GoalInput[]): Promise<Goal[]> {
  try {
    console.log(`⚽ Erstelle ${goals.length} Goals für Match`);

    if (goals.length === 0) {
      return [];
    }

    const { data: createdGoals, error } = await supabase
      .from('goals')
      .insert(goals)
      .select();

    if (error) {
      console.error('❌ Fehler beim Erstellen der Goals:', error);
      throw error;
    }

    if (!createdGoals) {
      throw new Error('Goals konnten nicht erstellt werden');
    }

    console.log(`✅ ${createdGoals.length} Goals erfolgreich erstellt`);
    return createdGoals;

  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Goals:', error);
    throw error;
  }
}

/**
 * Lädt alle Goals für einen Match
 * @param matchId - Die Match-ID
 * @returns Array der Goals mit Spieler-Details
 */
export async function getGoalsForMatch(matchId: string): Promise<GoalWithPlayerDetails[]> {
  try {
    console.log('📊 Lade Goals für Match:', matchId);

    const { data: goals, error } = await supabase
      .from('goals_with_details')
      .select('*')
      .eq('match_id', matchId)
      .order('minute', { ascending: true });

    if (error) {
      console.error('❌ Fehler beim Laden der Goals:', error);
      throw error;
    }

    console.log(`✅ ${goals?.length || 0} Goals für Match geladen`);
    return goals || [];

  } catch (error) {
    console.error('❌ Fehler beim Laden der Goals:', error);
    throw error;
  }
}

/**
 * Lädt alle Goals für ein Team
 * @param teamId - Die Team-ID
 * @param limit - Maximale Anzahl der Goals (Standard: 100)
 * @returns Array der Goals mit Spieler-Details
 */
export async function getTeamGoals(teamId: string, limit: number = 100): Promise<GoalWithPlayerDetails[]> {
  try {
    console.log('📊 Lade Team-Goals für Team:', teamId);

    const { data: goals, error } = await supabase
      .from('goals_with_details')
      .select('*')
      .eq('team_id', teamId)
      .order('match_date', { ascending: false })
      .order('minute', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('❌ Fehler beim Laden der Team-Goals:', error);
      throw error;
    }

    console.log(`✅ ${goals?.length || 0} Team-Goals geladen`);
    return goals || [];

  } catch (error) {
    console.error('❌ Fehler beim Laden der Team-Goals:', error);
    throw error;
  }
}

/**
 * Lädt alle Goals eines Spielers
 * @param playerId - Die Spieler-ID
 * @param limit - Maximale Anzahl der Goals (Standard: 100)
 * @returns Array der Goals mit Spieler-Details
 */
export async function getPlayerGoals(playerId: string, limit: number = 100): Promise<GoalWithPlayerDetails[]> {
  try {
    console.log('📊 Lade Goals für Spieler:', playerId);

    const { data: goals, error } = await supabase
      .from('goals_with_details')
      .select('*')
      .eq('player_id', playerId)
      .order('match_date', { ascending: false })
      .order('minute', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('❌ Fehler beim Laden der Spieler-Goals:', error);
      throw error;
    }

    console.log(`✅ ${goals?.length || 0} Spieler-Goals geladen`);
    return goals || [];

  } catch (error) {
    console.error('❌ Fehler beim Laden der Spieler-Goals:', error);
    throw error;
  }
}

/**
 * Aktualisiert einen Goal
 * @param goalId - Die Goal-ID
 * @param updates - Die zu aktualisierenden Felder
 * @returns Der aktualisierte Goal
 */
export async function updateGoal(
  goalId: string,
  updates: Partial<Pick<Goal, 'player_id' | 'minute'>>
): Promise<Goal> {
  try {
    console.log('✏️ Aktualisiere Goal:', goalId, updates);

    const { data: goal, error } = await supabase
      .from('goals')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .select()
      .single();

    if (error) {
      console.error('❌ Fehler beim Aktualisieren des Goals:', error);
      throw error;
    }

    if (!goal) {
      throw new Error('Goal konnte nicht aktualisiert werden');
    }

    console.log('✅ Goal erfolgreich aktualisiert:', goalId);
    return goal;

  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren des Goals:', error);
    throw error;
  }
}

/**
 * Löscht einen Goal
 * @param goalId - Die Goal-ID
 * @returns true wenn erfolgreich gelöscht
 */
export async function deleteGoal(goalId: string): Promise<boolean> {
  try {
    console.log('🗑️ Lösche Goal:', goalId);

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      console.error('❌ Fehler beim Löschen des Goals:', error);
      throw error;
    }

    console.log('✅ Goal erfolgreich gelöscht:', goalId);
    return true;

  } catch (error) {
    console.error('❌ Fehler beim Löschen des Goals:', error);
    throw error;
  }
}

/**
 * Löscht alle Goals für einen Match
 * @param matchId - Die Match-ID
 * @returns Anzahl der gelöschten Goals
 */
export async function deleteGoalsForMatch(matchId: string): Promise<number> {
  try {
    console.log('🗑️ Lösche alle Goals für Match:', matchId);

    const { data: goals, error: fetchError } = await supabase
      .from('goals')
      .select('id')
      .eq('match_id', matchId);

    if (fetchError) {
      console.error('❌ Fehler beim Laden der Goals:', fetchError);
      throw fetchError;
    }

    if (!goals || goals.length === 0) {
      console.log('ℹ️ Keine Goals zum Löschen gefunden');
      return 0;
    }

    const { error: deleteError } = await supabase
      .from('goals')
      .delete()
      .eq('match_id', matchId);

    if (deleteError) {
      console.error('❌ Fehler beim Löschen der Goals:', deleteError);
      throw deleteError;
    }

    console.log(`✅ ${goals.length} Goals erfolgreich gelöscht`);
    return goals.length;

  } catch (error) {
    console.error('❌ Fehler beim Löschen der Goals:', error);
    throw error;
  }
}

/**
 * Lädt Goal-Statistiken für ein Team
 * @param teamId - Die Team-ID
 * @returns Goal-Statistiken
 */
export async function getTeamGoalStats(teamId: string): Promise<{
  totalGoals: number;
  goalsByPlayer: { player_id: string; player_name: string; goals: number }[];
  goalsByMatch: { match_id: string; match_title: string; goals: number }[];
}> {
  try {
    console.log('📊 Lade Goal-Statistiken für Team:', teamId);

    const { data: goals, error } = await supabase
      .from('goals_with_details')
      .select('*')
      .eq('team_id', teamId);

    if (error) {
      console.error('❌ Fehler beim Laden der Goal-Statistiken:', error);
      throw error;
    }

    if (!goals || goals.length === 0) {
      return {
        totalGoals: 0,
        goalsByPlayer: [],
        goalsByMatch: []
      };
    }

    // Goals pro Spieler
    const goalsByPlayer = goals.reduce((acc, goal) => {
      const existing = acc.find(p => p.player_id === goal.player_id);
      if (existing) {
        existing.goals++;
      } else {
        acc.push({
          player_id: goal.player_id,
          player_name: goal.player_name,
          goals: 1
        });
      }
      return acc;
    }, [] as { player_id: string; player_name: string; goals: number }[]);

    // Goals pro Match
    const goalsByMatch = goals.reduce((acc, goal) => {
      const existing = acc.find(m => m.match_id === goal.match_id);
      if (existing) {
        existing.goals++;
      } else {
        acc.push({
          match_id: goal.match_id,
          match_title: goal.match_title,
          goals: 1
        });
      }
      return acc;
    }, [] as { match_id: string; match_title: string; goals: number }[]);

    const stats = {
      totalGoals: goals.length,
      goalsByPlayer: goalsByPlayer.sort((a, b) => b.goals - a.goals),
      goalsByMatch: goalsByMatch.sort((a, b) => b.goals - a.goals)
    };

    console.log('✅ Goal-Statistiken erfolgreich geladen:', stats);
    return stats;

  } catch (error) {
    console.error('❌ Fehler beim Laden der Goal-Statistiken:', error);
    throw error;
  }
}
