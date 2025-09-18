import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import DashboardManager from '@/screens/manager/Dashboard_manager';
import { getClubStats } from '@/lib/api/club';

// Mock the API
jest.mock('@/lib/api/club');
jest.mock('@/contexts/AuthProvider');
jest.mock('expo-router');
jest.mock('react-native-safe-area-context');

const mockGetClubStats = getClubStats as jest.MockedFunction<typeof getClubStats>;

describe('Manager Dashboard Screen', () => {
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

  it('should display club statistics cards', async () => {
    const mockStats = {
      memberCount: 45,
      teamCount: 3,
      upcomingEventsCount: 8,
    };

    mockGetClubStats.mockResolvedValue(mockStats);

    const { getByText } = render(<DashboardManager />);

    await waitFor(() => {
      expect(mockGetClubStats).toHaveBeenCalledWith('club1');
      expect(getByText('45')).toBeTruthy(); // member count
      expect(getByText('3')).toBeTruthy(); // team count
      expect(getByText('8')).toBeTruthy(); // upcoming events
    });
  });

  it('should show default zero values when stats are empty', async () => {
    const mockStats = {
      memberCount: 0,
      teamCount: 0,
      upcomingEventsCount: 0,
    };

    mockGetClubStats.mockResolvedValue(mockStats);

    const { getByText } = render(<DashboardManager />);

    await waitFor(() => {
      expect(getByText('0')).toBeTruthy();
      expect(getByText('Total Members')).toBeTruthy();
      expect(getByText('Total Teams')).toBeTruthy();
      expect(getByText('Upcoming Events')).toBeTruthy();
    });
  });

  it('should display welcome message with manager name', async () => {
    mockGetClubStats.mockResolvedValue({
      memberCount: 0,
      teamCount: 0,
      upcomingEventsCount: 0,
    });

    const { getByText } = render(<DashboardManager />);

    await waitFor(() => {
      expect(getByText('Welcome Back, Manager User!')).toBeTruthy();
      expect(getByText('Club Manager')).toBeTruthy();
    });
  });

  it('should show loading state initially', () => {
    mockGetClubStats.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { getByText } = render(<DashboardManager />);

    expect(getByText('Loading...')).toBeTruthy();
  });

  it('should handle API errors gracefully', async () => {
    mockGetClubStats.mockRejectedValue(new Error('API Error'));

    const { getByText } = render(<DashboardManager />);

    await waitFor(() => {
      // Should show default zero values even on error
      expect(getByText('0')).toBeTruthy();
    });
  });

  it('should display all stat card types', async () => {
    const mockStats = {
      memberCount: 25,
      teamCount: 2,
      upcomingEventsCount: 5,
    };

    mockGetClubStats.mockResolvedValue(mockStats);

    const { getByText } = render(<DashboardManager />);

    await waitFor(() => {
      expect(getByText('Total Members')).toBeTruthy();
      expect(getByText('Total Teams')).toBeTruthy();
      expect(getByText('Upcoming Events')).toBeTruthy();
      expect(getByText('Active Trainings')).toBeTruthy();
    });
  });
});
