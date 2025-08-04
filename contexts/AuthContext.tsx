import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { router, useRouter } from 'expo-router';
import { validateAccessCode, getUserProfile, getCurrentUser, restoreSession } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Alert } from 'react-native';
import { storage } from '@/lib/storage';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'trainer' | 'player' | 'parent';
  teamId?: string;
  clubId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  sessionError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, accessCode?: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  retrySessionRestore: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  isAppReady?: boolean;
}

export function AuthProvider({ children, isAppReady = false }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isSessionRestoreFailed, setIsSessionRestoreFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const navigationAttempted = useRef(false);
  const router = useRouter();
  const { safeReplace } = useNavigationGuard(isAppReady);

  // Verify and set user data (no navigation)
  const verifyAndSetUser = async (userId: string): Promise<boolean> => {
    try {
      console.log('Verifying user data for:', userId);
      
      // First verify the user is still valid
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        console.error('User verification failed:', userError);
        throw new Error('Failed to verify user');
      }

      console.log('User verified, fetching profile...');
      const userProfile = await getUserProfile(userId);
      
      setUser({
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role,
        teamId: userProfile.team_id || undefined,
        clubId: userProfile.club_id || undefined,
      });
      
      console.log('User profile set successfully');
      return true;
    } catch (error) {
      console.error('Error verifying user:', error);
      return false;
    }
  };

  // Navigate to login with loop prevention
  const navigateToLogin = () => {
    if (!navigationAttempted.current) {
      navigationAttempted.current = true;
      console.log('Navigating to login screen');
      safeReplace('/auth/login');
    }
  };

  // Navigate to home with loop prevention
  const navigateToHome = () => {
    if (!navigationAttempted.current) {
      navigationAttempted.current = true;
      console.log('Navigating to home screen');
      safeReplace('/(tabs)');
    }
  };

  // Reset navigation state
  const resetNavigationState = () => {
    navigationAttempted.current = false;
  };

  // Check for stored session on mount (no navigation until app is ready)
  const checkStoredSession = async (isRetry = false) => {
    console.log('Checking for stored session...', isRetry ? '(retry)' : '');
    setSessionError(null);
    setIsLoading(true);
    resetNavigationState();

    try {
      // Check for active session using getSession()
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        throw error;
      }

      if (session?.user) {
        console.log('Active session found, verifying user...');
        const success = await verifyAndSetUser(session.user.id);
        if (!success) {
          throw new Error('Failed to verify user from active session');
        }
        setIsSessionRestoreFailed(false);
        setRetryCount(0);
        // Safe navigation to home if verification successful
        navigateToHome();
      } else {
        // Try to get user directly as fallback
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting user:', userError);
        }
        
        if (currentUser) {
          console.log('User found via getUser(), verifying...');
          const success = await verifyAndSetUser(currentUser.id);
          if (!success) {
            throw new Error('Failed to verify user from getUser()');
          }
          setIsSessionRestoreFailed(false);
          setRetryCount(0);
          // Safe navigation to home if verification successful
          navigateToHome();
        } else {
          console.log('No stored session found, setting user to null');
          setUser(null);
          setIsSessionRestoreFailed(false);
          setRetryCount(0);
          // Safe navigation to login
          navigateToLogin();
        }
      }
    } catch (error) {
      console.error('Error during session check:', error);
      setUser(null);
      
      if (isRetry && retryCount >= maxRetries) {
        setSessionError('Session restore failed. Please sign in again.');
        setIsSessionRestoreFailed(true);
      } else if (isRetry) {
        setRetryCount(prev => prev + 1);
        setSessionError(`Session restore failed. Retrying... (${retryCount + 1}/${maxRetries})`);
      } else {
        setSessionError('Session expired. Please sign in again.');
        setIsSessionRestoreFailed(true);
      }
      
      // Safe navigation to login
      navigateToLogin();
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
      console.log('Session check completed');
    }
  };

  // Retry session restore function
  const retrySessionRestore = async () => {
    if (retryCount < maxRetries) {
      console.log('Retrying session restore...');
      await checkStoredSession(true);
    } else {
      console.log('Max retries reached, navigating to login');
      setSessionError('Session restore failed. Please sign in again.');
      setIsSessionRestoreFailed(true);
      navigateToLogin();
    }
  };

  // Check for stored session on mount
  useEffect(() => {
    checkStoredSession();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      resetNavigationState();
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setIsLoading(true);
        try {
          if (session?.user) {
            const success = await verifyAndSetUser(session.user.id);
            if (!success) {
              throw new Error('Failed to verify user after auth state change');
            }
            setIsSessionRestoreFailed(false);
            setRetryCount(0);
            navigateToHome();
          }
        } catch (error) {
          console.error('Error updating user state:', error);
          setUser(null);
          setSessionError('Session expired. Please sign in again.');
          setIsSessionRestoreFailed(true);
          navigateToLogin();
        } finally {
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setUser(null);
        setIsLoading(false);
        setIsSessionRestoreFailed(false);
        setRetryCount(0);
        navigateToLogin();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setSessionError(null);
    setIsSessionRestoreFailed(false);
    setRetryCount(0);
    resetNavigationState();
    
    try {
      console.log('Attempting sign in for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const success = await verifyAndSetUser(data.user.id);
        if (!success) {
          throw new Error('Failed to verify user after sign in');
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, accessCode?: string) => {
    setIsLoading(true);
    setSessionError(null);
    setIsSessionRestoreFailed(false);
    setRetryCount(0);
    resetNavigationState();
    
    try {
      // Validate access code if provided
      if (accessCode) {
        const isValidCode = await validateAccessCode(accessCode);
        if (!isValidCode) {
          throw new Error('Invalid access code. Please check with your team administrator.');
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            access_code: accessCode,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile in users table
        try {
          // Get club and team info from access code if provided
          let clubId = null;
          let teamId = null;
          
          if (accessCode) {
            const { data: codeData } = await supabase
              .from('access_codes')
              .select('club_id, team_id')
              .eq('code', accessCode.toUpperCase())
              .eq('is_active', true)
              .single();
            
            if (codeData) {
              clubId = codeData.club_id;
              teamId = codeData.team_id;
            }
          }

          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              name: name,
              first_name: name.split(' ')[0] || name,
              last_name: name.split(' ').slice(1).join(' ') || '',
              role: 'player', // Default role
              club_id: clubId,
              team_id: teamId,
              access_code: accessCode?.toUpperCase(),
            });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            throw new Error('Failed to create user profile. Please try again.');
          }

          // Reload auth state to get the complete user profile
          await checkStoredSession();
        } catch (profileError) {
          console.error('Profile creation error:', profileError);
          // Clean up auth user if profile creation fails
          await supabase.auth.signOut();
          throw new Error('Account creation failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    resetNavigationState();
    
    try {
      console.log('Starting sign out process...');
      await supabase.auth.signOut();
      await storage.removeItem('supabase.auth.token');
      await storage.removeItem('supabase.auth.refreshToken');
      setUser(null);
      setIsSessionRestoreFailed(false);
      setRetryCount(0);
      console.log('Sign out completed successfully');
      navigateToLogin();
    } catch (error) {
      console.error('Sign out error:', error);
      // Force sign out even if there's an error
      setUser(null);
      setIsSessionRestoreFailed(false);
      setRetryCount(0);
      navigateToLogin();
      throw new Error(error instanceof Error ? error.message : 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isInitialized,
    isAuthenticated: !!user,
    sessionError,
    signIn,
    signUp,
    signOut,
    setUser,
    retrySessionRestore,
  };

  // Show loading screen with fallback handling
  if (!isInitialized || isLoading) {
    let loadingMessage = "Loading...";
    let isError = false;

    if (sessionError) {
      loadingMessage = sessionError;
      isError = true;
    } else if (isSessionRestoreFailed) {
      loadingMessage = "Session restore failed. Please sign in again.";
      isError = true;
    } else if (retryCount > 0) {
      loadingMessage = `Retrying session restore... (${retryCount}/${maxRetries})`;
      isError = false;
    }

    return (
      <LoadingScreen 
        message={loadingMessage} 
        isError={isError}
        showRetry={isSessionRestoreFailed && retryCount < maxRetries}
        onRetry={retrySessionRestore}
      />
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}