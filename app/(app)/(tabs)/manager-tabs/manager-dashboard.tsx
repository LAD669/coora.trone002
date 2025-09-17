import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import Header from '@/components/Header';
import { Users, Calendar, Trophy, TrendingUp, Target, Award, Activity, Building2, Users2, CalendarDays, MessageSquare } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { getManagerClubOverview, getClubStats, getAllClubTeams, getAllClubUsers, getAllClubEvents, getClubOrganizationPosts } from '@/lib/supabase';

// Manager-specific stats structure
const managerStats = [
  {
    id: '1',
    title: 'Total Teams',
    value: 0,
    icon: Users2,
    color: '#34C759',
    change: null,
    changeType: null,
  },
  {
    id: '2',
    title: 'Total Players',
    value: 0,
    icon: Users,
    color: '#FF9500',
    change: null,
    changeType: null,
  },
  {
    id: '3',
    title: 'Total Trainers',
    value: 0,
    icon: Award,
    color: '#007AFF',
    change: null,
    changeType: null,
  },
  {
    id: '4',
    title: 'Total Events',
    value: 0,
    icon: CalendarDays,
    color: '#AF52DE',
    change: null,
    changeType: null,
  },
];

interface ClubOverview {
  club_id: string;
  club_name: string;
  club_description: string;
  club_logo: string;
  total_teams: number;
  total_users: number;
  total_players: number;
  total_trainers: number;
  total_managers: number;
  total_events: number;
  total_matches: number;
  total_trainings: number;
}

export default function ManagerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [clubOverview, setClubOverview] = useState<ClubOverview | null>(null);
  const [clubStats, setClubStats] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadClubData = async () => {
    if (!user?.clubId) {
      console.log('No club ID found for manager');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Load club overview
      const overview = await getManagerClubOverview(user.clubId);
      setClubOverview(overview);

      // Load club stats
      const stats = await getClubStats(user.clubId);
      setClubStats(stats);

      // Load recent events (last 5)
      const events = await getAllClubEvents(user.clubId);
      setRecentEvents(events.slice(0, 5));

      // Load recent organization posts (last 5)
      const posts = await getClubOrganizationPosts(user.clubId);
      setRecentPosts(posts.slice(0, 5));

    } catch (error) {
      console.error('Error loading club data:', error);
      Alert.alert('Error', 'Failed to load club data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClubData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadClubData();
  }, [user?.clubId]);

  const handleNavigateToTeams = () => {
    router.push('/(app)/(tabs)/manager-playerboard');
  };

  const handleNavigateToCalendar = () => {
    router.push('/(app)/(tabs)/manager-calendar');
  };

  const handleNavigateToInfohub = () => {
    router.push('/(app)/(tabs)/manager-infohub');
  };

  const renderStatCard = (stat: any) => {
    const IconComponent = stat.icon;
    return (
      <View key={stat.id} style={[styles.statCard, { borderLeftColor: stat.color }]}>
        <View style={styles.statHeader}>
          <IconComponent size={24} color={stat.color} />
          <Text style={styles.statTitle}>{stat.title}</Text>
        </View>
        <Text style={styles.statValue}>{stat.value}</Text>
        {stat.change !== null && (
          <View style={styles.statChange}>
            <TrendingUp 
              size={16} 
              color={stat.changeType === 'increase' ? '#34C759' : '#FF3B30'} 
            />
            <Text style={[
              styles.statChangeText,
              { color: stat.changeType === 'increase' ? '#34C759' : '#FF3B30' }
            ]}>
              {stat.change}%
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderQuickAction = (title: string, icon: any, onPress: () => void, color: string) => {
    const IconComponent = icon;
    return (
      <TouchableOpacity style={styles.quickAction} onPress={onPress}>
        <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
          <IconComponent size={24} color="white" />
        </View>
        <Text style={styles.quickActionText}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const renderRecentEvent = (event: any) => (
    <TouchableOpacity key={event.id} style={styles.recentItem}>
      <View style={styles.recentItemHeader}>
        <Calendar size={16} color="#666" />
        <Text style={styles.recentItemDate}>
          {new Date(event.event_date).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.recentItemTitle}>{event.title}</Text>
      <Text style={styles.recentItemSubtitle}>
        {event.teams?.name} • {event.location}
      </Text>
    </TouchableOpacity>
  );

  const renderRecentPost = (post: any) => (
    <TouchableOpacity key={post.id} style={styles.recentItem}>
      <View style={styles.recentItemHeader}>
        <MessageSquare size={16} color="#666" />
        <Text style={styles.recentItemDate}>
          {new Date(post.created_at).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.recentItemTitle}>{post.title}</Text>
      <Text style={styles.recentItemSubtitle}>
        {post.users?.name} • {post.teams?.name}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title={t('dashboard.title')} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading club data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={`${clubOverview?.club_name || 'Club'} Dashboard`} />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Club Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Building2 size={20} color="#333" />
            <Text style={styles.sectionTitle}>Club Overview</Text>
          </View>
          <View style={styles.clubInfo}>
            <Text style={styles.clubName}>{clubOverview?.club_name}</Text>
            {clubOverview?.club_description && (
              <Text style={styles.clubDescription}>{clubOverview.club_description}</Text>
            )}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color="#333" />
            <Text style={styles.sectionTitle}>Club Statistics</Text>
          </View>
          <View style={styles.statsGrid}>
            {managerStats.map(stat => {
              const updatedStat = {
                ...stat,
                value: stat.id === '1' ? clubOverview?.total_teams || 0 :
                       stat.id === '2' ? clubOverview?.total_players || 0 :
                       stat.id === '3' ? clubOverview?.total_trainers || 0 :
                       stat.id === '4' ? clubOverview?.total_events || 0 : 0
              };
              return renderStatCard(updatedStat);
            })}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={20} color="#333" />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickActionsGrid}>
            {renderQuickAction('All Teams', Users2, handleNavigateToTeams, '#34C759')}
            {renderQuickAction('Club Calendar', Calendar, handleNavigateToCalendar, '#007AFF')}
            {renderQuickAction('Organization', MessageSquare, handleNavigateToInfohub, '#FF9500')}
          </View>
        </View>

        {/* Recent Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#333" />
            <Text style={styles.sectionTitle}>Recent Events</Text>
          </View>
          {recentEvents.length > 0 ? (
            recentEvents.map(renderRecentEvent)
          ) : (
            <Text style={styles.emptyText}>No recent events</Text>
          )}
        </View>

        {/* Recent Organization Posts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageSquare size={20} color="#333" />
            <Text style={styles.sectionTitle}>Recent Organization Posts</Text>
          </View>
          {recentPosts.length > 0 ? (
            recentPosts.map(renderRecentPost)
          ) : (
            <Text style={styles.emptyText}>No recent organization posts</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  clubInfo: {
    marginBottom: 8,
  },
  clubName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  clubDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statChangeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  recentItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  recentItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recentItemDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  recentItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  recentItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
});
