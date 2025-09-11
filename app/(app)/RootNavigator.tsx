import React from 'react';
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

  // Role-based navigation
  if (roles.includes('manager')) {
    return <ManagerTabs />;
  }

  // Default to player tabs for all other roles (admin, trainer, player, parent)
  return <PlayerTabs />;
}
