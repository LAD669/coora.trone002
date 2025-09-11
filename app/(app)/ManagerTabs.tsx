import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, Home, Info, Settings } from 'lucide-react-native';

// Import manager screens
import ManagerDashboardScreen from './(tabs)/ManagerDashboard';
import ManagerCalendarScreen from './(tabs)/ManagerCalendar';
import ManagerTeamsScreen from './(tabs)/ManagerTeams';
import ManagerInfoHubScreen from './(tabs)/ManagerInfoHub';
import SettingsScreen from './settings';

const Tab = createBottomTabNavigator();

export default function ManagerTabs() {
  const { t } = useTranslation('manager');

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F0F0F0',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          fontFamily: 'Urbanist-Medium',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          borderBottomColor: '#F0F0F0',
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          fontFamily: 'Urbanist-SemiBold',
          color: '#1A1A1A',
        },
      }}
    >
      <Tab.Screen
        name="ManagerDashboard"
        component={ManagerDashboardScreen}
        options={{
          title: t('dashboard'),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ManagerCalendar"
        component={ManagerCalendarScreen}
        options={{
          title: t('calendar'),
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ManagerTeams"
        component={ManagerTeamsScreen}
        options={{
          title: t('teams'),
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ManagerInfoHub"
        component={ManagerInfoHubScreen}
        options={{
          title: t('infoHub'),
          tabBarIcon: ({ color, size }) => <Info size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('common:settings'),
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
