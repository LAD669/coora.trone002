import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router, useRouter } from 'expo-router';
import { validateAccessCode, getUserProfile, getCurrentUser, restoreSession } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Alert } from 'react-native';
import { storage } from '@/lib/storage';

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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, accessCode?: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const router = useRouter();

  // Clear stored session data and redirect to login
  const handleSessionError = async (error: any) => {
    console.error('Session restoration failed:', error);
    await storage.removeItem('supabase.auth.token');
    await storage.removeItem('supabase.auth.refreshToken');
    setUser(null);
    setSessionError('Session expired. Please sign in again.');
    router.replace('/auth/login');
  };

  // Verify and set user data
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

  const checkAuthState = async () => {
    console.log('Starting session restoration...');
    setSessionError(null);
    setIsLoading(true);

    try {
      // First check for active session
      console.log('Checking for active session...');
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      
      if (activeSession?.user) {
        console.log('Active session found, verifying user...');
        const success = await verifyAndSetUser(activeSession.user.id);
        if (!success) {
          throw new Error('Failed to verify user from active session');
        }
        // Navigate to home if verification successful
        router.replace('/(tabs)');
      } else {
        // Try to restore session from storage
        console.log('No active session, attempting to restore from storage...');
        const session = await restoreSession();
        
        if (session?.user) {
          console.log('Session restored, verifying user...');
          const success = await verifyAndSetUser(session.user.id);
          if (!success) {
            throw new Error('Failed to verify user after session restoration');
          }
          // Navigate to home if restoration successful
          router.replace('/(tabs)');
        } else {
          console.log('No stored session found');
          setUser(null);
          router.replace('/auth/login');
        }
      }
    } catch (error) {
      console.error('Error during session restoration:', error);
      handleSessionError(error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
      console.log('Session restoration process completed');
    }
  };

  // Check for existing session on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setIsLoading(true);
        try {
          if (session?.user) {
            const success = await verifyAndSetUser(session.user.id);
            if (!success) {
              throw new Error('Failed to verify user after auth state change');
            }
            router.replace('/(tabs)');
          }
        } catch (error) {
          console.error('Error updating user state:', error);
          handleSessionError(error);
        } finally {
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setUser(null);
        setIsLoading(false);
        router.replace('/auth/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setSessionError(null);
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
          await checkAuthState();
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
    try {
      console.log('Starting sign out process...');
      await supabase.auth.signOut();
      await storage.removeItem('supabase.auth.token');
      await storage.removeItem('supabase.auth.refreshToken');
      setUser(null);
      console.log('Sign out completed successfully');
      router.replace('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
      // Force sign out even if there's an error
      setUser(null);
      router.replace('/auth/login');
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
    signIn,
    signUp,
    signOut,
    setUser,
  };

  // Show loading screen only during initial load or auth state changes
  if (!isInitialized || isLoading) {
    return (
      <LoadingScreen 
        message={sessionError || "Loading..."} 
        isError={!!sessionError}
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