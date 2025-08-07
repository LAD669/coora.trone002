import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { MessageSquare, Calendar, Users, ChartBar as BarChart3, Zap, Settings, Bell } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { useNavigationReady } from '@/hooks/useNavigationReady';
import { getNotifications } from '@/lib/supabase';

export default function TabLayout() {
  const { t: tabsT } = useTranslation('tabs');
  const { t: commonT } = useTranslation('common');
  const { user } = useAuth();
  const { safePush } = useNavigationReady();
  
  // Early return if user is not available
  if (!user) {
    return null;
  }
  
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications and count unread ones
  useEffect(() => {
    if (user?.teamId) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user?.teamId || !user?.id) return;
    
    try {
      const data = await getNotifications(user.teamId);
      // Count truly unread notifications (where user ID is not in read_by array)
      const unread = (data || []).filter(notification => {
        const readBy = notification.read_by || [];
        return !readBy.includes(user.id);
      }).length;
      
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setUnreadCount(0);
    }
  };

  const handleNotifications = () => {
            safePush('/(app)/notifications');
  };

  const HeaderRight = () => (
    <View style={styles.headerRight}>
      <TouchableOpacity 
        style={styles.iconButton}
        onPress={handleNotifications}
      >
        <Bell size={20} color="#1A1A1A" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>
              {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.iconButton}
        onPress={() => safePush('/(app)/settings')}
      >
        <Settings size={20} color="#1A1A1A" strokeWidth={1.5} />
      </TouchableOpacity>
    </View>
  );

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
          headerShown: true,
          headerTitle: 'Info-Hub',
          headerTitleStyle: {
            fontSize: 28,
            fontFamily: 'Urbanist-SemiBold',
            fontWeight: '600',
            color: '#1A1A1A',
            letterSpacing: -0.5,
          },
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerShadowVisible: false,
          headerTitleAlign: 'left',
          headerLeftContainerStyle: {
            paddingLeft: 24,
          },
          headerRightContainerStyle: {
            paddingRight: 24,
          },
          headerRight: HeaderRight,
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
      <Tabs.Screen
        name="live-ticker"
        options={{
          title: commonT('liveTicker'),
          href: '/live-ticker',
          tabBarIcon: ({ size, color }) => (
            <Zap size={24} color={color} strokeWidth={1.5} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-SemiBold',
  },
});