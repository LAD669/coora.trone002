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

  // Strict role-based navigation - only manager role sees ManagerTabs
  if (roles.includes('manager')) {
    return <ManagerTabs />;
  }

  // All other roles (admin, trainer, player, parent) see PlayerTabs
  return <PlayerTabs />;
}
