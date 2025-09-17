/**
 * @deprecated This file is deprecated. Use @/contexts/AuthProvider instead.
 * The new AuthProvider provides better session handling and prevents crashes.
 */

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
  role: 'admin' | 'trainer' | 'player' | 'parent' | 'manager';
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
  signUp: (email: string, password: string, name: string, accessCode: string) => Promise<void>;
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
  console.log('AuthProvider initialized with isAppReady:', isAppReady);
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isSessionRestoreFailed, setIsSessionRestoreFailed] = useState(false);
  const [session, setSession] = useState<any>(null); // Initialize session as null
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const navigationAttempted = useRef(false);
  const rootLayoutMounted = useRef(false);
  const router = useRouter();
  const { safeReplace } = useNavigationGuard(isAppReady);

  // Safety function to safely set session
  const safeSetSession = (newSession: any) => {
    console.log('Setting session:', newSession ? 'exists' : 'null', 'user ID:', newSession?.user?.id);
    console.log('Previous session state:', session ? 'exists' : 'null');
    setSession(newSession);
  };

  // Set root layout mounted ref after a longer timeout to ensure proper mounting
  useEffect(() => {
    const timer = setTimeout(() => {
      rootLayoutMounted.current = true;
      console.log('Root layout mounted, navigation enabled');
    }, 1000); // Increased delay to ensure proper mounting

    return () => clearTimeout(timer);
  }, []);

  // Log when isAppReady changes
  useEffect(() => {
    console.log('isAppReady changed to:', isAppReady);
  }, [isAppReady]);

  // Log when session changes
  useEffect(() => {
    console.log('Session state changed:', session ? 'exists' : 'null', 'user ID:', session?.user?.id);
  }, [session]);

  // Check if user state is valid and redirect to login if not
  useEffect(() => {
    // Only check after initialization is complete and not loading
    if (isInitialized && !isLoading && user && !user.id) {
      console.log('User exists but has no ID, redirecting to login');
      setUser(null);
      // Add delay to ensure navigation is safe
      setTimeout(() => {
        navigateToLogin();
      }, 500);
    }
  }, [user, isInitialized, isLoading]);

  // Helper function to validate user state
  const isValidUser = (user: User | null): boolean => {
    return user !== null && user.id !== undefined && user.id !== null && user.id !== '';
  };

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
      if (sessionData?.expires_at && sessionData.expires_at < now) {
        console.log('Session expired, skipping user verification');
        return false;
      }
      
      // Step 4: Ensure session user ID is present before proceeding
      if (!sessionData?.user?.id) {
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
      
      // Safety check: ensure userProfile has an ID
      if (!userProfile || !userProfile.id) {
        console.error('User profile has no ID, verification failed');
        return false;
      }
      
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
    console.log('navigateToLogin called - navigationAttempted:', navigationAttempted.current, 'rootLayoutMounted:', rootLayoutMounted.current, 'isAppReady:', isAppReady);
    if (!navigationAttempted.current && rootLayoutMounted.current && isAppReady) {
      navigationAttempted.current = true;
      console.log('Navigating to login screen');
      // Add a small delay to ensure navigation is safe
      setTimeout(() => {
        safeReplace('/(auth)/login');
      }, 100);
    } else {
      console.log('Navigation blocked - root layout not ready or navigation already attempted');
    }
  };

  // Navigate to home with loop prevention and root layout check
  const navigateToHome = () => {
    console.log('navigateToHome called - navigationAttempted:', navigationAttempted.current, 'rootLayoutMounted:', rootLayoutMounted.current, 'isAppReady:', isAppReady, 'session:', session ? 'exists' : 'null', 'user:', user ? 'exists' : 'null', 'user ID:', user?.id);
    
    // Additional safety check - only navigate if we have a valid session and user
    if (!session || !session.user?.id || !user || !user.id) {
      console.log('Navigation blocked - no valid session or user');
      return;
    }
    
    if (!navigationAttempted.current && rootLayoutMounted.current && isAppReady) {
      navigationAttempted.current = true;
      console.log('Navigating to home screen');
      // Add a small delay to ensure navigation is safe
      setTimeout(() => {
        safeReplace('/(app)/(tabs)');
      }, 100);
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

      // Set session state (can be null)
      safeSetSession(session);

      // Step 2: If session is missing or expired, do not call getUser()
      if (!session) {
        console.log('No stored session found, setting user to null');
        setUser(null);
        setIsSessionRestoreFailed(false);
        setRetryCount(0);
        // Only navigate if app is ready
        if (isAppReady) {
          navigateToLogin();
        }
        return;
      }

      // Step 3: Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (session?.expires_at && session.expires_at < now) {
        console.log('Session expired, setting user to null');
        setUser(null);
        setIsSessionRestoreFailed(false);
        setRetryCount(0);
        // Only navigate if app is ready
        if (isAppReady) {
          navigateToLogin();
        }
        return;
      }

      // Step 4: Ensure session user ID is present before proceeding
      if (!session?.user?.id) {
        console.log('Session user ID not available, setting user to null');
        setUser(null);
        setIsSessionRestoreFailed(false);
        setRetryCount(0);
        // Only navigate if app is ready
        if (isAppReady) {
          navigateToLogin();
        }
        return;
      }

      // Step 5: Only proceed if we have a valid session with user
      if (session?.user?.id) {
        console.log('Active session found, verifying user...');
        const success = await verifyAndSetUser(session.user.id);
        if (!success) {
          console.log('User verification failed, setting user to null');
          setUser(null);
          setIsSessionRestoreFailed(false);
          setRetryCount(0);
          // Only navigate if app is ready
          if (isAppReady) {
            navigateToLogin();
          }
          return;
        }
        
        console.log('User verification successful');
        setIsSessionRestoreFailed(false);
        setRetryCount(0);
        // Only navigate if app is ready
        if (isAppReady) {
          navigateToHome();
        }
      } else {
        console.log('Session exists but no user found, setting user to null');
        setUser(null);
        setIsSessionRestoreFailed(false);
        setRetryCount(0);
        // Only navigate if app is ready
        if (isAppReady) {
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
      
      // Only navigate if app is ready
      if (isAppReady) {
        navigateToLogin();
      }
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

  // Handle navigation when app becomes ready
  useEffect(() => {
    if (isAppReady && isInitialized && !isLoading) {
      console.log('App is ready, checking if navigation is needed...');
      
      // If we have no session or no user, navigate to login
      if (!session || !session.user?.id || !user || !user.id) {
        console.log('No valid session or user, navigating to login');
        navigateToLogin();
      } else {
        console.log('Valid session and user found, navigating to home');
        navigateToHome();
      }
    }
  }, [isAppReady, isInitialized, isLoading, session, user]);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isInitialized || isLoading) {
        console.warn('Initialization timeout reached, forcing completion');
        setIsLoading(false);
        setIsInitialized(true);
        setSessionError('Initialization timeout. Please try again.');
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isInitialized, isLoading]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sessionData) => {
      console.log('Auth state changed:', event, 'sessionData:', sessionData ? 'exists' : 'null');
      
      // Always update session state first (can be null)
      safeSetSession(sessionData);
      resetNavigationState();
      
      // Small delay to ensure session state is updated
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Early return if session is null or undefined
      if (!sessionData) {
        console.log('Session is null/undefined, clearing user state');
        setUser(null);
        setIsLoading(false);
        setIsSessionRestoreFailed(false);
        setRetryCount(0);
        return;
      }

      // Additional check for invalid session data
      if (!sessionData.user?.id) {
        console.log('Session exists but has no user ID, clearing user state');
        setUser(null);
        setIsLoading(false);
        setIsSessionRestoreFailed(false);
        setRetryCount(0);
        return;
      }
      
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
            // Only navigate to home if we have a valid session
            if (sessionData && sessionData.user?.id) {
              console.log('Session is valid, navigating to home');
              navigateToHome();
            } else {
              console.log('Session is not valid, not navigating to home');
            }
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
      
      // Step 1: Log the user in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        throw new Error(`Authentication failed: ${error.message}`);
      }

      if (!data.user) {
        console.error('No user data returned from Supabase auth');
        throw new Error('Authentication failed: No user data received');
      }

      console.log('User authenticated successfully, verifying profile...');
      
      // Step 2: Attempt to verify the user using getUserProfile
      try {
        const userProfile = await getUserProfile(data.user.id);
        console.log('User profile verified successfully:', userProfile.name);
        
        // Safety check: ensure userProfile has an ID
        if (!userProfile || !userProfile.id) {
          console.error('User profile has no ID, login failed');
          throw new Error('User profile verification failed');
        }
        
        // Set user in context
        setUser({
          id: userProfile.id,
          name: userProfile.name,
          email: userProfile.email,
          role: userProfile.role,
          teamId: userProfile.team_id || undefined,
          clubId: userProfile.club_id || undefined,
        });
        
        // Ensure navigation state is reset before attempting navigation
        resetNavigationState();
        
        // Force a small delay to ensure state is properly set
        await new Promise(resolve => setTimeout(resolve, 100));
        
                      // Step 3: Navigate to dashboard on successful verification
        console.log('Login successful, navigating to dashboard tab');
        console.log('About to call safeReplace with /(app)/(tabs)/dashboard');
        // Add a small delay to ensure navigation is safe
        setTimeout(() => {
          safeReplace('/(app)/(tabs)/dashboard');
          console.log('safeReplace called successfully');
        }, 100);
        
      } catch (verificationError) {
        console.error('User verification failed:', verificationError);
        
        // Step 4: If verification fails, sign out the user and navigate back to login
        console.log('Signing out user due to verification failure...');
        
        try {
          await supabase.auth.signOut();
          await storage.removeItem('supabase.auth.token');
          await storage.removeItem('supabase.auth.refreshToken');
          setUser(null);
          setIsSessionRestoreFailed(false);
          setRetryCount(0);
          console.log('User signed out successfully after verification failure');
          
          // Navigate back to login
          safeReplace('/(auth)/login');
          
        } catch (signOutError) {
          console.error('Error during sign out after verification failure:', signOutError);
          // Force user state reset even if sign out fails
          setUser(null);
          setIsSessionRestoreFailed(false);
          setRetryCount(0);
          safeReplace('/(auth)/login');
        }
        
        // Don't throw the verification error, just log it
        console.error('Login failed due to user verification error:', verificationError);
      }
      
    } catch (error) {
      console.error('Sign in error:', error);
      // Don't throw raw errors, just log them
      console.error('Login process failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, accessCode: string) => {
    setIsLoading(true);
    setSessionError(null);
    setIsSessionRestoreFailed(false);
    setRetryCount(0);
    resetNavigationState();
    
    try {
      // Access code is now mandatory
      if (!accessCode?.trim()) {
        throw new Error('Access code is required.');
      }

      // Validate access code
      try {
        const isValidCode = await validateAccessCode(accessCode.trim());
        if (!isValidCode) {
          throw new Error('This access code is invalid or no longer available. Ask your coach for a new one.');
        }
      } catch (validationError) {
        console.warn('Access code validation failed, but allowing signup to proceed:', validationError);
        // Continue with signup even if validation fails
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
          // Get club and team info from access code (now mandatory)
          let clubId = null;
          let teamId = null;
          
          try {
            // Try to get access code details, but handle missing columns gracefully
            const { data: codeData, error: codeError } = await supabase
              .from('access_codes')
              .select('club_id, team_id')
              .eq('code', accessCode.trim().toUpperCase())
              .maybeSingle();
            
            if (codeError) {
              console.warn('Could not fetch access code details:', codeError);
              // Continue without club/team assignment if access_codes table doesn't exist or has wrong structure
            } else if (codeData) {
              clubId = codeData.club_id;
              teamId = codeData.team_id;
            }
          } catch (codeError) {
            console.warn('Could not fetch access code details, proceeding without club/team assignment:', codeError);
            // Continue without club/team assignment if access_codes table doesn't exist
          }

          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              name: name,
              first_name: name.split(' ')[0] || name,
              last_name: name.split(' ').slice(1).join(' ') || '',
              role: 'player', // Default role for new signups
              club_id: clubId,
              team_id: teamId,
              access_code: accessCode.trim().toUpperCase(),
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

  // Ensure session is properly initialized even if null
  const safeSession = session || null;

  const value: AuthContextType = {
    user,
    isLoading,
    isInitialized,
    isAuthenticated: isValidUser(user),
    sessionError,
    session: safeSession, // Use safe session
    signIn,
    signUp,
    signOut,
    setUser,
    retrySessionRestore,
  };

  // Show loading screen with fallback handling
  if (!isInitialized || isLoading) {
    let loadingMessage = "Initializing COORA...";
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

    console.log('AuthProvider: Showing loading screen', {
      isInitialized,
      isLoading,
      isAppReady,
      sessionError,
      isSessionRestoreFailed,
      retryCount
    });

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
  
  // Add safety check for user ID
  if (context.user && !context.user.id) {
    console.log('useAuth: User exists but has no ID, this should trigger a redirect');
  }
  
  return context;
}

export const useSession = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSession must be used within an AuthProvider');
  }
  
  // Add safety logging for debugging
  if (context.session === null) {
    console.log('useSession: Session is null');
  } else if (context.session === undefined) {
    console.log('useSession: Session is undefined');
  } else {
    console.log('useSession: Session exists', context.session.user?.id ? 'with user' : 'without user');
  }
  
  return {
    session: context.session,
    isLoading: context.isLoading,
    isInitialized: context.isInitialized
  };
};