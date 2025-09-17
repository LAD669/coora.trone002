import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { useNavigationReady } from '@/hooks/useNavigationReady';
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  BarChart3, 
  TrendingUp,
  Building2,
  Clock,
  Star
} from 'lucide-react-native';
import { getManagerClubOverview, getClubStats, getAllClubEvents, getClubOrganizationPosts } from '@/lib/supabase';

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
  const { safePush } = useNavigationReady();
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
    safePush('/(app)/manager-tabs/manager-playerboard');
  };

  const handleNavigateToCalendar = () => {
    safePush('/(app)/manager-tabs/manager-calendar');
  };

  const handleNavigateToInfohub = () => {
    safePush('/(app)/manager-tabs/manager-infohub');
  };

  const renderStatCard = (title: string, value: string | number, icon: React.ReactNode, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const renderQuickAction = (title: string, icon: React.ReactNode, onPress: () => void, color: string) => (
    <TouchableOpacity 
      style={[styles.quickAction, { backgroundColor: color + '10' }]} 
      onPress={onPress}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        {icon}
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading club data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Building2 size={24} color="#1A1A1A" strokeWidth={1.5} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Club Manager</Text>
              <Text style={styles.headerSubtitle}>
                {clubOverview?.club_name || 'Loading...'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {renderStatCard(
            'Total Teams',
            clubOverview?.total_teams || 0,
            <Users size={20} color="#3B82F6" strokeWidth={1.5} />,
            '#3B82F6'
          )}
          {renderStatCard(
            'Total Players',
            clubOverview?.total_players || 0,
            <Users size={20} color="#10B981" strokeWidth={1.5} />,
            '#10B981'
          )}
          {renderStatCard(
            'Total Events',
            clubOverview?.total_events || 0,
            <Calendar size={20} color="#F59E0B" strokeWidth={1.5} />,
            '#F59E0B'
          )}
          {renderStatCard(
            'Active Trainers',
            clubOverview?.total_trainers || 0,
            <Star size={20} color="#8B5CF6" strokeWidth={1.5} />,
            '#8B5CF6'
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {renderQuickAction(
              'Manage Teams',
              <Users size={24} color="#FFFFFF" strokeWidth={1.5} />,
              handleNavigateToTeams,
              '#3B82F6'
            )}
            {renderQuickAction(
              'Club Calendar',
              <Calendar size={24} color="#FFFFFF" strokeWidth={1.5} />,
              handleNavigateToCalendar,
              '#10B981'
            )}
            {renderQuickAction(
              'Info Hub',
              <MessageSquare size={24} color="#FFFFFF" strokeWidth={1.5} />,
              handleNavigateToInfohub,
              '#F59E0B'
            )}
            {renderQuickAction(
              'Analytics',
              <BarChart3 size={24} color="#FFFFFF" strokeWidth={1.5} />,
              () => Alert.alert('Coming Soon', 'Analytics feature will be available soon'),
              '#8B5CF6'
            )}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          {/* Recent Events */}
          <View style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <Calendar size={20} color="#3B82F6" strokeWidth={1.5} />
              <Text style={styles.activityTitle}>Upcoming Events</Text>
            </View>
            {recentEvents.length > 0 ? (
              recentEvents.map((event, index) => (
                <View key={index} style={styles.activityItem}>
                  <Text style={styles.activityText}>{event.title}</Text>
                  <Text style={styles.activitySubtext}>
                    {new Date(event.event_date).toLocaleDateString()}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No upcoming events</Text>
            )}
          </View>

          {/* Recent Posts */}
          <View style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <MessageSquare size={20} color="#10B981" strokeWidth={1.5} />
              <Text style={styles.activityTitle}>Recent Posts</Text>
            </View>
            {recentPosts.length > 0 ? (
              recentPosts.map((post, index) => (
                <View key={index} style={styles.activityItem}>
                  <Text style={styles.activityText}>{post.title}</Text>
                  <Text style={styles.activitySubtext}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No recent posts</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Bold',
  },
  statTitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginLeft: 8,
  },
  activityItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
    marginBottom: 4,
  },
  activitySubtext: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
