import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '@/contexts/AuthProvider';
import { useClubNotifications, useMarkNotificationRead } from '@/hooks/useClubNotifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Calendar, Users, MapPin, Clock } from 'lucide-react-native';

export default function NotificationsScreen() {
  const { user, isManager } = useAuth();
  const insets = useSafeAreaInsets();

  // Early return if user is not available or not a manager
  if (!user || !isManager || !user.clubId) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Access denied</Text>
          <Text style={styles.errorSubtext}>Only managers can view club notifications</Text>
        </View>
      </View>
    );
  }

  const { data: notifications = [], isLoading, error } = useClubNotifications(
    user.clubId,
    user.id,
    false // Get all notifications, not just unread
  );

  const { mutateAsync: markAsRead } = useMarkNotificationRead(user.clubId, user.id);

  const handleNotificationPress = async (notification: any) => {
    try {
      await markAsRead(notification.id);
      
      // Optional: Navigate to related event/team if applicable
      if (notification.event_id) {
        // Could navigate to event details
        console.log('Navigate to event:', notification.event_id);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar size={20} color="#007AFF" strokeWidth={1.5} />;
      case 'team':
        return <Users size={20} color="#34C759" strokeWidth={1.5} />;
      case 'location':
        return <MapPin size={20} color="#FF9500" strokeWidth={1.5} />;
      default:
        return <Bell size={20} color="#8E8E93" strokeWidth={1.5} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load notifications</Text>
          <Text style={styles.errorSubtext}>Please try again later</Text>
        </View>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Bell size={48} color="#E5E5E7" strokeWidth={1} />
          <Text style={styles.emptyText}>No notifications</Text>
          <Text style={styles.emptySubtext}>
            You'll see club-wide notifications here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 16 + insets.bottom + 49 }]}
      >
        {notifications.map((notification, index) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationCard,
              notification.read_by ? styles.readNotification : styles.unreadNotification
            ]}
            onPress={() => handleNotificationPress(notification)}
            activeOpacity={0.7}
          >
            <View style={styles.notificationHeader}>
              <View style={styles.iconContainer}>
                {getNotificationIcon(notification.notification_type)}
              </View>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
              </View>
              <View style={styles.timeContainer}>
                <Clock size={14} color="#8E8E93" strokeWidth={1.5} />
                <Text style={styles.timeText}>{formatDate(notification.created_at)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  readNotification: {
    opacity: 0.7,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});