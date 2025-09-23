import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { MessageSquare, Calendar, Users, ChartBar as BarChart3 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TopBar from '@/components/TopBar';

const TABBAR_CONTENT_HEIGHT = 49;

export default function ManagerTabs() {
  const { t: tabsT } = useTranslation('tabs');
  const [activeTabTitle, setActiveTabTitle] = useState('Info-Hub');
  const insets = useSafeAreaInsets();

  const getTabTitle = (tabName: string) => {
    switch (tabName) {
      case 'infohub': return 'Info-Hub';
      case 'dashboard': return 'Dashboard';
      case 'calendar': return 'Kalender';
      case 'playerboard': return 'Playerboard';
      default: return 'Info-Hub';
    }
  };

  return (
    <View style={styles.container}>
      <TopBar title={activeTabTitle} />
      <Tabs
        screenOptions={{
          headerShown: false, // Hide default headers
          tabBarActiveTintColor: '#1A1A1A',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            height: TABBAR_CONTENT_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 6,
            position: 'absolute',   // ensures it's anchored to screen bottom
            left: 0, right: 0, bottom: 0,
            borderTopWidth: StyleSheet.hairlineWidth,
            backgroundColor: '#fff',
            elevation: 0, shadowOpacity: 0,
          },
          tabBarItemStyle: { paddingVertical: 2 },
          tabBarLabelStyle: { marginBottom: 0 },
          tabBarShowLabel: false,
          tabBarIconStyle: {
            marginTop: 0,
          },
          tabBarHideOnKeyboard: false,
        }}
        initialRouteName="infohub"
        screenListeners={{
          tabPress: (e) => {
            const tabName = e.target?.split('-')[0];
            if (tabName) {
              setActiveTabTitle(getTabTitle(tabName));
            }
          },
        }}
      >
        <Tabs.Screen
          name="infohub"
          options={{
            title: tabsT('home'),
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});