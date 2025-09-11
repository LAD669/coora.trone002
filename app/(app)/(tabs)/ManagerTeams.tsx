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
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { Users, Settings, Plus, ChevronRight, Trophy, Calendar } from 'lucide-react-native';
import { getClubTeams, getClubTeamStats } from '@/lib/supabase';

interface ClubTeam {
  id: string;
  name: string;
  sport: string;
  color: string;
  created_at: string;
  player_count: number;
  recent_matches: number;
  win_rate: number;
  total_points: number;
}

export default function ManagerTeamsScreen() {
  const { t } = useTranslation('manager');
  const { user } = useAuth();
  const [teams, setTeams] = useState<ClubTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.clubId) {
      loadClubTeams();
    }
  }, [user?.clubId]);

  const loadClubTeams = async () => {
    if (!user?.clubId) return;

    try {
      setIsLoading(true);
      const clubTeams = await getClubTeams(user.clubId);
      setTeams(clubTeams);
    } catch (error) {
      console.error('Error loading club teams:', error);
      Alert.alert(t('error'), t('teamsLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClubTeams();
    setRefreshing(false);
  };

  const handleTeamPress = (team: ClubTeam) => {
    // Navigate to team detail with manager permissions
    // This would typically use navigation.navigate('TeamDetail', { teamId: team.id, canEdit: true })
    Alert.alert(t('teamDetails'), `${t('openingTeam')} ${team.name}`);
  };

  const handleCreateTeam = () => {
    // Navigate to create team screen
    Alert.alert(t('createTeam'), t('createTeamDescription'));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('teams')}</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateTeam}>
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>{t('createTeam')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.teamsContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {teams.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color="#8E8E93" />
            <Text style={styles.emptyTitle}>{t('noTeams')}</Text>
            <Text style={styles.emptySubtitle}>{t('noTeamsDescription')}</Text>
            <TouchableOpacity style={styles.emptyActionButton} onPress={handleCreateTeam}>
              <Text style={styles.emptyActionButtonText}>{t('createFirstTeam')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.teamsList}>
            {teams.map((team) => (
              <TouchableOpacity
                key={team.id}
                style={styles.teamCard}
                onPress={() => handleTeamPress(team)}
              >
                <View style={styles.teamHeader}>
                  <View style={styles.teamInfo}>
                    <View style={[styles.teamColorIndicator, { backgroundColor: team.color }]} />
                    <View style={styles.teamDetails}>
                      <Text style={styles.teamName}>{team.name}</Text>
                      <Text style={styles.teamSport}>{team.sport}</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#8E8E93" />
                </View>

                <View style={styles.teamStats}>
                  <View style={styles.statItem}>
                    <Users size={16} color="#8E8E93" />
                    <Text style={styles.statText}>{team.player_count} {t('players')}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Trophy size={16} color="#8E8E93" />
                    <Text style={styles.statText}>{team.win_rate}% {t('winRate')}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Calendar size={16} color="#8E8E93" />
                    <Text style={styles.statText}>{team.recent_matches} {t('recentMatches')}</Text>
                  </View>
                </View>

                <View style={styles.teamFooter}>
                  <Text style={styles.teamCreated}>
                    {t('created')}: {formatDate(team.created_at)}
                  </Text>
                  <View style={styles.teamActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Settings size={16} color="#007AFF" />
                    </TouchableOpacity>
                  </View>
                </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Bold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Urbanist-Medium',
    marginLeft: 4,
  },
  teamsContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyActionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyActionButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Urbanist-Medium',
  },
  teamsList: {
    padding: 20,
  },
  teamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamColorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 2,
  },
  teamSport: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  teamStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginLeft: 4,
  },
  teamFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamCreated: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  teamActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
