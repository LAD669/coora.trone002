import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Users, Calendar, Trophy, TrendingUp, Target, Award, Activity, CircleCheck, Circle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { getClubStats, computeStatsFallback } from '@/lib/api/club';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ManagerErrorBoundary } from '@/components/ManagerErrorBoundary';
import { logApiCall, logApiError, logUserAction } from '@/lib/logging';
import TopBarManager from '@/components/ui/TopBarManager';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

// Default stats structure - always visible with zero values
const defaultStats = [
  {
    id: '1',
    title: 'Club Members',
    value: 0,
    icon: Users,
    color: '#8E4EC6',
    change: null,
    changeType: null,
  },
  {
    id: '2',
    title: 'Total Teams',
    value: 0,
    icon: Trophy,
    color: '#FF9500',
    change: null,
    changeType: null,
  },
  {
    id: '3',
    title: 'Active Events',
    value: 0,
    icon: Calendar,
    color: '#007AFF',
    change: null,
    changeType: null,
  },
  {
    id: '4',
    title: 'Upcoming Matches',
    value: 0,
    icon: Target,
    color: '#34C759',
    change: null,
    changeType: null,
  },
];

function DashboardManagerContent() {
  const { t: commonT } = useTranslation('common');
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const fallbackStatsRef = useRef<any>(null);
  
  // Early return if user is not available
  if (!user) {
    return null;
  }

  // React Query hook for club stats with fallback
  const clubStatsQuery = useQuery({
    queryKey: ["clubStats", user.clubId],
    queryFn: () => getClubStats(user.clubId!),
    retry: 1,
    staleTime: 60_000, // 1 minute
    enabled: !!user.clubId,
    onError: async (error) => {
      console.error("getClubStats error:", error);
      // Try fallback if RPC fails
      try {
        const fallbackStats = await computeStatsFallback(user.clubId!);
        fallbackStatsRef.current = fallbackStats;
        console.log("Using fallback stats:", fallbackStats);
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
      }
    }
  });

  // Use RPC data if available, otherwise fallback
  const statsData = clubStatsQuery.data ?? fallbackStatsRef.current;

  // Update stats with real data
  const stats = defaultStats.map(stat => {
    let currentValue: any;

    switch (stat.title) {
      case 'Club Members':
        currentValue = statsData?.memberCount ?? 0;
        break;
      case 'Total Teams':
        currentValue = statsData?.teamCount ?? 0;
        break;
      case 'Active Events':
        currentValue = statsData?.upcomingEventsCount ?? 0;
        break;
      case 'Active Trainings':
        currentValue = statsData?.upcomingEventsCount ?? 0;
        break;
      default:
        currentValue = stat.value;
    }

    return {
      ...stat,
      value: currentValue,
    };
  });

  if (clubStatsQuery.isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{commonT('loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBarManager 
        title="Dashboard" 
        onPressBell={() => router.push("/notifications")} 
        onPressSettings={() => router.push("/settings")} 
      />
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 + insets.bottom + 49 }}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>{commonT('welcomeBack')}, {user?.name}!</Text>
          <Text style={styles.teamName}>Club Manager</Text>
        </View>

        {/* Stats Cards Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Club Statistics</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <TouchableOpacity key={stat.id} style={styles.statCard}>
                  <View style={styles.statHeader}>
                    <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}15` }]}>
                      <IconComponent size={20} color={stat.color} strokeWidth={1.5} />
                    </View>
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.title}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
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
  welcomeSection: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 4,
  },
  teamName: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
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
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
});

export default function DashboardManager() {
  return (
    <ManagerErrorBoundary tabName="Dashboard">
      <DashboardManagerContent />
    </ManagerErrorBoundary>
  );
}
