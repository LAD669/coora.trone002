import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import InfohubManager from '@/screens/manager/Infohub_manager';
import { getClubPosts } from '@/lib/api/club';

// Mock the API
jest.mock('@/lib/api/club');
jest.mock('@/contexts/AuthProvider');
jest.mock('expo-router');
jest.mock('react-native-safe-area-context');

const mockGetClubPosts = getClubPosts as jest.MockedFunction<typeof getClubPosts>;

describe('Manager Infohub Screen', () => {
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

  it('should load organization posts only', async () => {
    const mockPosts = [
      {
        id: '1',
        title: 'Club Announcement',
        content: 'Important club news',
        post_type: 'organization',
        author_name: 'Admin',
        created_at: '2024-01-01T00:00:00Z',
        likes: 5,
        comments: 2,
      },
    ];

    mockGetClubPosts.mockResolvedValue(mockPosts);

    const { getByText } = render(<InfohubManager />);

    await waitFor(() => {
      expect(mockGetClubPosts).toHaveBeenCalledWith('club1', 'organization');
      expect(getByText('Club Announcement')).toBeTruthy();
    });
  });

  it('should not show channel switcher', () => {
    const { queryByText } = render(<InfohubManager />);
    
    // Channel switcher should not be present in manager infohub
    expect(queryByText('Organization')).toBeNull();
    expect(queryByText('Coach')).toBeNull();
  });

  it('should display empty state when no posts', async () => {
    mockGetClubPosts.mockResolvedValue([]);

    const { getByText } = render(<InfohubManager />);

    await waitFor(() => {
      expect(getByText('No organization posts found.')).toBeTruthy();
    });
  });

  it('should handle post creation', async () => {
    mockGetClubPosts.mockResolvedValue([]);

    const { getByText, getByPlaceholderText } = render(<InfohubManager />);

    // Open create post modal
    fireEvent.press(getByText('+'));

    await waitFor(() => {
      expect(getByPlaceholderText('Post title')).toBeTruthy();
      expect(getByPlaceholderText('What\'s happening?')).toBeTruthy();
    });
  });

  it('should show post interactions (likes, comments)', async () => {
    const mockPosts = [
      {
        id: '1',
        title: 'Test Post',
        content: 'Test content',
        post_type: 'organization',
        author_name: 'Admin',
        created_at: '2024-01-01T00:00:00Z',
        likes: 10,
        comments: 5,
      },
    ];

    mockGetClubPosts.mockResolvedValue(mockPosts);

    const { getByText } = render(<InfohubManager />);

    await waitFor(() => {
      expect(getByText('10')).toBeTruthy(); // likes
      expect(getByText('5')).toBeTruthy(); // comments
    });
  });
});
