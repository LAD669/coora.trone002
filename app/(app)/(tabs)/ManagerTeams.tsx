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
import { getClubTeams } from '@/lib/supabase';
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  Calendar,
  Plus,
  Edit
} from 'lucide-react-native';

export default function ManagerTeamsScreen() {
  const { t } = useTranslation('manager');
  const { clubId } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clubId) {
      loadTeams();
    }
  }, [clubId]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await getClubTeams(clubId!);
      setTeams(data);
    } catch (error) {
      console.error('Error loading club teams:', error);
      Alert.alert(t('error'), t('teamsLoadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleTeamPress = (team: any) => {
    // Navigate to team detail screen with edit permissions
    Alert.alert(
      t('teamDetails'),
      `${team.name} - ${team.sport}\n${team.player_count} ${t('players')}`
    );
  };

  const handleCreateTeam = () => {
    Alert.alert(t('createTeam'), t('createTeamDescription'));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  if (teams.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Users size={48} color="#8E8E93" />
          <Text style={styles.emptyTitle}>{t('noTeams')}</Text>
          <Text style={styles.emptyDescription}>{t('noTeamsDescription')}</Text>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateTeam}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>{t('createFirstTeam')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('teams')}</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateTeam}>
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>{t('createTeam')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.teamsList}>
        {teams.map((team) => (
          <TouchableOpacity
            key={team.id}
            style={styles.teamCard}
            onPress={() => handleTeamPress(team)}
          >
            <View style={styles.teamHeader}>
              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{team.name}</Text>
                <Text style={styles.teamSport}>{team.sport}</Text>
              </View>
              <View style={styles.teamActions}>
                <TouchableOpacity style={styles.editButton}>
                  <Edit size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.teamStats}>
              <View style={styles.statItem}>
                <Users size={16} color="#8E8E93" />
                <Text style={styles.statValue}>{team.player_count}</Text>
                <Text style={styles.statLabel}>{t('players')}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Trophy size={16} color="#8E8E93" />
                <Text style={styles.statValue}>{team.win_rate}%</Text>
                <Text style={styles.statLabel}>{t('winRate')}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Calendar size={16} color="#8E8E93" />
                <Text style={styles.statValue}>{team.recent_matches}</Text>
                <Text style={styles.statLabel}>{t('recentMatches')}</Text>
              </View>
            </View>
            
            <View style={styles.teamFooter}>
              <Text style={styles.teamCreated}>
                {t('created')}: {new Date(team.created_at).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Bold',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 50,
    fontFamily: 'Urbanist-Regular',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-SemiBold',
  },
  teamsList: {
    paddingHorizontal: 24,
  },
  teamCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
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
  teamActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
  },
  teamStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  teamFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  teamCreated: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
});
