import React from 'react';
import { Tabs } from 'expo-router';
import { MessageSquare, Calendar, Users, ChartBar as BarChart3 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

export default function TabLayout() {
  const { t: tabsT } = useTranslation('tabs');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1A1A1A',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          paddingVertical: 12,
          height: 64,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarShowLabel: false,
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
      initialRouteName="index"
    >
      <Tabs.Screen
        name="index"
        options={{
          title: tabsT('home'),
          headerShown: false, // Remove top navigation completely
          tabBarIcon: ({ size, color }) => (
            <MessageSquare size={24} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: tabsT('dashboard'),
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={24} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: tabsT('calendar'),
          tabBarIcon: ({ size, color }) => (
            <Calendar size={24} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="playerboard"
        options={{
          title: tabsT('playerboard'),
          tabBarIcon: ({ size, color }) => (
            <Users size={24} color={color} strokeWidth={1.5} />
          ),
        }}
      />

    </Tabs>
  );
}

const styles = StyleSheet.create({
});