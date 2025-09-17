import React from 'react';
import { Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession, useAuth } from '@/contexts/AuthProvider';
import { LoadingScreen } from '@/components/LoadingScreen';

function ManagerAppContent() {
  const { session, loading, userId } = useSession();
  const { user } = useAuth();

  // Add safety logging
  console.log('ManagerAppContent: loading:', loading, 'session:', session === undefined ? 'initializing' : session ? 'exists' : 'null', 'userId:', userId, 'user:', user ? 'exists' : 'null');

  // Show loading state while still initializing
  if (session === undefined) {
    console.log('ManagerAppContent: Session still initializing, showing loading screen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <LoadingScreen message="Initializing COORA..." />
      </View>
    );
  }

  // Show loading state while loading (additional safety)
  if (loading) {
    console.log('ManagerAppContent: Showing loading state');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <LoadingScreen message="Loading..." />
      </View>
    );
  }

  // Redirect to auth login if no session (null) or no valid user
  if (session === null || !session?.user || !userId || !user?.id) {
    console.log('ManagerAppContent: No valid session or user found, redirecting to login');
    return <Redirect href="/(auth)/login" />;
  }

  // Check if user is a manager
  if (user.role !== 'manager') {
    console.log('ManagerAppContent: User is not a manager, redirecting to regular tabs');
    return <Redirect href="/(app)/(tabs)" />;
  }

  console.log('ManagerAppContent: Valid manager session found, rendering manager app');

  // Render Stack with manager screens when session exists and user is manager
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="manager-dashboard" 
        options={{ 
          headerShown: false,
          gestureEnabled: true 
        }} 
      />
      <Stack.Screen 
        name="manager-infohub" 
        options={{ 
          headerShown: false,
          gestureEnabled: true 
        }} 
      />
      <Stack.Screen 
        name="manager-calendar" 
        options={{ 
          headerShown: false,
          gestureEnabled: true 
        }} 
      />
      <Stack.Screen 
        name="manager-playerboard" 
        options={{ 
          headerShown: false,
          gestureEnabled: true 
        }} 
      />
    </Stack>
  );
}

export default function ManagerAppLayout() {
  return <ManagerAppContent />;
}
