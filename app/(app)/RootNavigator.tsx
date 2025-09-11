import React from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthProvider';
import { Redirect } from 'expo-router';
import ManagerTabs from './ManagerTabs';
import PlayerTabs from './(tabs)/_layout';

export default function RootNavigator() {
  const { user, roles } = useAuth();

  // If no user, redirect to auth
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Role-based navigation with Stack for additional screens
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="(tabs)" 
        component={roles.includes('manager') ? ManagerTabs : PlayerTabs}
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
