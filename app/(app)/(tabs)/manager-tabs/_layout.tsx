import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { MessageSquare, Calendar, Users, ChartBar as BarChart3, Settings, Bell, Building2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { useNavigationReady } from '@/hooks/useNavigationReady';
import { getNotifications } from '@/lib/supabase';

export default function ManagerTabLayout() {
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
    if (user?.clubId) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user?.clubId || !user?.id) return;
    
    try {
      // For managers, we might want to show notifications from all teams in the club
      // For now, we'll use a simple approach
      const data = await getNotifications(user.clubId);
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
      initialRouteName="manager-dashboard"
    >
      <Tabs.Screen
        name="manager-dashboard"
        options={{
          title: 'Club Dashboard',
          headerShown: true,
          headerTitle: 'Club Dashboard',
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
            <Building2 size={24} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="manager-infohub"
        options={{
          title: 'Organization',
          headerShown: true,
          headerTitle: 'Organization Hub',
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
        name="manager-calendar"
        options={{
          title: 'Club Calendar',
          headerShown: true,
          headerTitle: 'Club Calendar',
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
            <Calendar size={24} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="manager-playerboard"
        options={{
          title: 'All Teams',
          headerShown: true,
          headerTitle: 'All Teams & Members',
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
            <Users size={24} color={color} strokeWidth={1.5} />
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
