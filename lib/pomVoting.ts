import { supabase } from './supabaseClient';

/**
 * POM Voting Interfaces
 */
export interface POMMatch {
  id: string;
  title: string;
  event_date: string;
  end_time: string | null;
  team_id: string;
  is_eligible: boolean; // Within 48h and not voted yet
}

export interface POMPlayer {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  position: string | null;
  jersey_number: number | null;
  user_points: number;
}

export interface POMVote {
  id: string;
  match_id: string;
  voter_id: string;
  player1_id: string;
  player2_id: string | null;
  player3_id: string | null;
  created_at: string;
}

export interface POMVoteInput {
  match_id: string;
  player1_id: string;
  player2_id?: string | null;
  player3_id?: string | null;
}

/**
 * Get all past matches for POM voting (no time restrictions)
 * @param userId - Current user ID
 * @returns Array of all past matches
 */
export async function getEligiblePOMMatches(userId: string): Promise<POMMatch[]> {
  try {
    console.log('🏆 Lade alle vergangenen POM-Matches für User:', userId);

    // Get user's team
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('team_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('❌ Fehler beim Laden des Users:', userError);
      throw userError;
    }

    // Get all past matches (no time restrictions)
    const { data: matches, error: matchesError } = await supabase
      .from('events')
      .select('id, title, event_date, end_time, team_id')
      .eq('team_id', user.team_id)
      .eq('event_type', 'match')
      .lt('event_date', new Date().toISOString())
      .order('event_date', { ascending: false });

    if (matchesError) {
      console.error('❌ Fehler beim Laden der Matches:', matchesError);
      throw matchesError;
    }

    // Check which matches the user has already voted for
    const matchIds = matches?.map(m => m.id) || [];
    const { data: existingVotes, error: votesError } = await supabase
      .from('pom_votes')
      .select('match_id')
      .eq('voter_id', userId)
      .in('match_id', matchIds);

    if (votesError) {
      console.error('❌ Fehler beim Laden der Votes:', votesError);
      throw votesError;
    }

    const votedMatchIds = new Set(existingVotes?.map(v => v.match_id) || []);

    // Filter eligible matches (not voted yet)
    const eligibleMatches: POMMatch[] = (matches || []).map(match => ({
      id: match.id,
      title: match.title,
      event_date: match.event_date,
      end_time: match.end_time,
      team_id: match.team_id,
      is_eligible: !votedMatchIds.has(match.id)
    }));

    console.log(`✅ ${eligibleMatches.length} vergangene POM-Matches gefunden`);
    return eligibleMatches;

  } catch (error) {
    console.error('❌ Fehler beim Laden der vergangenen POM-Matches:', error);
    throw error;
  }
}

/**
 * Get players for a specific match
 * @param matchId - Match ID
 * @returns Array of players in the match team
 */
export async function getPOMMatchPlayers(matchId: string): Promise<POMPlayer[]> {
  try {
    console.log('👥 Lade Spieler für POM-Match:', matchId);

    // Get match details to find team
    const { data: match, error: matchError } = await supabase
      .from('events')
      .select('team_id')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      console.error('❌ Fehler beim Laden des Matches:', matchError);
      throw matchError;
    }

    // Get team players
    const { data: players, error: playersError } = await supabase
      .from('users')
      .select('id, name, first_name, last_name, position, jersey_number, user_points')
      .eq('team_id', match.team_id)
      .eq('role', 'player')
      .order('jersey_number', { ascending: true });

    if (playersError) {
      console.error('❌ Fehler beim Laden der Spieler:', playersError);
      throw playersError;
    }

    const pomPlayers: POMPlayer[] = (players || []).map(player => ({
      id: player.id,
      name: player.name,
      first_name: player.first_name,
      last_name: player.last_name,
      position: player.position,
      jersey_number: player.jersey_number,
      user_points: player.user_points || 0
    }));

    console.log(`✅ ${pomPlayers.length} Spieler für POM-Match gefunden`);
    return pomPlayers;

  } catch (error) {
    console.error('❌ Fehler beim Laden der POM-Match-Spieler:', error);
    throw error;
  }
}

/**
 * Submit a POM vote
 * @param userId - Current user ID
 * @param voteData - Vote data
 * @returns Created vote
 */
export async function submitPOMVote(userId: string, voteData: POMVoteInput): Promise<POMVote> {
  try {
    console.log('🗳️ Submitting POM vote:', { userId, voteData });

    // Validate that the user hasn't already voted for this match
    const { data: existingVote, error: existingError } = await supabase
      .from('pom_votes')
      .select('id')
      .eq('match_id', voteData.match_id)
      .eq('voter_id', userId)
      .single();

    if (existingVote) {
      throw new Error('You have already voted for this match');
    }

    // Validate that the match exists and is a past match
    const { data: match, error: matchError } = await supabase
      .from('events')
      .select('event_date, end_time')
      .eq('id', voteData.match_id)
      .single();

    if (matchError || !match) {
      console.error('❌ Fehler beim Laden des Matches:', matchError);
      throw matchError;
    }

    // Check if match is in the past (no time restrictions for voting)
    const matchEndTime = match.end_time || match.event_date;
    if (new Date(matchEndTime) >= new Date()) {
      throw new Error('Cannot vote for future matches');
    }

    // Validate that all selected players belong to the match team
    const { data: matchTeam, error: teamError } = await supabase
      .from('events')
      .select('team_id')
      .eq('id', voteData.match_id)
      .single();

    if (teamError || !matchTeam) {
      console.error('❌ Fehler beim Laden des Match-Teams:', teamError);
      throw teamError;
    }

    const playerIds = [voteData.player1_id, voteData.player2_id, voteData.player3_id].filter(Boolean);
    const { data: players, error: playersError } = await supabase
      .from('users')
      .select('id')
      .eq('team_id', matchTeam.team_id)
      .in('id', playerIds);

    if (playersError || !players || players.length !== playerIds.length) {
      throw new Error('One or more selected players do not belong to the match team');
    }

    // Create the vote
    const { data: vote, error: voteError } = await supabase
      .from('pom_votes')
      .insert({
        match_id: voteData.match_id,
        voter_id: userId,
        player1_id: voteData.player1_id,
        player2_id: voteData.player2_id || null,
        player3_id: voteData.player3_id || null
      })
      .select()
      .single();

    if (voteError) {
      console.error('❌ Fehler beim Erstellen des POM-Votes:', voteError);
      throw voteError;
    }

    console.log('✅ POM-Vote erfolgreich erstellt:', vote.id);
    return vote;

  } catch (error) {
    console.error('❌ Fehler beim Submitting des POM-Votes:', error);
    throw error;
  }
}

/**
 * Get POM voting results for a match
 * @param matchId - Match ID
 * @returns Voting results
 */
export async function getPOMVotingResults(matchId: string): Promise<{
  match_id: string;
  match_title: string;
  event_date: string;
  total_votes: number;
  player1_name: string | null;
  player1_points: number | null;
  player2_name: string | null;
  player2_points: number | null;
  player3_name: string | null;
  player3_points: number | null;
}[]> {
  try {
    console.log('📊 Lade POM-Voting-Ergebnisse für Match:', matchId);

    const { data: results, error } = await supabase
      .from('pom_voting_results')
      .select('*')
      .eq('match_id', matchId);

    if (error) {
      console.error('❌ Fehler beim Laden der POM-Voting-Ergebnisse:', error);
      throw error;
    }

    console.log(`✅ POM-Voting-Ergebnisse geladen: ${results?.length || 0} Ergebnisse`);
    return results || [];

  } catch (error) {
    console.error('❌ Fehler beim Laden der POM-Voting-Ergebnisse:', error);
    throw error;
  }
}

/**
 * Get user's POM voting history
 * @param userId - User ID
 * @returns Array of user's votes
 */
export async function getUserPOMVotes(userId: string): Promise<POMVote[]> {
  try {
    console.log('📋 Lade POM-Voting-Historie für User:', userId);

    const { data: votes, error } = await supabase
      .from('pom_votes')
      .select('*')
      .eq('voter_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Fehler beim Laden der POM-Voting-Historie:', error);
      throw error;
    }

    console.log(`✅ ${votes?.length || 0} POM-Votes für User gefunden`);
    return votes || [];

  } catch (error) {
    console.error('❌ Fehler beim Laden der POM-Voting-Historie:', error);
    throw error;
  }
}

/**
 * Get top players by POM points
 * @param teamId - Team ID
 * @param limit - Number of top players to return
 * @returns Array of top players
 */
export async function getTopPOMPointsPlayers(teamId: string, limit: number = 10): Promise<POMPlayer[]> {
  try {
    console.log('🏆 Lade Top POM-Punkte-Spieler für Team:', teamId);

    const { data: players, error } = await supabase
      .from('users')
      .select('id, name, first_name, last_name, position, jersey_number, user_points')
      .eq('team_id', teamId)
      .eq('role', 'player')
      .order('user_points', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Fehler beim Laden der Top POM-Punkte-Spieler:', error);
      throw error;
    }

    const topPlayers: POMPlayer[] = (players || []).map(player => ({
      id: player.id,
      name: player.name,
      first_name: player.first_name,
      last_name: player.last_name,
      position: player.position,
      jersey_number: player.jersey_number,
      user_points: player.user_points || 0
    }));

    console.log(`✅ ${topPlayers.length} Top POM-Punkte-Spieler gefunden`);
    return topPlayers;

  } catch (error) {
    console.error('❌ Fehler beim Laden der Top POM-Punkte-Spieler:', error);
    throw error;
  }
}
