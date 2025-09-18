import { supabase } from '@/lib/supabase';

export type ClubStats = {
  memberCount: number;
  teamCount: number;
  upcomingEventsCount: number;
};

export type ClubPost = {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  post_type: 'organization' | 'coach';
  author_id: string;
  author_name?: string;
  created_at: string;
  likes?: number;
  comments?: number;
};

export type ClubEvent = {
  id: string;
  title: string;
  event_type: 'training' | 'match';
  event_date: string;
  meeting_time?: string;
  start_time?: string;
  end_time?: string;
  location: string;
  notes?: string;
  team_id: string;
  created_by: string;
  requires_response: boolean;
  responses?: any;
  is_repeating?: boolean;
  repeat_pattern?: any;
  parent_event_id?: string;
  event_responses?: any[];
};

export type ClubTeam = {
  id: string;
  name: string;
  sport?: string;
  color?: string;
  club_id: string;
  playerCount?: number;
};

/**
 * Get club-wide statistics
 */
export async function getClubStats(clubId: string): Promise<ClubStats> {
  // Get member count (players + trainers in the club)
  const { data: members, error: membersError } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('club_id', clubId)
    .in('role', ['player', 'trainer']);

  if (membersError) throw membersError;

  // Get team count
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id', { count: 'exact', head: true })
    .eq('club_id', clubId);

  if (teamsError) throw teamsError;

  // Get upcoming events count (next 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('club_id', clubId)
    .gte('event_date', new Date().toISOString())
    .lte('event_date', thirtyDaysFromNow.toISOString());

  if (eventsError) throw eventsError;

  return {
    memberCount: members?.length || 0,
    teamCount: teams?.length || 0,
    upcomingEventsCount: events?.length || 0,
  };
}

/**
 * Get club-wide posts (organization type only for managers)
 */
export async function getClubPosts(clubId: string, postType: 'organization' | 'coach' = 'organization'): Promise<ClubPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      users(name),
      post_reactions(emoji, user_id)
    `)
    .eq('club_id', clubId)
    .eq('post_type', postType)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get club-wide events with optional date filtering
 */
export async function getClubEvents(clubId: string, startDate?: string, endDate?: string): Promise<ClubEvent[]> {
  let query = supabase
    .from('events')
    .select(`
      *,
      teams(name, color)
    `)
    .eq('club_id', clubId)
    .order('event_date', { ascending: true });

  if (startDate) {
    query = query.gte('event_date', startDate);
  }
  if (endDate) {
    query = query.lte('event_date', endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Get all teams in a club
 */
export async function getClubTeams(clubId: string): Promise<ClubTeam[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('club_id', clubId)
    .order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Get player count for a specific team
 */
export async function getClubTeamPlayerCounts(teamId: string): Promise<{ count: number }> {
  const { data, error } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId)
    .eq('role', 'player');

  if (error) throw error;
  return { count: data?.length || 0 };
}
