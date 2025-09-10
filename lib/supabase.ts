// Re-export the supabase client from the safe client file
import { supabase } from './supabaseClient';
import { storage } from './storage';
export { supabase };

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
  const { data, error } = await supabase
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
  
  if (error) throw error;
  
  if (!data) {
    throw new Error('User profile not found. Please contact your administrator.');
  }
  
  return data;
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
  const { data, error } = await supabase
    .from('access_codes')
    .select('id, code, description')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .or('expires_at.is.null,expires_at.gt.now()')
    .maybeSingle();
  
  if (error) {
    console.error('Error validating access code:', error);
    throw new Error('Unable to validate access code');
  }
  
  return !!data; // Returns true if valid code found
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

export const getClubTeams = async (clubId: string) => {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('club_id', clubId)
    .order('name');
  
  if (error) throw error;
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
    .eq('team_id', teamId);

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

export const getClubStats = async (clubId: string) => {
  console.log('🏢 getClubStats called for clubId:', clubId);
  
  // Get all teams in the club
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id')
    .eq('club_id', clubId);

  if (teamsError) throw teamsError;

  const teamIds = teams.map(t => t.id);

  // Get aggregated stats for all teams
  const { data: matchResults, error: matchError } = await supabase
    .from('match_results')
    .select('id, team_score, opponent_score')
    .in('team_id', teamIds);

  if (matchError) throw matchError;

  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id')
    .in('team_id', teamIds);

  if (playersError) throw playersError;

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, event_type, event_date')
    .in('team_id', teamIds);

  if (eventsError) throw eventsError;

  console.log('🏢 getClubStats - Raw data fetched:', {
    teams: teams?.length || 0,
    teamIds,
    matchResults: matchResults?.length || 0,
    players: players?.length || 0,
    events: events?.length || 0,
    sampleMatchResult: matchResults?.[0]
  });

  // Calculate total goals by summing team_score from all matches
  const totalGoals = matchResults.reduce((sum, match) => {
    const teamScore = match.team_score || 0;
    
    console.log('⚽ Club match goals calculation:', {
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
    totalTeams: teams.length,
    upcomingEvents,
    trainings: events.filter(e => e.event_type === 'training').length,
  };

  console.log('🏢 getClubStats - Final result:', result);
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

// Comment types
export type Comment = {
  id: string;
  post_id: string;
  content: string;
  author_id: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at?: string;
};

export type CreateCommentDto = {
  postId: string;
  content: string;
};

// Get comments for a post
export const getPostComments = async (postId: string): Promise<Comment[]> => {
  console.log('Getting comments for post:', postId);
  
  const { data, error } = await supabase
    .from('post_comments')
    .select(`
      id,
      post_id,
      content,
      author_id,
      created_at,
      updated_at,
      author:users!post_comments_author_id_fkey (
        id,
        name,
        email
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching post comments:', error);
    throw new Error(`Failed to fetch comments: ${error.message}`);
  }

  console.log('Comments fetched successfully:', data);
  
  // Transform the data to match our Comment type
  const transformedData = (data || []).map((comment: any) => ({
    ...comment,
    author: Array.isArray(comment.author) ? comment.author[0] : comment.author
  }));
  
  return transformedData;
};

// Create a new comment
export const createPostComment = async (dto: CreateCommentDto): Promise<Comment> => {
  console.log('Creating comment:', dto);
  
  const { data, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: dto.postId,
      content: dto.content.trim(),
    })
    .select(`
      id,
      post_id,
      content,
      author_id,
      created_at,
      updated_at,
      author:users!post_comments_author_id_fkey (
        id,
        name,
        email
      )
    `)
    .single();

  if (error) {
    console.error('Error creating post comment:', error);
    throw new Error(`Failed to create comment: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to create comment: No data returned');
  }

  console.log('Comment created successfully:', data);
  
  // Transform the data to match our Comment type
  const transformedData = {
    ...data,
    author: Array.isArray(data.author) ? data.author[0] : data.author
  };
  
  return transformedData;
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
  role?: 'admin' | 'trainer' | 'player' | 'parent';
}) => {
  console.log('📝 Updating user profile:', { userId, updates });

  // Validate required fields
  if (!userId) {
    throw new Error('User ID is required for profile update');
  }

  // Filter out undefined values to avoid sending them to the backend
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  );

  if (Object.keys(cleanUpdates).length === 0) {
    throw new Error('No valid updates provided');
  }

  const { data, error } = await supabase
    .from('users')
    .update(cleanUpdates)
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
    throw new Error(`Profile update failed: ${error.message}`);
  }

  if (!data) {
    throw new Error('Profile update failed: No data returned from server');
  }

  console.log('✅ User profile updated successfully:', data);
  return data;
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
  role?: 'player' | 'trainer' | 'admin' | 'parent';
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