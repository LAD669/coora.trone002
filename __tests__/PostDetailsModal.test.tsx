import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import InfohubScreen from '@/app/(app)/(tabs)/index';

// Mock the required modules
jest.mock('@/contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'infoHub': 'Info Hub',
        'createUpdate': 'Create Update',
        'postDetails': 'Post Details',
        'close': 'Close',
        'cancel': 'Cancel',
        'organization': 'Organization',
        'teams': 'Teams',
        'tapToReadMore': 'Tap to read more',
        'error': 'Error',
        'postNotFound': 'Post not found',
        'loading': 'Loading...',
        'reactions': 'Reactions',
        'somethingWentWrong': 'Something went wrong',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('@/lib/supabase', () => ({
  getTeamPosts: jest.fn().mockResolvedValue([
    {
      id: 'test-post-1',
      title: 'Test Post Title',
      content: 'This is a test post content that is longer than 150 characters to test the truncation functionality and the read more feature.',
      created_at: '2024-01-01T00:00:00Z',
      post_type: 'organization',
      image_url: null,
      post_reactions: [],
    },
    {
      id: 'test-post-2',
      title: 'Another Test Post',
      content: 'Short content',
      created_at: '2024-01-02T00:00:00Z',
      post_type: 'teams',
      image_url: 'https://example.com/image.jpg',
      post_reactions: [
        { user_id: 'user1', emoji: '👍' },
        { user_id: 'user2', emoji: '❤️' },
      ],
    },
  ]),
  createPost: jest.fn(),
  addPostReaction: jest.fn(),
  removePostReaction: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('PostDetailsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render post list correctly', async () => {
    render(<InfohubScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Post Title')).toBeTruthy();
      expect(screen.getByText('Another Test Post')).toBeTruthy();
    });
  });

  it('should show "Tap to read more" for long posts', async () => {
    render(<InfohubScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Tap to read more')).toBeTruthy();
    });
  });

  it('should open modal when post is pressed', async () => {
    render(<InfohubScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Post Title')).toBeTruthy();
    });
    
    // Find and press the post
    const postElement = screen.getByText('Test Post Title');
    fireEvent.press(postElement.parent?.parent || postElement);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Post Details')).toBeTruthy();
    });
  });

  it('should display full post content in modal', async () => {
    render(<InfohubScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Post Title')).toBeTruthy();
    });
    
    // Press the post to open modal
    const postElement = screen.getByText('Test Post Title');
    fireEvent.press(postElement.parent?.parent || postElement);
    
    // Check if full content is displayed in modal
    await waitFor(() => {
      expect(screen.getByText(/This is a test post content that is longer than 150 characters/)).toBeTruthy();
    });
  });

  it('should close modal when close button is pressed', async () => {
    render(<InfohubScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Post Title')).toBeTruthy();
    });
    
    // Open modal
    const postElement = screen.getByText('Test Post Title');
    fireEvent.press(postElement.parent?.parent || postElement);
    
    await waitFor(() => {
      expect(screen.getByText('Post Details')).toBeTruthy();
    });
    
    // Close modal
    const closeButton = screen.getByText('Close');
    fireEvent.press(closeButton);
    
    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText('Post Details')).toBeNull();
    });
  });

  it('should display post reactions in modal', async () => {
    render(<InfohubScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Another Test Post')).toBeTruthy();
    });
    
    // Press the post with reactions
    const postElement = screen.getByText('Another Test Post');
    fireEvent.press(postElement.parent?.parent || postElement);
    
    await waitFor(() => {
      expect(screen.getByText('Post Details')).toBeTruthy();
      expect(screen.getByText('Reactions')).toBeTruthy();
    });
  });

  it('should handle post not found error', async () => {
    render(<InfohubScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Post Title')).toBeTruthy();
    });
    
    // Simulate clicking a post that doesn't exist
    // This would happen if the post list changed between render and click
    const postElement = screen.getByText('Test Post Title');
    
    // Mock the posts array to be empty to simulate post not found
    const originalFind = Array.prototype.find;
    Array.prototype.find = jest.fn().mockReturnValue(undefined);
    
    fireEvent.press(postElement.parent?.parent || postElement);
    
    // Check if error alert is shown
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Post not found');
    
    // Restore original find method
    Array.prototype.find = originalFind;
  });

  it('should test modal functionality with test button', async () => {
    render(<InfohubScreen />);
    
    // Find and press the test button
    const testButton = screen.getByText('Test Modal');
    fireEvent.press(testButton);
    
    // Modal should open with test content
    await waitFor(() => {
      expect(screen.getByText('Post Details')).toBeTruthy();
      expect(screen.getByText('Test Post')).toBeTruthy();
    });
  });

  it('should display modal state correctly in debug view', async () => {
    render(<InfohubScreen />);
    
    // Check initial state
    expect(screen.getByText('Modal Visible: false')).toBeTruthy();
    expect(screen.getByText('Selected Post: none')).toBeTruthy();
    
    // Press test button
    const testButton = screen.getByText('Test Modal');
    fireEvent.press(testButton);
    
    // Check updated state
    await waitFor(() => {
      expect(screen.getByText('Modal Visible: true')).toBeTruthy();
      expect(screen.getByText('Selected Post: Test Post')).toBeTruthy();
    });
  });
});
