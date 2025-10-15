import { supabase } from '@/lib/supabase';

export type ClubStats = {
  memberCount: number;
  teamCount: number;
  upcomingEventsCount: number;
};

export type DashboardCounts = {
  total_teams: number;
  active_events: number;
  upcoming_matches: number;
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
 * Get dashboard counts for manager screens (teams, events, matches)
 */
export async function getDashboardCounts(clubId: string): Promise<DashboardCounts> {
  try {
    const { data, error } = await supabase.rpc('get_dashboard_counts', { p_club_id: clubId });
    
    if (error) {
      console.warn(`getDashboardCounts RPC failed: ${error.message}`);
      // Return default values on error
      return {
        total_teams: 0,
        active_events: 0,
        upcoming_matches: 0,
      };
    }
    
    // data is an array with one row (returns table)
    const row = Array.isArray(data) ? data[0] : data;
    
    return {
      total_teams: Number(row?.total_teams ?? 0),
      active_events: Number(row?.active_events ?? 0),
      upcoming_matches: Number(row?.upcoming_matches ?? 0),
    };
  } catch (error) {
    console.error("getDashboardCounts failed:", error);
    // Return default values on error
    return {
      total_teams: 0,
      active_events: 0,
      upcoming_matches: 0,
    };
  }
}

/**
 * Get club-wide statistics using RPC function with automatic fallback
 */
export async function getClubStats(clubId: string): Promise<ClubStats> {
  try {
    const { data, error } = await supabase.rpc("get_club_stats", { p_club_id: clubId });
    
    if (error) {
      // Make error message more descriptive
      const details = (error as any).details || (error as any).hint || error.message || "unknown";
      console.warn(`getClubStats RPC failed: ${details}`);
      
      // Automatically fall back to manual computation
      console.log("Falling back to manual stats computation...");
      return await computeStatsFallback(clubId);
    }
    
    // data is an array with one row (returns table)
    const row = Array.isArray(data) ? data[0] : data;
    
    return {
      memberCount: Number(row?.member_count ?? 0),
      teamCount: Number(row?.team_count ?? 0),
      upcomingEventsCount: Number(row?.upcoming_events ?? 0),
    };
  } catch (error) {
    console.error("getClubStats failed completely:", error);
    // Final fallback to manual computation
    return await computeStatsFallback(clubId);
  }
}

/**
 * Fallback function to compute stats manually if RPC fails
 */
export async function computeStatsFallback(clubId: string): Promise<ClubStats> {
  try {
    const [{ data: users, error: usersError }, { data: teams, error: teamsError }, { data: events, error: eventsError }] = await Promise.all([
      supabase.from("users").select("id").eq("club_id", clubId).eq("active", true),
      supabase.from("teams").select("id").eq("club_id", clubId),
      supabase.from("events").select("id")
        .eq("club_id", clubId)
        .gte("event_date", new Date().toISOString())
        .lt("event_date", new Date(Date.now() + 30*864e5).toISOString()),
    ]);
    
    // Log any errors but don't fail completely
    if (usersError) console.warn("Error fetching users for stats:", usersError);
    if (teamsError) console.warn("Error fetching teams for stats:", teamsError);
    if (eventsError) console.warn("Error fetching events for stats:", eventsError);
    
    return {
      memberCount: users?.length ?? 0,
      teamCount: teams?.length ?? 0,
      upcomingEventsCount: events?.length ?? 0,
    };
  } catch (error) {
    console.error("Fallback stats computation failed:", error);
    // Return default values if everything fails
    return {
      memberCount: 0,
      teamCount: 0,
      upcomingEventsCount: 0,
    };
  }
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
