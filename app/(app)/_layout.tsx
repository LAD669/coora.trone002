import React from 'react';
import { Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession, useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/LoadingScreen';

function AppContent() {
  const { session, isLoading, isInitialized } = useSession();
  const { user } = useAuth();

  // Add safety logging
  console.log('AppContent: isInitialized:', isInitialized, 'isLoading:', isLoading, 'session:', session ? 'exists' : 'null', 'session user ID:', session?.user?.id, 'user:', user ? 'exists' : 'null', 'user ID:', user?.id);

  // Show loading state while initializing or loading
  if (!isInitialized || isLoading) {
    console.log('AppContent: Showing loading state');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <LoadingScreen message="Initializing COORA..." />
      </View>
    );
  }

  // Redirect to auth login if no session or no valid user
  if (!session || !session.user?.id || !user || !user.id) {
    console.log('AppContent: No valid session or user found, redirecting to login');
    return <Redirect href="/(auth)/login" />;
  }

  // Render Stack with all screens when session exists
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