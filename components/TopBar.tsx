import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Bell, Settings } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthProvider';
import { useClubNotifications } from '@/hooks/useClubNotifications';

interface TopBarProps {
  title: string;
}

const TOPBAR_CONTENT_HEIGHT = 56;

export default function TopBar({ title }: TopBarProps) {
  const { user, isManager } = useAuth();
  
  // Get unread notifications count for managers
  const { data: unreadNotifications = [] } = useClubNotifications(
    user?.clubId || '',
    user?.id || '',
    true
  );
  const unreadCount = unreadNotifications.length;

  const handleNotificationsPress = () => {
    router.push('/(app)/notifications');
  };

  const handleSettingsPress = () => {
    router.push('/(app)/settings');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleNotificationsPress}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Bell size={24} color="#1A1A1A" strokeWidth={1.5} />
                    {isManager && unreadCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleSettingsPress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Settings size={24} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: TOPBAR_CONTENT_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Urbanist-SemiBold',
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
