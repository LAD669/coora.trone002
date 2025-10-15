import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import { Users, Trophy, Calendar, Target } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { ManagerErrorBoundary } from '@/components/ManagerErrorBoundary';

type StatItem = {
  id: '1' | '2' | '3' | '4';
  title: string;
  value: number;
  icon: any;
  color: string;
  change: number | null;
  changeType: 'up' | 'down' | null;
};

// Default sichtbare Stats (Fallback)
const defaultStats: StatItem[] = [
  { id: '1', title: 'Club Members',     value: 0, icon: Users,   color: '#8E4EC6', change: null, changeType: null },
  { id: '2', title: 'Total Teams',      value: 0, icon: Trophy,  color: '#FF9500', change: null, changeType: null },
  { id: '3', title: 'Active Events',    value: 0, icon: Calendar, color: '#007AFF', change: null, changeType: null },
  { id: '4', title: 'Upcoming Matches', value: 0, icon: Target,  color: '#34C759', change: null, changeType: null },
];

function findClubId(obj: any): string | null {
  if (!obj || typeof obj !== 'object') return null;
  
  // Check for various possible club ID property names
  const possibleKeys = ['club_id', 'clubId', 'club-id', 'clubId', 'club', 'organization_id', 'org_id'];
  for (const key of possibleKeys) {
    if (key in obj && typeof obj[key] === 'string' && obj[key].length > 0) {
      console.log(`[Dashboard] Found club ID with key '${key}':`, obj[key]);
      return obj[key];
    }
  }
  
  // Recursively search through all properties
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const result = findClubId(obj[key]);
      if (result) return result;
    }
  }
  
  return null;
}

function debugSessionStructure(obj: any, path = ''): void {
  if (!obj || typeof obj !== 'object') return;
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const currentPath = path ? `${path}.${key}` : key;
      const value = obj[key];
      
      // Log properties that might contain club information
      if (key.toLowerCase().includes('club') || key.toLowerCase().includes('team')) {
        console.log(`[Dashboard] Found potential club property at '${currentPath}':`, value);
      }
      
      // Recursively debug nested objects (but limit depth to avoid infinite loops)
      if (typeof value === 'object' && value !== null && path.split('.').length < 5) {
        debugSessionStructure(value, currentPath);
      }
    }
  }
}

async function resolveClubId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  console.log('[Dashboard] Full session object:', JSON.stringify(session, null, 2));
  
  // Debug session structure to find potential club properties
  console.log('[Dashboard] Debugging session structure for club-related properties...');
  debugSessionStructure(session);
  
  // Use recursive search to find club_id anywhere in the session
  let clubId = findClubId(session?.user);
  
  // If not found in user object, search the entire session
  if (!clubId) {
    clubId = findClubId(session);
  }
  
  // Fallback to profiles table if still not found
  if (!clubId && session?.user?.id) {
    console.log('[Dashboard] Club ID not found in session, checking profiles table...');
    const { data: profile } = await supabase
      .from('profiles')
      .select('club_id')
      .eq('id', session.user.id)
      .single();
    clubId = profile?.club_id ?? null;
    console.log('[Dashboard] Profile lookup result:', profile);
  }

  console.log('[Dashboard] resolved clubId:', clubId);
  return clubId;
}

function DashboardManagerContent() {
  const { t: commonT } = useTranslation('common');
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const [stats, setStats] = useState<StatItem[]>(defaultStats);
  const [refreshing, setRefreshing] = useState(false);
  const [clubId, setClubId] = useState<string | null>(null);

  // hole clubId einmalig aus der aktuellen Session
  useEffect(() => {
    (async () => {
      let cid = await resolveClubId();
      
      // Final fallback: check AuthContext user object
      if (!cid && user?.clubId) {
        cid = user.clubId;
        console.log('[Dashboard] Using club ID from AuthContext:', cid);
      }
      
      setClubId(cid);
      console.log('[Dashboard] resolved clubId for fetch:', cid);
      if (!cid) {
        console.warn('[Dashboard] ⚠️ No club ID found! This will prevent data loading.');
        console.log('[Dashboard] Available user object:', user);
      } else {
        console.log('[Dashboard] ✅ Club ID found, data loading should work.');
      }
    })();
  }, [user]);

  const fetchCounts = useCallback(async () => {
    if (!clubId) {
      console.warn('[Dashboard] Kein clubId vorhanden – überspringe fetch.');
      return;
    }
    console.log('[Dashboard] Lade Counts für clubId:', clubId);

    const { data, error } = await supabase.rpc('get_dashboard_counts', { p_club_id: clubId });
    
    if (error) {
      console.error('[Dashboard] RPC get_dashboard_counts error:', error.message);
      console.error('[Dashboard] RPC error details:', error);
      return;
    }
    
    console.log('[Dashboard] RPC result:', data);
    console.log('[Dashboard] RPC data type:', typeof data, 'is array:', Array.isArray(data));

    const row = data?.[0];
    if (!row) {
      console.warn('[Dashboard] RPC lieferte kein Row-Result.');
      console.warn('[Dashboard] Data structure:', data);
      return;
    }

    console.log('[Dashboard] Row data:', row);
    console.log('[Dashboard] Updating stats with:', {
      total_teams: row.total_teams,
      active_events: row.active_events,
      upcoming_matches: row.upcoming_matches
    });

    // Werte in Karten per ID setzen (nicht per Titel, damit Strings egal sind)
    setStats(prev => {
      const updated = prev.map(item => {
        if (item.id === '2') return { ...item, value: Number(row.total_teams ?? 0) };
        if (item.id === '3') return { ...item, value: Number(row.active_events ?? 0) };
        if (item.id === '4') return { ...item, value: Number(row.upcoming_matches ?? 0) };
        return item; // '1' Club Members bleibt (0) bis du Users-Anbindung baust
      });
      console.log('[Dashboard] Stats updated successfully:', updated.map(s => ({ title: s.title, value: s.value })));
      return updated;
    });
  }, [clubId]);

  // initial laden
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  // beim Fokus neu laden
  useFocusEffect(
    useCallback(() => {
      fetchCounts();
    }, [fetchCounts])
  );

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCounts();
    setRefreshing(false);
  }, [fetchCounts]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 + tabBarHeight }}
        contentInsetAdjustmentBehavior="never"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>{commonT('welcomeBack')}!</Text>
          <Text style={styles.teamName}>Club Manager</Text>
        </View>

        {/* Stats Cards Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Club Statistics</Text>
          <View style={styles.statsGrid}>
            {stats.map(card => {
              const Icon = card.icon;
              return (
                <View
                  key={card.id}
                  style={styles.statCard}
                >
                  <View style={styles.statHeader}>
                    <View style={[styles.statIconContainer, { backgroundColor: `${card.color}15` }]}>
                      <Icon size={20} color={card.color} strokeWidth={1.5} />
                    </View>
                  </View>
                  <Text style={styles.statValue}>{card.value}</Text>
                  <Text style={styles.statLabel}>{card.title}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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

