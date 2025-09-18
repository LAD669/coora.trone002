import { useQuery } from '@tanstack/react-query';
import { getClubStats, getClubPosts, getClubEvents, getClubTeams, getClubTeamPlayerCounts } from '@/lib/api/club';

// Query key factory for club-level data
export const clubQueryKeys = {
  all: ['club'] as const,
  stats: (clubId: string, role: 'manager' | 'user') => ['club', 'stats', clubId, role] as const,
  posts: (clubId: string, postType: 'organization' | 'coach', role: 'manager' | 'user') => 
    ['club', 'posts', clubId, postType, role] as const,
  events: (clubId: string, startDate?: string, endDate?: string, role: 'manager' | 'user') => 
    ['club', 'events', clubId, startDate, endDate, role] as const,
  teams: (clubId: string, role: 'manager' | 'user') => ['club', 'teams', clubId, role] as const,
  teamPlayerCounts: (teamId: string, role: 'manager' | 'user') => 
    ['club', 'teamPlayerCounts', teamId, role] as const,
};

/**
 * Hook to fetch club statistics
 */
export function useClubStats(clubId: string, role: 'manager' | 'user' = 'user') {
  return useQuery({
    queryKey: clubQueryKeys.stats(clubId, role),
    queryFn: () => getClubStats(clubId),
    enabled: !!clubId,
    staleTime: 60_000, // 1 minute
    gcTime: 300_000, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch club posts
 */
export function useClubPosts(
  clubId: string, 
  postType: 'organization' | 'coach' = 'organization',
  role: 'manager' | 'user' = 'user'
) {
  return useQuery({
    queryKey: clubQueryKeys.posts(clubId, postType, role),
    queryFn: () => getClubPosts(clubId, postType),
    enabled: !!clubId,
    staleTime: 60_000, // 1 minute
    gcTime: 300_000, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch club events with optional date filtering
 */
export function useClubEvents(
  clubId: string,
  startDate?: string,
  endDate?: string,
  role: 'manager' | 'user' = 'user'
) {
  return useQuery({
    queryKey: clubQueryKeys.events(clubId, startDate, endDate, role),
    queryFn: () => getClubEvents(clubId, startDate, endDate),
    enabled: !!clubId,
    staleTime: 60_000, // 1 minute
    gcTime: 300_000, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch club teams
 */
export function useClubTeams(clubId: string, role: 'manager' | 'user' = 'user') {
  return useQuery({
    queryKey: clubQueryKeys.teams(clubId, role),
    queryFn: () => getClubTeams(clubId),
    enabled: !!clubId,
    staleTime: 60_000, // 1 minute
    gcTime: 300_000, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch player count for a specific team
 */
export function useClubTeamPlayerCounts(teamId: string, role: 'manager' | 'user' = 'user') {
  return useQuery({
    queryKey: clubQueryKeys.teamPlayerCounts(teamId, role),
    queryFn: () => getClubTeamPlayerCounts(teamId),
    enabled: !!teamId,
    staleTime: 60_000, // 1 minute
    gcTime: 300_000, // 5 minutes
    retry: 1,
  });
}
