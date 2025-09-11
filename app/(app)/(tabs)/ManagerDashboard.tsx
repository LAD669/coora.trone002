import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { getClubMetrics } from '@/lib/supabase';
import { 
  Users, 
  Calendar, 
  Trophy, 
  TrendingUp, 
  DollarSign,
  Activity,
  BarChart3
} from 'lucide-react-native';

export default function ManagerDashboardScreen() {
  const { t } = useTranslation('manager');
  const { user, clubId } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clubId) {
      loadMetrics();
    }
  }, [clubId]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await getClubMetrics(clubId!);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading club metrics:', error);
      Alert.alert(t('error'), t('metricsLoadError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('welcome')}</Text>
        <Text style={styles.subtitle}>{t('clubOverview')}</Text>
      </View>

      {/* KPIs Grid */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Users size={24} color="#007AFF" />
          <Text style={styles.kpiValue}>{metrics?.totalTeams || 0}</Text>
          <Text style={styles.kpiLabel}>{t('metrics.totalTeams')}</Text>
        </View>
        
        <View style={styles.kpiCard}>
          <Activity size={24} color="#34C759" />
          <Text style={styles.kpiValue}>{metrics?.activePlayers || 0}</Text>
          <Text style={styles.kpiLabel}>{t('metrics.activePlayers')}</Text>
        </View>
        
        <View style={styles.kpiCard}>
          <Calendar size={24} color="#FF9500" />
          <Text style={styles.kpiValue}>{metrics?.totalEvents || 0}</Text>
          <Text style={styles.kpiLabel}>{t('metrics.totalEvents')}</Text>
        </View>
        
        <View style={styles.kpiCard}>
          <DollarSign size={24} color="#FF3B30" />
          <Text style={styles.kpiValue}>N/A</Text>
          <Text style={styles.kpiLabel}>{t('metrics.revenue')}</Text>
        </View>
      </View>

      {/* Top Teams */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('metrics.topTeams')}</Text>
        {metrics?.topTeams?.map((team: any, index: number) => (
          <View key={team.id} style={styles.teamCard}>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamSport}>{team.sport}</Text>
            </View>
            <View style={styles.teamStats}>
              <Text style={styles.teamStat}>{team.winRate}% {t('metrics.winRate')}</Text>
              <Text style={styles.teamStat}>{team.points} {t('metrics.points')}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Events Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('metrics.eventsBreakdown')}</Text>
        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>
              {metrics?.eventsBreakdown?.match || 0}
            </Text>
            <Text style={styles.breakdownLabel}>{t('metrics.matches')}</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownValue}>
              {metrics?.eventsBreakdown?.training || 0}
            </Text>
            <Text style={styles.breakdownLabel}>{t('metrics.trainings')}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginTop: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 50,
    fontFamily: 'Urbanist-Regular',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Bold',
    marginTop: 8,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 24,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 16,
  },
  teamCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  teamSport: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginTop: 2,
  },
  teamStats: {
    alignItems: 'flex-end',
  },
  teamStat: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  breakdownGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  breakdownItem: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  breakdownValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Bold',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginTop: 4,
  },
});
