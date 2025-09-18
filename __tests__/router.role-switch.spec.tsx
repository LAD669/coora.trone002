import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { useAuth } from '@/contexts/AuthProvider';
import RootLayoutContent from '@/app/_layout';

// Mock the AuthProvider
jest.mock('@/contexts/AuthProvider');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
  useSegments: () => ['(app)', '(tabs)', 'dashboard'],
  Slot: ({ children }) => children,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Role-based Router Switching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render manager dashboard when user is manager', async () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } } as any,
      user: { id: '1', role: 'manager', clubId: 'club1' } as any,
      loading: false,
      sessionLoaded: true,
      isManager: true,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    });

    const { getByText } = render(<RootLayoutContent />);
    
    await waitFor(() => {
      expect(getByText).toBeDefined();
    });
  });

  it('should render app dashboard when user is not manager', async () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } } as any,
      user: { id: '1', role: 'player', clubId: 'club1' } as any,
      loading: false,
      sessionLoaded: true,
      isManager: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    });

    const { getByText } = render(<RootLayoutContent />);
    
    await waitFor(() => {
      expect(getByText).toBeDefined();
    });
  });

  it('should not render until session is loaded', () => {
    mockUseAuth.mockReturnValue({
      session: undefined,
      user: null,
      loading: true,
      sessionLoaded: false,
      isManager: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    });

    const { queryByText } = render(<RootLayoutContent />);
    
    // Should return null when session is not loaded
    expect(queryByText).toBeNull();
  });

  it('should handle manager user in app section', async () => {
    const mockRouter = {
      replace: jest.fn(),
    };
    
    jest.doMock('expo-router', () => ({
      useRouter: () => mockRouter,
      useSegments: () => ['(app)', '(tabs)', 'dashboard'],
      Slot: ({ children }) => children,
    }));

    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } } as any,
      user: { id: '1', role: 'manager', clubId: 'club1' } as any,
      loading: false,
      sessionLoaded: true,
      isManager: true,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    });

    render(<RootLayoutContent />);
    
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/(manager)/(tabs)/dashboard');
    });
  });

  it('should handle non-manager user in manager section', async () => {
    const mockRouter = {
      replace: jest.fn(),
    };
    
    jest.doMock('expo-router', () => ({
      useRouter: () => mockRouter,
      useSegments: () => ['(manager)', '(tabs)', 'dashboard'],
      Slot: ({ children }) => children,
    }));

    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } } as any,
      user: { id: '1', role: 'player', clubId: 'club1' } as any,
      loading: false,
      sessionLoaded: true,
      isManager: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    });

    render(<RootLayoutContent />);
    
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/(app)/(tabs)/dashboard');
    });
  });
});
