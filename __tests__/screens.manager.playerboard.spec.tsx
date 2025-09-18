import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import PlayerboardManager from '@/screens/manager/Playerboard_manager';
import { getClubTeams, getClubTeamPlayerCounts } from '@/lib/api/club';

// Mock the API
jest.mock('@/lib/api/club');
jest.mock('@/contexts/AuthProvider');
jest.mock('expo-router');
jest.mock('react-native-safe-area-context');

const mockGetClubTeams = getClubTeams as jest.MockedFunction<typeof getClubTeams>;
const mockGetClubTeamPlayerCounts = getClubTeamPlayerCounts as jest.MockedFunction<typeof getClubTeamPlayerCounts>;

describe('Manager Playerboard Screen', () => {
  const mockUser = {
    id: '1',
    name: 'Manager User',
    role: 'manager',
    clubId: 'club1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useAuth
    jest.doMock('@/contexts/AuthProvider', () => ({
      useAuth: () => ({
        user: mockUser,
      }),
    }));
  });

  it('should load club teams with player counts', async () => {
    const mockTeams = [
      { id: 'team1', name: 'Team A', sport: 'Football', club_id: 'club1' },
      { id: 'team2', name: 'Team B', sport: 'Basketball', club_id: 'club1' },
    ];

    mockGetClubTeams.mockResolvedValue(mockTeams);
    mockGetClubTeamPlayerCounts.mockResolvedValue({ count: 15 });

    const { getByText } = render(<PlayerboardManager />);

    await waitFor(() => {
      expect(mockGetClubTeams).toHaveBeenCalledWith('club1');
      expect(getByText('Team A')).toBeTruthy();
      expect(getByText('Team B')).toBeTruthy();
      expect(getByText('15 Players')).toBeTruthy();
    });
  });

  it('should navigate to team players when team is tapped', async () => {
    const mockTeams = [
      { id: 'team1', name: 'Team A', sport: 'Football', club_id: 'club1' },
    ];

    mockGetClubTeams.mockResolvedValue(mockTeams);
    mockGetClubTeamPlayerCounts.mockResolvedValue({ count: 15 });

    const mockRouter = {
      push: jest.fn(),
    };

    jest.doMock('expo-router', () => ({
      useRouter: () => mockRouter,
    }));

    const { getByText } = render(<PlayerboardManager />);

    await waitFor(() => {
      const teamCard = getByText('Team A');
      fireEvent.press(teamCard);
      
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/(manager)/team/[id]/players',
        params: { id: 'team1', teamName: 'Team A' }
      });
    });
  });

  it('should display empty state when no teams', async () => {
    mockGetClubTeams.mockResolvedValue([]);

    const { getByText } = render(<PlayerboardManager />);

    await waitFor(() => {
      expect(getByText('No teams found for this club.')).toBeTruthy();
    });
  });

  it('should show team sport information', async () => {
    const mockTeams = [
      { id: 'team1', name: 'Team A', sport: 'Football', club_id: 'club1' },
    ];

    mockGetClubTeams.mockResolvedValue(mockTeams);
    mockGetClubTeamPlayerCounts.mockResolvedValue({ count: 15 });

    const { getByText } = render(<PlayerboardManager />);

    await waitFor(() => {
      expect(getByText('Football')).toBeTruthy();
    });
  });

  it('should handle multiple teams with different player counts', async () => {
    const mockTeams = [
      { id: 'team1', name: 'Team A', sport: 'Football', club_id: 'club1' },
      { id: 'team2', name: 'Team B', sport: 'Basketball', club_id: 'club1' },
    ];

    mockGetClubTeams.mockResolvedValue(mockTeams);
    
    // Mock different player counts for each team
    mockGetClubTeamPlayerCounts
      .mockResolvedValueOnce({ count: 15 })
      .mockResolvedValueOnce({ count: 8 });

    const { getByText } = render(<PlayerboardManager />);

    await waitFor(() => {
      expect(getByText('15 Players')).toBeTruthy();
      expect(getByText('8 Players')).toBeTruthy();
    });
  });
});
