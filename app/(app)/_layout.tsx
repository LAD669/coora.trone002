import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession, useAuth } from '@/contexts/AuthProvider';
import { LoadingScreen } from '@/components/LoadingScreen';
import { storage } from '@/lib/storage';
import RootNavigator from './RootNavigator';

function AppContent() {
  const { session, loading, userId } = useSession();
  const { user } = useAuth();
  const [hasStoredSessions, setHasStoredSessions] = useState<boolean | null>(null);
  const [isCheckingStoredSessions, setIsCheckingStoredSessions] = useState(true);

  // Check for stored sessions on mount
  useEffect(() => {
    const checkStoredSessions = async () => {
      try {
        const sessionsStr = await storage.getItem('stored_sessions');
        const currentSessionStr = await storage.getItem('current_session');
        
        const hasSessions = sessionsStr && JSON.parse(sessionsStr).length > 0;
        const hasCurrentSession = currentSessionStr && JSON.parse(currentSessionStr);
        
        console.log('AppContent: Stored sessions check:', {
          hasSessions,
          hasCurrentSession,
          sessionsCount: sessionsStr ? JSON.parse(sessionsStr).length : 0
        });
        
        setHasStoredSessions(hasSessions && hasCurrentSession);
      } catch (error) {
        console.error('AppContent: Error checking stored sessions:', error);
        setHasStoredSessions(false);
      } finally {
        setIsCheckingStoredSessions(false);
      }
    };

    checkStoredSessions();
  }, []);

  // Add safety logging
  console.log('AppContent: loading:', loading, 'session:', session === undefined ? 'initializing' : session ? 'exists' : 'null', 'userId:', userId, 'user:', user ? 'exists' : 'null', 'hasStoredSessions:', hasStoredSessions, 'isCheckingStoredSessions:', isCheckingStoredSessions);

  // Show loading state while still initializing or checking stored sessions
  if (session === undefined || isCheckingStoredSessions) {
    console.log('AppContent: Session still initializing or checking stored sessions, showing loading screen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <LoadingScreen message="Initializing COORA..." />
      </View>
    );
  }

  // Show loading state while loading (additional safety)
  if (loading) {
    console.log('AppContent: Showing loading state');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <LoadingScreen message="Loading..." />
      </View>
    );
  }

  // Redirect to auth login if no session (null) or no valid user AND no stored sessions
  if ((session === null || !session?.user || !userId || !user?.id) && !hasStoredSessions) {
    console.log('AppContent: No valid session or user found and no stored sessions, redirecting to login');
    return <Redirect href="/(auth)/login" />;
  }

  // If we have stored sessions but no current session, we should still show the app
  // The user can switch accounts from within the app
  if (hasStoredSessions && (session === null || !session?.user || !userId || !user?.id)) {
    console.log('AppContent: Has stored sessions but no current session, showing app (user can switch accounts)');
    // Continue to render the app - user can switch accounts
  }

  console.log('AppContent: Valid session found, rendering app');

  // Render role-based navigation directly
  return <RootNavigator />;
}

export default function AppLayout() {
  return <AppContent />;
} 