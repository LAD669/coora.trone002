import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Users, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthProvider';
import { getClubTeams, getClubTeamPlayerCounts } from '@/lib/api/club';
import { getSafeKey } from '@/lib/helpers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TopBarManager from '@/components/ui/TopBarManager';
import { useRouter } from 'expo-router';

export default function PlayerboardManager() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Early return if user is not available
  if (!user) {
    return null;
  }
  
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load teams on component mount
  useEffect(() => {
    if (!user) {
      console.warn('⚠️ No user object available');
      return;
    }

    if (user.clubId) {
      console.log('🔍 Loading teams for club:', user.clubId);
      loadTeams();
    } else {
      console.warn('⚠️ No club assigned to current user:', {
        userId: user.id,
        email: user.email,
        role: user.role,
        clubId: user.clubId
      });
    }
  }, [user]);

  const loadTeams = async () => {
    if (!user?.clubId) {
      console.warn('⚠️ Cannot load teams: No clubId available');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔄 Loading teams for club:', user.clubId);
      
      const teamsData = await getClubTeams(user.clubId);
      console.log('✅ Teams loaded:', teamsData?.length || 0);
      setTeams(teamsData || []);
    } catch (error) {
      console.error('❌ Error loading teams:', error);
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading teams...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBarManager 
        title="Playerboard" 
        onPressBell={() => router.push("/notifications")} 
        onPressSettings={() => router.push("/settings")} 
      />
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 + insets.bottom + 49 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Club Teams</Text>
          <Text style={styles.headerSubtitle}>Manage and view all teams in your club</Text>
        </View>

        {/* Teams List */}
        {teams.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color="#E5E5E7" strokeWidth={1} />
            <Text style={styles.emptyStateText}>No teams found</Text>
            <Text style={styles.emptyStateSubtext}>
              No teams found for this club.
            </Text>
          </View>
        ) : (
          <View style={styles.teamsContainer}>
            {teams.map((team, index) => (
              <TouchableOpacity
                key={getSafeKey(team, index, 'team')}
                style={styles.teamCard}
                onPress={() => {
                  // TODO: Navigate to team details or player list
                  console.log('Team tapped:', team.name);
                }}
              >
                <View style={styles.teamInfo}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  <Text style={styles.teamSport}>{team.sport}</Text>
                  {team.description && (
                    <Text style={styles.teamDescription}>{team.description}</Text>
                  )}
                </View>
                <ChevronRight size={20} color="#8E8E93" strokeWidth={1.5} />
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  header: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    fontFamily: 'Urbanist-SemiBold',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#C7C7CC',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
  },
  teamsContainer: {
    gap: 16,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 4,
  },
  teamSport: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginBottom: 4,
  },
  teamDescription: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
});
