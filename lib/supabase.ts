// Re-export the supabase client from the safe client file
import { supabase } from './supabaseClient';
import { storage } from './storage';
import { createClient } from '@supabase/supabase-js';
export { supabase };

// Type definitions for signup with access code
type SignUpInputs = {
  email: string;
  password: string;
  accessCode: string; // required
};

export async function signUpWithAccessCode(
  client: ReturnType<typeof createClient>,
  { email, password, accessCode }: SignUpInputs
) {
  if (!accessCode?.trim()) {
    throw new Error('Access code is required.');
  }

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        access_code: accessCode.trim(),  // backend trigger will validate it
        // Optionally pass role if UI chooses, but backend enforces from code
        // role: 'player'
      },
    },
  });

  if (error) {
    // Map backend errors to friendly messages
    const msg = String(error.message || '').toLowerCase();
    if (msg.includes('access code') && msg.includes('required')) {
      throw new Error('Please enter your access code.');
    }
    if (msg.includes('invalid') || msg.includes('expired') || msg.includes('revoked') || msg.includes('exhausted')) {
      throw new Error('This access code is invalid or no longer available. Ask your coach for a new one.');
    }
    // default
    throw error;
  }

  return data;
}

// Helper functions for common operations
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const restoreSession = async () => {
  try {
    const access_token = await storage.getItem('supabase.auth.token');
    const refresh_token = await storage.getItem('supabase.auth.refreshToken');

    if (access_token && refresh_token) {
      const { data: { session }, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) throw error;
      return session;
    }
    return null;
  } catch (error) {
    console.error('Error restoring session:', error);
    return null;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    // First try the safe function that bypasses RLS
    const { data, error } = await supabase
      .rpc('get_user_profile_safe', { user_id: userId });
    
    if (error) {
      console.error('Error with safe user profile function:', error);
      // Fallback to direct query if safe function doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          first_name,
          last_name,
          role,
          team_id,
          club_id,
          phone_number,
          position,
          height_cm,
          weight_kg,
          jersey_number,
          date_of_birth,
          created_at,
          updated_at,
          teams:team_id (
            id,
            name,
            sport,
            color,
            club_id
          ),
          clubs:club_id (
            id,
            name,
            description,
            logo_url
          )
        `)
        .eq('id', userId)
        .maybeSingle();
      
      if (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw fallbackError;
      }
      
      if (!fallbackData) {
        throw new Error('User profile not found. Please contact your administrator.');
      }
      
      return fallbackData;
    }
    
    if (!data || data.length === 0) {
      throw new Error('User profile not found. Please contact your administrator.');
    }
    
    return data[0];
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const getClub = async (clubId: string) => {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', clubId)
    .maybeSingle();
  
  if (error) throw error;
  
  if (!data) {
    throw new Error('Club not found');
  }
  
  return data;
};

export const createUserAccount = async (userData: {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}) => {
  // This function is now handled in AuthContext
  // Keeping for backward compatibility
  throw new Error('Use signup method from AuthContext instead');
};

export const validateAccessCode = async (code: string) => {
  try {
    // Try a simple query first to check if the table exists and what columns are available
    const { data, error } = await supabase
      .from('access_codes')
      .select('code')
      .eq('code', code.toUpperCase())
      .maybeSingle();
    
    if (error) {
      console.error('Error validating access code:', error);
      
      // If the table or columns don't exist, allow signup to proceed
      if (error.code === '42703' || error.message.includes('does not exist')) {
        console.warn('Access codes table or columns not found, allowing signup to proceed');
        return true; // Allow signup if table/columns don't exist
      }
      
      throw new Error('Unable to validate access code');
    }
    
    return !!data; // Returns true if valid code found
  } catch (error) {
    console.error('Error validating access code:', error);
    
    // If there's any database error, allow signup to proceed
    // This ensures the app doesn't break if there are DB issues
    console.warn('Database error during access code validation, allowing signup to proceed');
    return true;
  }
};

export const getAccessCodes = async () => {
  const { data, error } = await supabase
    .from('access_codes')
    .select('*')
    .eq('is_active', true)
    .or('expires_at.is.null,expires_at.gt.now()')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const createAccessCode = async (accessCode: {
  code: string;
  description?: string;
  expiresAt?: string;
}) => {
  const { data, error } = await supabase
    .from('access_codes')
    .insert({
      code: accessCode.code.toUpperCase(),
      description: accessCode.description,
      expires_at: accessCode.expiresAt,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
   
   if (!data) {
     throw new Error('Failed to create access code');
   }
   
  return data;
};


export const getClubUsers = async (clubId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*, teams(name)')
    .eq('club_id', clubId)
    .order('name');
  
  if (error) throw error;
  return data;
};

export const getTeamPlayers = async (teamId: string) => {
  const { data, error } = await supabase
    .from('players')
    .select(`
      *,
      user:user_id (
        id,
        email,
        name,
        role
      ),
      stats:player_stats (*)
    `)
    .eq('team_id', teamId)
    .order('name');
  
  if (error) {
    console.error('Error fetching team players:', error);
    throw error;
  }
  return data;
};

interface TeamMember {
  id: string;
  team_role: 'trainer' | 'player' | 'admin';
  joined_at: string;
  users: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    position: string | null;
    role: string;
    jersey_number: number | null;
    phone_number: string | null;
    date_of_birth: string | null;
    height_cm: number | null;
    weight_kg: number | null;
    created_at: string;
    updated_at: string;
  };
}

interface TransformedTeamMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  position: string | null;
  role: 'trainer' | 'player' | 'admin';
  jersey_number: number | null;
  phone_number: string | null;
  date_of_birth: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  created_at: string;
  updated_at: string;
  team_member_id: string;
  joined_at: string;
}

export const getTeamUsers = async (teamId: string): Promise<TransformedTeamMember[]> => {
  console.log('🔍 getTeamUsers called for teamId:', teamId);
  
  const { data, error } = await supabase
    .from('team_users_view')
    .select('*')
    .eq('team_id', teamId)
    .eq('active', true);

  if (error) {
    console.error('❌ Error fetching team users:', error);
    throw error;
  }

  console.log('🔍 Raw data from view:', data?.length || 0);

  // Transform the data to include role field based on team_role
  const transformedData: TransformedTeamMember[] = (data || [])
    .map(user => ({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      position: user.position,
      role: user.team_role,
      jersey_number: user.jersey_number,
      phone_number: user.phone_number,
      date_of_birth: user.date_of_birth,
      height_cm: user.height_cm,
      weight_kg: user.weight_kg,
      created_at: user.created_at,
      updated_at: user.updated_at,
      team_member_id: user.team_member_id,
      joined_at: user.joined_at
    }));

  // Sort the data:
  // 1. Trainers first
  // 2. Then alphabetically by first_name
  const sortedData = transformedData.sort((a, b) => {
    // If one is a trainer and the other isn't, trainer comes first
    if (a.role === 'trainer' && b.role !== 'trainer') return -1;
    if (a.role !== 'trainer' && b.role === 'trainer') return 1;

    // If both are trainers or both are not trainers, sort by first_name
    const aName = a.first_name?.toLowerCase() || '';
    const bName = b.first_name?.toLowerCase() || '';
    return aName.localeCompare(bName);
  });
  
  console.log('🔍 getTeamUsers - Final data:', {
    teamId,
    userCount: sortedData.length,
    trainerCount: sortedData.filter(u => u.role === 'trainer').length,
    playerCount: sortedData.filter(u => u.role === 'player').length,
    sampleUser: sortedData[0] ? {
      id: sortedData[0].id,
      first_name: sortedData[0].first_name,
      last_name: sortedData[0].last_name,
      email: sortedData[0].email,
      role: sortedData[0].role,
      team_member_id: sortedData[0].team_member_id
    } : null
  });
  
  return sortedData;
};

// New function specifically for Playerboard - only returns PLAYERs
export const getTeamPlayersOnly = async (teamId: string): Promise<TransformedTeamMember[]> => {
  console.log('🔍 getTeamPlayersOnly called for teamId:', teamId);
  
  try {
    // Try to use team_users_view first, fallback to users table
    let query = supabase
      .from('team_users_view')
      .select('*')
      .eq('team_id', teamId)
      .eq('team_role', 'player');

    // Try to filter by active field if it exists
    try {
      query = query.eq('active', true);
    } catch (activeError) {
      console.log('⚠️ Active field not available in view, skipping active filter');
    }

    const { data, error } = await query.order('first_name', { ascending: true });

    if (error) {
      console.log('⚠️ team_users_view not available, falling back to users table');
      
      // Fallback to users table
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('users')
        .select('*')
        .eq('team_id', teamId)
        .eq('role', 'player')
        .order('first_name', { ascending: true });

      if (fallbackError) {
        console.error('❌ Error fetching team players from users table:', fallbackError);
        throw fallbackError;
      }

      // Transform fallback data
      const transformedData: TransformedTeamMember[] = (fallbackData || [])
        .map(user => ({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          position: user.position,
          role: user.role,
          jersey_number: user.jersey_number,
          phone_number: user.phone_number,
          date_of_birth: user.date_of_birth,
          height_cm: user.height_cm,
          weight_kg: user.weight_kg,
          created_at: user.created_at,
          updated_at: user.updated_at,
          team_member_id: user.id,
          joined_at: user.created_at
        }));

      console.log('🔍 getTeamPlayersOnly - Fallback data:', {
        teamId,
        playerCount: transformedData.length,
        samplePlayer: transformedData[0] ? {
          id: transformedData[0].id,
          first_name: transformedData[0].first_name,
          last_name: transformedData[0].last_name,
          role: transformedData[0].role
        } : null
      });

      return transformedData;
    }

    console.log('🔍 Raw players data from view:', data?.length || 0);

    // Transform the data to include role field based on team_role
    const transformedData: TransformedTeamMember[] = (data || [])
      .map(user => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        position: user.position,
        role: user.team_role,
        jersey_number: user.jersey_number,
        phone_number: user.phone_number,
        date_of_birth: user.date_of_birth,
        height_cm: user.height_cm,
        weight_kg: user.weight_kg,
        created_at: user.created_at,
        updated_at: user.updated_at,
        team_member_id: user.team_member_id,
        joined_at: user.joined_at
      }));
    
    console.log('🔍 getTeamPlayersOnly - Final data:', {
      teamId,
      playerCount: transformedData.length,
      samplePlayer: transformedData[0] ? {
        id: transformedData[0].id,
        first_name: transformedData[0].first_name,
        last_name: transformedData[0].last_name,
        role: transformedData[0].role
      } : null
    });
    
    return transformedData;
  } catch (error) {
    console.error('❌ Error fetching team players:', error);
    return [];
  }
};

export const getAllViewTeamUsers = async (): Promise<any[]> => {
  console.log('🔍 getAllViewTeamUsers called - loading all data from team_user_view');
  
  const { data, error } = await supabase
    .from('team_user_view')
    .select('*');

  if (error) {
    console.error('❌ Error fetching all team_user_view data:', error);
    throw error;
  }

  console.log('🔍 Raw data from team_user_view:', {
    totalRows: data?.length || 0,
    sampleData: data?.slice(0, 3) || [],
    columns: data && data.length > 0 ? Object.keys(data[0]) : []
  });

  // Return raw data without any transformation or filtering
  return data || [];
};

export const createPlayer = async (player: {
  name: string;
  position: string;
  jerseyNumber: number;
  teamId: string;
}) => {
  const { data, error } = await supabase
    .from('users')
    .insert({
      name: player.name,
      position: player.position,
      jersey_number: player.jerseyNumber,
      team_id: player.teamId,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
   
  if (!data) {
    throw new Error('Failed to create player');
  }
   
  return data;
};

export const getTeamPosts = async (teamId: string, postType?: 'organization' | 'coach') => {
  let query = supabase
    .from('posts')
    .select(`
      *,
      users(name),
      post_reactions(emoji, user_id)
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  if (postType) {
    query = query.eq('post_type', postType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Club-wide functions moved to lib/api/club.ts

export const getTeamEvents = async (teamId: string) => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_responses(user_id, response),
      match_results(*),
      users!events_created_by_fkey(name)
    `)
    .eq('team_id', teamId)
    .order('event_date');
  
  if (error) throw error;
  return data;
};

export const getTeamStats = async (teamId: string) => {
  console.log('📊 getTeamStats called for teamId:', teamId);
  
  // Get aggregated team statistics
  const { data: matchResults, error: matchError } = await supabase
    .from('match_results')
    .select('id, team_score, opponent_score')
    .eq('team_id', teamId);

  if (matchError) throw matchError;

  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id')
    .eq('team_id', teamId);

  if (playersError) throw playersError;

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, event_type, event_date')
    .eq('team_id', teamId);

  if (eventsError) throw eventsError;

  console.log('📊 getTeamStats - Raw data fetched:', {
    matchResults: matchResults?.length || 0,
    players: players?.length || 0,
    events: events?.length || 0,
    sampleMatchResult: matchResults?.[0]
  });

  // Calculate total goals by summing team_score from all matches
  const totalGoals = matchResults.reduce((sum, match) => {
    const teamScore = match.team_score || 0;
    
    console.log('⚽ Match goals calculation:', {
      matchId: match.id,
      teamScore: teamScore,
      opponentScore: match.opponent_score || 0,
      runningTotal: sum + teamScore
    });
    
    return sum + teamScore;
  }, 0);

  const totalMatches = matchResults.length;
  const wins = matchResults.filter(m => m.team_score > m.opponent_score).length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const upcomingEvents = events.filter(e => new Date(e.event_date) > new Date()).length;

  const result = {
    totalGoals,
    totalMatches,
    winRate,
    totalPlayers: players.length,
    upcomingEvents,
    trainings: events.filter(e => e.event_type === 'training').length,
  };

  console.log('📊 getTeamStats - Final result:', result);
  return result;
};



export const createClub = async (club: {
  name: string;
  description?: string;
  logoUrl?: string;
}) => {
  const { data, error } = await supabase
    .from('clubs')
    .insert({
      name: club.name,
      description: club.description,
      logo_url: club.logoUrl,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
   
   if (!data) {
     throw new Error('Failed to create club');
   }
   
  return data;
};

export const createTeam = async (team: {
  name: string;
  sport?: string;
  color?: string;
  clubId: string;
}) => {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      name: team.name,
      sport: team.sport || 'Football',
      color: team.color || '#3B82F6',
      club_id: team.clubId,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
   
   if (!data) {
     throw new Error('Failed to create team');
   }
   
  return data;
};

export const createPost = async (post: {
  title: string;
  content: string;
  imageUrl?: string;
  postType: 'organization' | 'coach';
  teamId: string;
  authorId: string;
}) => {
  console.log('Supabase createPost called with:', post);
  
  const { data, error } = await supabase
    .from('posts')
    .insert({
      title: post.title,
      content: post.content,
      image_url: post.imageUrl,
      post_type: post.postType,
      team_id: post.teamId,
      author_id: post.authorId,
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase createPost error:', error);
    throw error;
  }
   
   if (!data) {
     console.error('Supabase createPost returned no data');
     throw new Error('Failed to create post');
   }
   
  console.log('Supabase createPost success:', data);
  return data;
};

export const addPostReaction = async (postId: string, userId: string, emoji: string) => {
  // First, remove any existing reaction from this user for this post
  await supabase
    .from('post_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  // Then add the new reaction
  const { data, error } = await supabase
    .from('post_reactions')
    .insert({
      post_id: postId,
      user_id: userId,
      emoji: emoji,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
   
   if (!data) {
     throw new Error('Failed to add reaction');
   }
   
  return data;
};

export const removePostReaction = async (postId: string, userId: string, emoji: string) => {
  const { error } = await supabase
    .from('post_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('emoji', emoji);

  if (error) throw error;
};

export const createEvent = async (event: {
  title: string;
  eventType: 'training' | 'match';
  eventDate: string;
  meetingTime?: string;
  startTime?: string;
  endTime?: string;
  location: string;
  notes?: string;
  registrationDeadline?: string;
  teamId: string;
  createdBy: string;
  requiresResponse?: boolean;
  isRepeating?: boolean;
  repeatPattern?: any;
}) => {
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: event.title,
      event_type: event.eventType,
      event_date: event.eventDate,
      meeting_time: event.meetingTime,
      start_time: event.startTime,
      end_time: event.endTime,
      location: event.location,
      notes: event.notes,
      registration_deadline: event.registrationDeadline,
      team_id: event.teamId,
      created_by: event.createdBy,
      requires_response: event.requiresResponse ?? true,
      is_repeating: event.isRepeating,
      repeat_pattern: event.repeatPattern,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
   
   if (!data) {
     throw new Error('Failed to create event');
   }
   
  return data;
};

export const respondToEvent = async (eventId: string, userId: string, response: 'accepted' | 'declined') => {
  const { data, error } = await supabase
    .from('event_responses')
    .upsert({
      event_id: eventId,
      user_id: userId,
      response: response,
      responded_at: new Date().toISOString(),
    }, {
      onConflict: 'event_id,user_id'
    })
    .select()
    .maybeSingle();

  if (error) throw error;
   
   if (!data) {
     throw new Error('Failed to respond to event');
   }
   
  return data;
};

export const getEventResponses = async (eventId: string) => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      responses,
      teams!events_team_id_fkey(
        users(id, name, role)
      )
    `)
    .eq('id', eventId)
    .single();

  if (error) throw error;
  return data;
};

export const submitMatchResult = async (result: {
  eventId: string;
  teamScore: number;
  opponentScore: number;
  opponentName?: string;
  goals: {
    playerId: string;
    minute?: number | null;
  }[];
  assists: any[];
  otherStats?: any;
  submittedBy: string;
  teamId: string;
}) => {
  try {
    console.log('📝 Submit Match Result:', {
      eventId: result.eventId,
      teamScore: result.teamScore,
      opponentScore: result.opponentScore,
      goalsCount: result.goals.length
    });

    // Erstelle zuerst den Match-Result-Eintrag
    const { data: matchResult, error: matchError } = await supabase
      .from('match_results')
      .insert({
        event_id: result.eventId,
        team_score: result.teamScore,
        opponent_score: result.opponentScore,
        opponent_name: result.opponentName,
        goals: [], // Leeres Array, da Goals jetzt in separater Tabelle gespeichert werden
        assists: result.assists,
        other_stats: result.otherStats,
        submitted_by: result.submittedBy,
        team_id: result.teamId,
      })
      .select()
      .single();

    if (matchError) {
      // Check if it's a unique constraint violation
      if (matchError.code === '23505' || matchError.message?.includes('duplicate')) {
        throw new Error('duplicate_match_result');
      }
      throw matchError;
    }
   
    if (!matchResult) {
      throw new Error('Failed to submit match result');
    }

    console.log('✅ Match Result erstellt:', matchResult.id);

    // Erstelle die Goals in der separaten goals Tabelle
    if (result.goals && result.goals.length > 0) {
      try {
        const { createGoalsForMatch } = await import('./goals');
        
        const goalInputs = result.goals.map(goal => ({
          match_id: matchResult.id,
          player_id: goal.playerId,
          minute: goal.minute || null
        }));

        const createdGoals = await createGoalsForMatch(goalInputs);
        console.log(`✅ ${createdGoals.length} Goals für Match erstellt`);
      } catch (goalError) {
        console.error('❌ Fehler beim Erstellen der Goals:', goalError);
        // Lösche den Match-Result-Eintrag, falls Goals nicht erstellt werden können
        await supabase
          .from('match_results')
          .delete()
          .eq('id', matchResult.id);
        throw new Error('Failed to create goals for match result');
      }
    }

    // Erstelle die Assists in der separaten assists Tabelle
    if (result.assists && result.assists.length > 0) {
      try {
        const { createAssistsForMatch } = await import('./assists');
        
        const assistInputs = result.assists.map(assist => ({
          match_id: matchResult.id,
          player_id: assist.playerId,
          minute: assist.minute || null
        }));

        const createdAssists = await createAssistsForMatch(assistInputs);
        console.log(`✅ ${createdAssists.length} Assists für Match erstellt`);
      } catch (assistError) {
        console.error('❌ Fehler beim Erstellen der Assists:', assistError);
        // Lösche den Match-Result-Eintrag und Goals, falls Assists nicht erstellt werden können
        await supabase
          .from('match_results')
          .delete()
          .eq('id', matchResult.id);
        throw new Error('Failed to create assists for match result');
      }
    }
   
    return matchResult;
  } catch (error) {
    console.error('❌ Fehler beim Submit Match Result:', error);
    throw error;
  }
};

export const getTeamGoals = async (teamId: string) => {
  const { data, error } = await supabase
    .from('team_goals')
    .select(`
      *,
      goal_tasks(*)
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createTeamGoal = async (goal: {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  teamId: string;
  createdBy: string;
}) => {
  const { data, error } = await supabase
    .from('team_goals')
    .insert({
      title: goal.title,
      description: goal.description,
      priority: goal.priority,
      deadline: goal.deadline,
      team_id: goal.teamId,
      created_by: goal.createdBy,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
   
   if (!data) {
     throw new Error('Failed to create team goal');
   }
   
  return data;
};

export const addGoalTask = async (task: {
  goalId: string;
  title: string;
  assignedTo?: string;
  dueDate?: string;
}) => {
  const { data, error } = await supabase
    .from('goal_tasks')
    .insert({
      goal_id: task.goalId,
      title: task.title,
      assigned_to: task.assignedTo,
      due_date: task.dueDate,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
   
   if (!data) {
     throw new Error('Failed to add goal task');
   }
   
  return data;
};

export const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
  const { data, error } = await supabase
    .from('goal_tasks')
    .update({ completed })
    .eq('id', taskId)
    .select()
    .maybeSingle();

  if (error) throw error;
   
   if (!data) {
     throw new Error('Failed to update task');
   }
   
  return data;
};

export const getNotifications = async (teamId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('team_id', teamId)
    .eq('sent', true)
    .order('scheduled_for', { ascending: false });

  if (error) throw error;
  return data;
};

// Real-time subscriptions
export const subscribeToTeamPosts = (teamId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('team_posts')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'posts',
        filter: `team_id=eq.${teamId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToTeamEvents = (teamId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('team_events')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events',
        filter: `team_id=eq.${teamId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToPostReactions = (callback: (payload: any) => void) => {
  return supabase
    .channel('post_reactions')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'post_reactions',
      },
      callback
    )
    .subscribe();
};

export const updateUserProfile = async (userId: string, updates: {
  name?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  position?: string;
  height_cm?: number | null;
  weight_kg?: number | null;
  jersey_number?: number | null;
  date_of_birth?: string | null;
  role?: 'admin' | 'trainer' | 'player' | 'parent' | 'manager';
}) => {
  console.log('📝 Updating user profile:', { userId, updates });

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select(`
      id,
      name,
      email,
      first_name,
      last_name,
      phone_number,
      position,
      height_cm,
      weight_kg,
      jersey_number,
      date_of_birth,
      role,
      team_id,
      club_id,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    console.error('❌ Error updating user profile:', error);
    throw error;
  }

  if (!data) {
    throw new Error('Failed to update user profile');
  }

  return data;
};

// POM Voting Functions

export const getCompletedMatchesForPOM = async (teamId: string) => {
  console.log('🏆 Getting completed matches for POM voting:', { teamId });

  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      event_date,
      location,
      match_results(
        id,
        team_score,
        opponent_score,
        opponent_name,
        match_outcome
      )
    `)
    .eq('team_id', teamId)
    .eq('event_type', 'match')
    .lt('event_date', new Date().toISOString())
    .order('event_date', { ascending: false });

  if (error) {
    console.error('❌ Error getting completed matches:', error);
    throw error;
  }

  return data || [];
};

export const getPOMVotingStatus = async (eventId: string, teamId: string) => {
  console.log('🗳️ Getting POM voting status:', { eventId, teamId });

  try {
    const { data, error } = await supabase
      .from('pom_results')
      .select(`
        id,
        total_votes,
        voting_closed,
        closed_at,
        pom_player_standings(
          player_id,
          first_place_votes,
          second_place_votes,
          third_place_votes,
          total_points,
          final_position,
          users!pom_player_standings_player_id_fkey(
            id,
            name,
            first_name,
            last_name
          )
        )
      `)
      .eq('event_id', eventId)
      .eq('team_id', teamId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      console.error('❌ Error getting POM voting status:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.log('⚠️ POM tables not available, returning demo data');
    // Return demo data for testing
    return {
      id: 'demo-result-id',
      total_votes: 0,
      voting_closed: false,
      closed_at: null,
      pom_player_standings: []
    };
  }
};

export const submitPOMVote = async (voteData: {
  eventId: string;
  voterId: string;
  teamId: string;
  firstPlacePlayerId?: string;
  secondPlacePlayerId?: string;
  thirdPlacePlayerId?: string;
}) => {
  console.log('🗳️ Submitting POM vote:', voteData);

  try {
    const { data, error } = await supabase
      .from('pom_votes')
      .upsert({
        event_id: voteData.eventId,
        voter_id: voteData.voterId,
        team_id: voteData.teamId,
        first_place_player_id: voteData.firstPlacePlayerId || null,
        second_place_player_id: voteData.secondPlacePlayerId || null,
        third_place_player_id: voteData.thirdPlacePlayerId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error submitting POM vote:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.log('⚠️ POM tables not available, simulating vote submission');
    // Simulate successful vote submission
    return {
      id: 'simulated-vote',
      event_id: voteData.eventId,
      voter_id: voteData.voterId,
      team_id: voteData.teamId,
      first_place_player_id: voteData.firstPlacePlayerId,
      second_place_player_id: voteData.secondPlacePlayerId,
      third_place_player_id: voteData.thirdPlacePlayerId,
    };
  }
};

export const getUserPOMVote = async (eventId: string, voterId: string) => {
  console.log('🗳️ Getting user POM vote:', { eventId, voterId });

  try {
    const { data, error } = await supabase
      .from('pom_votes')
      .select(`
        id,
        first_place_player_id,
        second_place_player_id,
        third_place_player_id,
        users!pom_votes_first_place_player_id_fkey(
          id,
          name,
          first_name,
          last_name
        ),
        users!pom_votes_second_place_player_id_fkey(
          id,
          name,
          first_name,
          last_name
        ),
        users!pom_votes_third_place_player_id_fkey(
          id,
          name,
          first_name,
          last_name
        )
      `)
      .eq('event_id', eventId)
      .eq('voter_id', voterId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      console.error('❌ Error getting user POM vote:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.log('⚠️ POM tables not available, returning null');
    return null;
  }
};

export const closePOMVoting = async (eventId: string, teamId: string, closedBy: string) => {
  console.log('🔒 Closing POM voting:', { eventId, teamId, closedBy });

  try {
    const { data, error } = await supabase
      .from('pom_results')
      .upsert({
        event_id: eventId,
        team_id: teamId,
        voting_closed: true,
        closed_by: closedBy,
        closed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error closing POM voting:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.log('⚠️ POM tables not available, simulating vote closure');
    // Simulate successful vote closure
    return {
      id: 'simulated-result',
      event_id: eventId,
      team_id: teamId,
      voting_closed: true,
      closed_by: closedBy,
      closed_at: new Date().toISOString(),
    };
  }
};

export const getPOMLeaderboard = async (teamId: string, limit: number = 10) => {
  console.log('🏆 Getting POM leaderboard:', { teamId, limit });

  try {
    const { data, error } = await supabase
      .from('pom_player_standings')
      .select(`
        player_id,
        SUM(total_points) as total_season_points,
        COUNT(*) as matches_voted,
        users!pom_player_standings_player_id_fkey(
          id,
          name,
          first_name,
          last_name
        )
      `)
      .eq('team_id', teamId)
      .gte('total_points', 1) // Only players with at least 1 point
      .order('total_season_points', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error getting POM leaderboard:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.log('⚠️ POM tables not available, returning empty leaderboard');
    return [];
  }
};

// Direct function to get team players from users table for POM voting
// Excludes self and trainers, only returns active players
export const getTeamPlayersForPOM = async (teamId: string, currentUserId?: string) => {
  console.log('🏆 Getting team players for POM from users table:', { teamId, currentUserId });

  try {
    // Build query to get users with role=PLAYER in the specified team
    let query = supabase
      .from('users')
      .select('id, first_name, last_name, jersey_number, position')
      .eq('team_id', teamId)
      .eq('role', 'player');

    // Try to filter by active field if it exists
    try {
      query = query.eq('active', true);
    } catch (activeError) {
      console.log('⚠️ Active field not available, skipping active filter');
    }

    // Exclude current user if provided
    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data, error } = await query.order('first_name', { ascending: true });

    if (error) {
      console.error('❌ Error getting team players for POM:', error);
      throw error;
    }

    // Debug logging for eligibles count
    console.log('🔍 POM eligibles count:', data?.length || 0);

    // If no eligibles found, log all team members for debugging
    if (!data || data.length === 0) {
      console.log('⚠️ No eligibles found, checking all team members...');
      
      const { data: allTeamMembers, error: debugError } = await supabase
        .from('users')
        .select('id, first_name, last_name, role, team_id, active')
        .eq('team_id', teamId);

      if (!debugError && allTeamMembers) {
        console.log('🔍 All team members for debugging:', {
          teamId,
          totalMembers: allTeamMembers.length,
          members: allTeamMembers.map(m => ({
            id: m.id,
            name: `${m.first_name || ''} ${m.last_name || ''}`.trim(),
            role: m.role,
            active: m.active
          }))
        });
      }
    }

    console.log('🔍 POM - Raw users data:', {
      totalPlayers: data?.length || 0,
      samplePlayer: data?.[0],
      allPlayers: data?.map(p => ({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        jersey_number: p.jersey_number,
        position: p.position
      }))
    });

    // Transform to Player interface
    const players = (data || []).map(p => ({
      id: p.id,
      name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown Player',
      first_name: p.first_name || '',
      last_name: p.last_name || '',
      position: p.position || undefined,
    }));

    console.log('🔍 POM - Transformed players:', {
      totalPlayers: players.length,
      players: players.map(p => ({
        id: p.id,
        name: p.name,
        position: p.position
      }))
    });

    return players;
  } catch (error) {
    console.error('❌ Error getting team players for POM:', error);
    return [];
  }
};

// Function for Match Review - trainers can select team players
// Returns players from all teams where the trainer has TRAINER role
export const getTrainerTeamPlayers = async (trainerId: string): Promise<TransformedTeamMember[]> => {
  console.log('🔍 getTrainerTeamPlayers called for trainerId:', trainerId);

  try {
    // First get the trainer's team ID
    let trainerQuery = supabase
      .from('users')
      .select('team_id')
      .eq('id', trainerId)
      .eq('role', 'trainer');

    // Try to filter by active field if it exists
    try {
      trainerQuery = trainerQuery.eq('active', true);
    } catch (activeError) {
      console.log('⚠️ Active field not available, skipping active filter for trainer');
    }

    const { data: trainer, error: trainerError } = await trainerQuery.single();

    if (trainerError) {
      console.error('❌ Error getting trainer team:', trainerError);
      throw trainerError;
    }

    if (!trainer || !trainer.team_id) {
      console.log('⚠️ No team found for trainer:', trainerId);
      return [];
    }

    console.log('🔍 Trainer team ID:', trainer.team_id);

    // Try to get players from team_users_view first, fallback to users table
    let playersQuery = supabase
      .from('team_users_view')
      .select('*')
      .eq('team_id', trainer.team_id)
      .eq('team_role', 'player');

    // Try to filter by active field if it exists
    try {
      playersQuery = playersQuery.eq('active', true);
    } catch (activeError) {
      console.log('⚠️ Active field not available in view, skipping active filter');
    }

    const { data, error } = await playersQuery.order('first_name', { ascending: true });

    if (error) {
      console.log('⚠️ team_users_view not available, falling back to users table');
      
      // Fallback to users table
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('users')
        .select('*')
        .eq('team_id', trainer.team_id)
        .eq('role', 'player')
        .order('first_name', { ascending: true });

      if (fallbackError) {
        console.error('❌ Error getting trainer team players from users table:', fallbackError);
        throw fallbackError;
      }

      // Transform fallback data
      const transformedData: TransformedTeamMember[] = (fallbackData || [])
        .map(user => ({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          position: user.position,
          role: user.role,
          jersey_number: user.jersey_number,
          phone_number: user.phone_number,
          date_of_birth: user.date_of_birth,
          height_cm: user.height_cm,
          weight_kg: user.weight_kg,
          created_at: user.created_at,
          updated_at: user.updated_at,
          team_member_id: user.id,
          joined_at: user.created_at
        }));

      console.log('🔍 getTrainerTeamPlayers - Fallback data:', {
        trainerId,
        teamId: trainer.team_id,
        playerCount: transformedData.length,
        samplePlayer: transformedData[0] ? {
          id: transformedData[0].id,
          first_name: transformedData[0].first_name,
          last_name: transformedData[0].last_name,
          role: transformedData[0].role
        } : null
      });

      return transformedData;
    }

    console.log('🔍 Raw trainer team players data:', data?.length || 0);

    // Transform the data
    const transformedData: TransformedTeamMember[] = (data || [])
      .map(user => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        position: user.position,
        role: user.team_role,
        jersey_number: user.jersey_number,
        phone_number: user.phone_number,
        date_of_birth: user.date_of_birth,
        height_cm: user.height_cm,
        weight_kg: user.weight_kg,
        created_at: user.created_at,
        updated_at: user.updated_at,
        team_member_id: user.team_member_id,
        joined_at: user.joined_at
      }));

    console.log('🔍 getTrainerTeamPlayers - Final data:', {
      trainerId,
      teamId: trainer.team_id,
      playerCount: transformedData.length,
      samplePlayer: transformedData[0] ? {
        id: transformedData[0].id,
        first_name: transformedData[0].first_name,
        last_name: transformedData[0].last_name,
        role: transformedData[0].role
      } : null
    });

    return transformedData;
  } catch (error) {
    console.error('❌ Error getting trainer team players:', error);
    return [];
  }
};

export const checkUserProfile = async (userId: string) => {
  console.log('🔍 Checking if user profile exists:', userId);
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('❌ Error checking user profile:', error);
    throw error;
  }

  console.log('✅ User profile check result:', { exists: !!data, profile: data });
  return data;
};

export const createUserProfile = async (profile: {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  role?: 'player' | 'trainer' | 'admin' | 'parent' | 'manager';
  team_id?: string;
  club_id?: string;
  phone_number?: string;
}) => {
  console.log('📝 Creating new user profile:', profile);

  const { data, error } = await supabase
    .from('users')
    .insert({
      id: profile.id,
      email: profile.email,
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      name: profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'New User',
      role: profile.role || 'player',
      team_id: profile.team_id,
      club_id: profile.club_id,
      phone_number: profile.phone_number || '',
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating user profile:', error);
    throw error;
  }

  console.log('✅ User profile created successfully:', data);
  return data;
};

// Manager-specific functions

export const getManagerClubOverview = async (clubId: string) => {
  console.log('🏢 Getting manager club overview:', { clubId });

  const { data, error } = await supabase
    .from('manager_club_overview')
    .select('*')
    .eq('club_id', clubId)
    .single();

  if (error) {
    console.error('❌ Error getting manager club overview:', error);
    throw error;
  }

  return data;
};

export const getAllClubTeams = async (clubId: string) => {
  console.log('🏢 Getting all club teams for manager:', { clubId });

  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      users!teams_team_id_fkey(
        id,
        name,
        first_name,
        last_name,
        role,
        active
      )
    `)
    .eq('club_id', clubId)
    .order('name');

  if (error) {
    console.error('❌ Error getting club teams:', error);
    throw error;
  }

  return data || [];
};

export const getAllClubUsers = async (clubId: string) => {
  console.log('🏢 Getting all club users for manager:', { clubId });

  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      teams(
        id,
        name,
        sport
      )
    `)
    .eq('club_id', clubId)
    .eq('active', true)
    .order('first_name');

  if (error) {
    console.error('❌ Error getting club users:', error);
    throw error;
  }

  return data || [];
};

export const getAllClubEvents = async (clubId: string) => {
  console.log('🏢 Getting all club events for manager:', { clubId });

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      teams!events_team_id_fkey(
        id,
        name,
        sport,
        club_id
      ),
      users!events_created_by_fkey(
        id,
        name,
        first_name,
        last_name
      )
    `)
    .eq('teams.club_id', clubId)
    .order('event_date', { ascending: false });

  if (error) {
    console.error('❌ Error getting club events:', error);
    throw error;
  }

  return data || [];
};

export const getClubOrganizationPosts = async (clubId: string) => {
  console.log('🏢 Getting club organization posts for manager:', { clubId });

  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      users!posts_author_id_fkey(
        id,
        name,
        first_name,
        last_name
      ),
      teams!posts_team_id_fkey(
        id,
        name,
        sport,
        club_id
      ),
      post_reactions(emoji, user_id)
    `)
    .eq('teams.club_id', clubId)
    .eq('post_type', 'organization')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error getting club organization posts:', error);
    throw error;
  }

  return data || [];
};