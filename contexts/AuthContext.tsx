import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { router, useRouter } from 'expo-router';
import { validateAccessCode, getUserProfile, getCurrentUser, restoreSession } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Alert } from 'react-native';
import { storage } from '@/lib/storage';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { LanguageProvider } from '@/contexts/LanguageContext';

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
  session: any; // Add session to the context
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
  const [session, setSession] = useState<any>(null); // Add session state
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const navigationAttempted = useRef(false);
  const rootLayoutMounted = useRef(false);
  const router = useRouter();
  const { safeReplace } = useNavigationGuard(isAppReady);

  // Set root layout mounted ref after a small timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      rootLayoutMounted.current = true;
      console.log('Root layout mounted, navigation enabled');
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // Verify and set user data (no navigation)
  const verifyAndSetUser = async (userId: string): Promise<boolean> => {
    try {
      console.log('Verifying user data for:', userId);
      
      // Step 1: Check if a session exists before calling getUser()
      const { data: { session: sessionData }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        throw new Error('Failed to get session');
      }
      
      // Step 2: If session is missing or expired, return null and do not call getUser()
      if (!sessionData) {
        console.log('No active session found, skipping user verification');
        return false;
      }
      
      // Step 3: Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (sessionData.expires_at && sessionData.expires_at < now) {
        console.log('Session expired, skipping user verification');
        return false;
      }
      
      // Step 4: Ensure session user ID is present before proceeding
      if (!sessionData.user?.id) {
        console.log('Session user ID not available, skipping user verification');
        return false;
      }
      
      // Step 5: Only call getUser() if a valid session exists
      console.log('Valid session found, calling getUser()...');
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Supabase getUser() error:', userError);
        throw new Error(`Failed to get user: ${userError.message}`);
      }
      
      if (!currentUser) {
        console.error('No user returned from getUser()');
        throw new Error('No user found in session');
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

  // Navigate to login with loop prevention and root layout check
  const navigateToLogin = () => {
    if (!navigationAttempted.current && rootLayoutMounted.current && isAppReady) {
      navigationAttempted.current = true;
      console.log('Navigating to login screen');
      safeReplace('/auth/login');
    } else {
      console.log('Navigation blocked - root layout not ready or navigation already attempted');
    }
  };

  // Navigate to home with loop prevention and root layout check
  const navigateToHome = () => {
    if (!navigationAttempted.current && rootLayoutMounted.current && isAppReady) {
      navigationAttempted.current = true;
      console.log('Navigating to home screen');
      safeReplace('/(tabs)');
    } else {
      console.log('Navigation blocked - root layout not ready or navigation already attempted');
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
      // Step 1: Check for active session using getSession()
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        throw error;
      }

      // Set session state
      setSession(session);

      // Step 2: If session is missing or expired, do not call getUser()
      if (!session) {
        console.log('No stored session found, setting user to null');
        setUser(null);
        setIsSessionRestoreFailed(false);
        setRetryCount(0);
        // Safe navigation to login
        navigateToLogin();
        return;
      }

      // Step 3: Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        console.log('Session expired, setting user to null');
        setUser(null);
        setIsSessionRestoreFailed(false);
        setRetryCount(0);
        // Safe navigation to login
        navigateToLogin();
        return;
      }

      // Step 4: Ensure session user ID is present before proceeding
      if (!session.user?.id) {
        console.log('Session user ID not available, setting user to null');
        setUser(null);
        setIsSessionRestoreFailed(false);
        setRetryCount(0);
        // Safe navigation to login
        navigateToLogin();
        return;
      }

      // Step 5: Only proceed if we have a valid session with user
      if (session.user) {
        console.log('Active session found, verifying user...');
        const success = await verifyAndSetUser(session.user.id);
        if (!success) {
          console.log('User verification failed, setting user to null');
          setUser(null);
          setIsSessionRestoreFailed(false);
          setRetryCount(0);
          // Safe navigation to login
          navigateToLogin();
          return;
        }
        
        console.log('User verification successful');
        setIsSessionRestoreFailed(false);
        setRetryCount(0);
        // Safe navigation to home if verification successful
        navigateToHome();
      } else {
        console.log('Session exists but no user found, setting user to null');
        setUser(null);
        setIsSessionRestoreFailed(false);
        setRetryCount(0);
        // Safe navigation to login
        navigateToLogin();
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sessionData) => {
      console.log('Auth state changed:', event);
      
      // Early return if session is null or undefined
      if (!sessionData) {
        console.log('Session is null/undefined, clearing user state');
        setSession(null);
        setUser(null);
        setIsLoading(false);
        setIsSessionRestoreFailed(false);
        setRetryCount(0);
        return;
      }
      
      setSession(sessionData); // Update session state
      resetNavigationState();
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Delay any fetchUser logic until session?.user?.id is definitely present
        if (!sessionData?.user?.id) {
          console.log('Session user ID not available yet, skipping user verification');
          setIsLoading(false);
          return;
        }
        
        setIsLoading(true);
        try {
          console.log('Session user ID available, verifying user...');
          const success = await verifyAndSetUser(sessionData.user.id);
          if (!success) {
            console.log('User verification failed, clearing user state');
            setUser(null);
            setSessionError('Session expired. Please sign in again.');
            setIsSessionRestoreFailed(true);
            // Don't navigate here - let the layout handle navigation
          } else {
            console.log('User verification successful');
            setIsSessionRestoreFailed(false);
            setRetryCount(0);
            // Navigate to home after successful verification
            navigateToHome();
          }
        } catch (error) {
          console.error('Error updating user state:', error);
          setUser(null);
          setSessionError('Session expired. Please sign in again.');
          setIsSessionRestoreFailed(true);
          // Don't navigate here - let the layout handle navigation
        } finally {
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setUser(null);
        setIsLoading(false);
        setIsSessionRestoreFailed(false);
        setRetryCount(0);
        // Don't navigate here - let the layout handle navigation
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
        
        // Ensure navigation state is reset before attempting navigation
        resetNavigationState();
        
        // Force a small delay to ensure state is properly set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Navigate to dashboard tab after successful login and user verification
        console.log('Login successful, navigating to dashboard tab');
        safeReplace('/(tabs)/dashboard');
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
    session: session, // Add session to the context
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
      <LanguageProvider>
        <LoadingScreen 
          message={loadingMessage} 
          isError={isError}
          showRetry={isSessionRestoreFailed && retryCount < maxRetries}
          onRetry={retrySessionRestore}
        />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </LanguageProvider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const useSession = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSession must be used within an AuthProvider');
  }
  return context.session;
};