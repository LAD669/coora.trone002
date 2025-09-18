import React from 'react';
import { Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession, useAuth } from '@/contexts/AuthProvider';
import { LoadingScreen } from '@/components/LoadingScreen';

function AppContent() {
  const { session, loading, userId } = useSession();
  const { user } = useAuth();

  // Add safety logging
  console.log('AppContent: loading:', loading, 'session:', session === undefined ? 'initializing' : session ? 'exists' : 'null', 'userId:', userId, 'user:', user ? 'exists' : 'null');

  // Show loading state while still initializing
  if (session === undefined) {
    console.log('AppContent: Session still initializing, showing loading screen');
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

  // Redirect to auth login if no session (null) or no valid user
  if (session === null || !session?.user || !userId || !user?.id) {
    console.log('AppContent: No valid session or user found, redirecting to login');
    return <Redirect href="/(auth)/login" />;
  }

  console.log('AppContent: Valid session found, rendering app');

  // Manager users are now handled by the root layout routing system

  // Render Stack with all screens when session exists (for non-managers)
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false,
          gestureEnabled: true 
        }} 
      />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="EditProfileScreen" />
      <Stack.Screen name="live-ticker" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function AppLayout() {
  return <AppContent />;
} 