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
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { Trophy, TrendingUp, Users, Calendar, DollarSign, Activity } from 'lucide-react-native';
import { getClubMetrics } from '@/lib/supabase';

interface ClubMetrics {
  topTeams: Array<{
    id: string;
    name: string;
    winRate: number;
    points: number;
    recentMatches: number;
  }>;
  revenue: number | null;
  expenses: number | null;
  net: number | null;
  eventsCountByType: {
    matches: number;
    trainings: number;
  };
  activePlayers: number;
  totalTeams: number;
}

export default function ManagerDashboardScreen() {
  const { t } = useTranslation('manager');
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ClubMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.clubId) {
      loadClubMetrics();
    }
  }, [user?.clubId]);

  const loadClubMetrics = async () => {
    if (!user?.clubId) return;

    try {
      setIsLoading(true);
      const clubMetrics = await getClubMetrics(user.clubId);
      setMetrics(clubMetrics);
    } catch (error) {
      console.error('Error loading club metrics:', error);
      Alert.alert(t('error'), t('metricsLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClubMetrics();
    setRefreshing(false);
  };

  const renderMetricCard = (
    title: string,
    value: string | number,
    icon: React.ComponentType<any>,
    color: string,
    subtitle?: string
  ) => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: color + '15' }]}>
          {React.createElement(icon, { size: 24, color: color })}
        </View>
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderTopTeams = () => {
    if (!metrics?.topTeams?.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('metrics.topTeams')}</Text>
        {metrics.topTeams.map((team, index) => (
          <View key={team.id} style={styles.teamCard}>
            <View style={styles.teamRank}>
              <Text style={styles.teamRankText}>#{index + 1}</Text>
            </View>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamStats}>
                {t('metrics.winRate')}: {team.winRate}% • {t('metrics.points')}: {team.points}
              </Text>
            </View>
            <View style={styles.teamBadge}>
              <Trophy size={20} color="#FF9500" />
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>{t('welcome')}</Text>
        <Text style={styles.subtitleText}>{t('clubOverview')}</Text>
      </View>

      <View style={styles.metricsGrid}>
        {renderMetricCard(
          t('metrics.totalTeams'),
          metrics?.totalTeams || 0,
          Users,
          '#8E4EC6'
        )}
        {renderMetricCard(
          t('metrics.activePlayers'),
          metrics?.activePlayers || 0,
          Activity,
          '#34C759'
        )}
        {renderMetricCard(
          t('metrics.totalEvents'),
          (metrics?.eventsCountByType?.matches || 0) + (metrics?.eventsCountByType?.trainings || 0),
          Calendar,
          '#007AFF'
        )}
        {renderMetricCard(
          t('metrics.revenue'),
          metrics?.revenue ? `€${metrics.revenue.toLocaleString()}` : 'N/A',
          DollarSign,
          '#34C759',
          metrics?.expenses ? `-€${metrics.expenses.toLocaleString()}` : undefined
        )}
      </View>

      {renderTopTeams()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('metrics.eventsBreakdown')}</Text>
        <View style={styles.eventsBreakdown}>
          <View style={styles.eventTypeCard}>
            <Text style={styles.eventTypeTitle}>{t('metrics.matches')}</Text>
            <Text style={styles.eventTypeCount}>{metrics?.eventsCountByType?.matches || 0}</Text>
          </View>
          <View style={styles.eventTypeCard}>
            <Text style={styles.eventTypeTitle}>{t('metrics.trainings')}</Text>
            <Text style={styles.eventTypeCount}>{metrics?.eventsCountByType?.trainings || 0}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Bold',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  metricTitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Bold',
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#FF3B30',
    fontFamily: 'Urbanist-Regular',
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 16,
  },
  teamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  teamRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamRankText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 2,
  },
  teamStats: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  teamBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF950015',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventsBreakdown: {
    flexDirection: 'row',
    gap: 12,
  },
  eventTypeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventTypeTitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginBottom: 4,
  },
  eventTypeCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Bold',
  },
});
