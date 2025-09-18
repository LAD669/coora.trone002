import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import KalenderManager from '@/screens/manager/Kalender_manager';
import { getClubEvents } from '@/lib/api/club';

// Mock the API
jest.mock('@/lib/api/club');
jest.mock('@/contexts/AuthProvider');
jest.mock('expo-router');
jest.mock('react-native-safe-area-context');

const mockGetClubEvents = getClubEvents as jest.MockedFunction<typeof getClubEvents>;

describe('Manager Calendar Screen', () => {
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

  it('should load club events for current month', async () => {
    const mockEvents = [
      {
        id: '1',
        title: 'Team Training',
        event_type: 'training',
        event_date: '2024-01-15T10:00:00Z',
        location: 'Sports Center',
        team_id: 'team1',
        created_by: 'trainer1',
        requires_response: true,
        is_repeating: false,
      },
    ];

    mockGetClubEvents.mockResolvedValue(mockEvents);

    const { getByText } = render(<KalenderManager />);

    await waitFor(() => {
      // Should call with current month date range
      expect(mockGetClubEvents).toHaveBeenCalledWith(
        'club1',
        expect.stringMatching(/2024-01-01/),
        expect.stringMatching(/2024-01-31/)
      );
    });
  });

  it('should navigate to previous month and reload events', async () => {
    mockGetClubEvents.mockResolvedValue([]);

    const { getByText } = render(<KalenderManager />);

    // Click previous month button
    const prevButton = getByText('<'); // Assuming ChevronLeft renders as '<'
    fireEvent.press(prevButton);

    await waitFor(() => {
      // Should call with previous month date range
      expect(mockGetClubEvents).toHaveBeenCalledWith(
        'club1',
        expect.stringMatching(/2023-12-01/),
        expect.stringMatching(/2023-12-31/)
      );
    });
  });

  it('should navigate to next month and reload events', async () => {
    mockGetClubEvents.mockResolvedValue([]);

    const { getByText } = render(<KalenderManager />);

    // Click next month button
    const nextButton = getByText('>'); // Assuming ChevronRight renders as '>'
    fireEvent.press(nextButton);

    await waitFor(() => {
      // Should call with next month date range
      expect(mockGetClubEvents).toHaveBeenCalledWith(
        'club1',
        expect.stringMatching(/2024-02-01/),
        expect.stringMatching(/2024-02-29/)
      );
    });
  });

  it('should display events for selected date', async () => {
    const mockEvents = [
      {
        id: '1',
        title: 'Match Day',
        event_type: 'match',
        event_date: '2024-01-15T15:00:00Z',
        location: 'Stadium',
        team_id: 'team1',
        created_by: 'trainer1',
        requires_response: true,
        is_repeating: false,
      },
    ];

    mockGetClubEvents.mockResolvedValue(mockEvents);

    const { getByText } = render(<KalenderManager />);

    await waitFor(() => {
      expect(getByText('Match Day')).toBeTruthy();
      expect(getByText('Stadium')).toBeTruthy();
    });
  });

  it('should show empty state when no events', async () => {
    mockGetClubEvents.mockResolvedValue([]);

    const { getByText } = render(<KalenderManager />);

    await waitFor(() => {
      expect(getByText('No events scheduled')).toBeTruthy();
    });
  });

  it('should handle event creation modal', async () => {
    mockGetClubEvents.mockResolvedValue([]);

    const { getByText } = render(<KalenderManager />);

    // Open create event modal
    fireEvent.press(getByText('+'));

    await waitFor(() => {
      expect(getByText('Create Event')).toBeTruthy();
    });
  });
});
