import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { getUserProfile } from '@/lib/supabase';
import { LoadingScreen } from '@/components/LoadingScreen';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'trainer' | 'player' | 'parent' | 'manager';
  teamId?: string;
  clubId?: string;
}

interface AuthContextType {
  session: Session | null | undefined; // undefined = initializing, null = no session, Session = valid session
  user: AuthUser | null;
  loading: boolean;
  sessionLoaded: boolean; // true when session initialization is complete
  isManager: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name: string, accessCode: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null | undefined>(undefined); // Start as undefined (initializing)
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper to check if user is a manager
  const isManager = user?.role === 'manager';

  // Load session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        console.log('Session loading...');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error loading session:', error);
          setSession(null);
          setUser(null);
          console.log('Session null — showing login');
        } else {
          console.log('Session loaded:', initialSession ? 'exists' : 'null');
          setSession(initialSession);
          
          // If session exists, load user profile
          if (initialSession?.user?.id) {
            console.log('Session found — navigating to home');
            await loadUserProfile(initialSession.user.id);
            
            // Registriere für Push-Benachrichtigungen nach initial session load
            try {
              const { registerForPushNotificationsAsync } = await import('@/lib/pushNotifications');
              await registerForPushNotificationsAsync();
            } catch (pushError) {
              console.error('Error registering for push notifications:', pushError);
            }
          } else {
            console.log('Session null — showing login');
          }
        }
      } catch (error) {
        console.error('Error during session load:', error);
        setSession(null);
        setUser(null);
        console.log('Session null — showing login');
      } finally {
        setLoading(false);
        setSessionLoaded(true);
        setIsInitialized(true);
      }
    };

    loadSession();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sessionData) => {
      console.log('Auth state changed:', event, 'session:', sessionData ? 'exists' : 'null');
      
      setSession(sessionData);
      
      if (sessionData?.user?.id) {
        console.log('Session found — navigating to home');
        await loadUserProfile(sessionData.user.id);
        
        // Registriere für Push-Benachrichtigungen nach Session-Restore
        try {
          const { registerForPushNotificationsAsync } = await import('@/lib/pushNotifications');
          await registerForPushNotificationsAsync();
        } catch (pushError) {
          console.error('Error registering for push notifications:', pushError);
        }
      } else {
        console.log('Session null — showing login');
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Loading user profile for:', userId);
      const userProfile = await getUserProfile(userId);
      
      setUser({
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role,
        teamId: userProfile.team_id || undefined,
        clubId: userProfile.club_id || undefined,
      });
      
      console.log('User profile loaded successfully');
      
      // Registriere für Push-Benachrichtigungen nach erfolgreichem Login
      try {
        const { registerForPushNotificationsAsync } = await import('@/lib/pushNotifications');
        await registerForPushNotificationsAsync();
      } catch (pushError) {
        console.error('Error registering for push notifications:', pushError);
      }
      
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user?.id) {
        await loadUserProfile(data.user.id);
        
        // Registriere für Push-Benachrichtigungen nach erfolgreichem Login
        try {
          const { registerForPushNotificationsAsync } = await import('@/lib/pushNotifications');
          await registerForPushNotificationsAsync();
        } catch (pushError) {
          console.error('Error registering for push notifications:', pushError);
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, accessCode: string) => {
    setLoading(true);
    try {
      // Access code is now mandatory
      if (!accessCode?.trim()) {
        throw new Error('Access code is required.');
      }

      // Validate access code
      try {
        const { validateAccessCode } = await import('@/lib/supabase');
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

          // Load the user profile
          await loadUserProfile(data.user.id);
          
          // Registriere für Push-Benachrichtigungen nach erfolgreicher Registrierung
          try {
            const { registerForPushNotificationsAsync } = await import('@/lib/pushNotifications');
            await registerForPushNotificationsAsync();
          } catch (pushError) {
            console.error('Error registering for push notifications:', pushError);
          }
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
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Entferne den Expo Push Token vor dem Logout
      try {
        const { removeExpoPushTokenFromSupabase } = await import('@/lib/pushNotifications');
        await removeExpoPushTokenFromSupabase();
      } catch (pushError) {
        console.error('Error removing push notification token:', pushError);
      }
      
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    loading,
    sessionLoaded,
    isManager,
    signIn,
    signOut,
    signUp,
  };

  // Show loading screen while session is being loaded or not initialized
  if (loading || !isInitialized) {
    return <LoadingScreen message="Loading..." />;
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

// Helper hook for safe session access
export function useSession() {
  const { session, loading } = useAuth();
  
  return {
    session,
    loading,
    // Safe access to session.user
    user: session?.user || null,
    userId: session?.user?.id || null,
  };
} 