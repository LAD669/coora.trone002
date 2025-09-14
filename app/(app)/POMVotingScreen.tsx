import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { 
  getCompletedMatchesForPOM, 
  getPOMVotingStatus, 
  submitPOMVote, 
  getUserPOMVote,
  getTeamPlayersForPOM,
  closePOMVoting
} from '@/lib/supabase';
import { 
  Trophy, 
  Users, 
  Award, 
  ChevronRight, 
  Clock, 
  CheckCircle, 
  X,
  Star,
  Medal,
  Crown,
  ArrowLeft
} from 'lucide-react-native';

interface Match {
  id: string;
  title: string;
  event_date: string;
  location: string;
  match_results?: {
    id: string;
    team_score: number;
    opponent_score: number;
    opponent_name: string;
    match_outcome: string;
  }[];
}

interface Player {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  position?: string;
}

interface POMVote {
  first_place_player_id?: string;
  second_place_player_id?: string;
  third_place_player_id?: string;
}

export default function POMVotingScreen() {
  const { t: commonT } = useTranslation('common');
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [votingStatus, setVotingStatus] = useState<any>(null);
  const [userVote, setUserVote] = useState<POMVote>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.teamId) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.teamId) return;

    setIsLoading(true);
    try {
      const [matchesData, playersData] = await Promise.all([
        getCompletedMatchesForPOM(user.teamId),
        getTeamPlayersForPOM(user.teamId, user.id)
      ]);

      console.log('🔍 POM - Final data loaded:', {
        matchesCount: matchesData?.length || 0,
        playersCount: playersData?.length || 0,
        players: playersData?.map(p => ({
          id: p.id,
          name: p.name,
          position: p.position
        }))
      });
      
      setMatches(matchesData || []);
      setPlayers(playersData || []);
    } catch (error) {
      console.error('Error loading POM data:', error);
      Alert.alert(commonT('error'), commonT('somethingWentWrong'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatchSelect = async (match: Match) => {
    if (!user?.teamId || !user?.id) return;

    setSelectedMatch(match);
    
    try {
      const [status, vote] = await Promise.all([
        getPOMVotingStatus(match.id, user.teamId),
        getUserPOMVote(match.id, user.id)
      ]);

      setVotingStatus(status);
      setUserVote({
        first_place_player_id: vote?.first_place_player_id,
        second_place_player_id: vote?.second_place_player_id,
        third_place_player_id: vote?.third_place_player_id,
      });
    } catch (error) {
      console.error('Error loading match voting data:', error);
      Alert.alert(commonT('error'), commonT('somethingWentWrong'));
    }
  };

  const handlePlayerVote = (position: 'first' | 'second' | 'third', playerId: string) => {
    console.log('🗳️ POM - Player vote clicked:', {
      position,
      playerId,
      playerName: players.find(p => p.id === playerId)?.name,
      currentVote: userVote
    });

    setUserVote(prev => {
      const newVote = { ...prev };
      
      // If this player is already selected in another position, remove them
      Object.keys(newVote).forEach(pos => {
        if (newVote[pos as keyof POMVote] === playerId && pos !== `${position}_place_player_id`) {
          newVote[pos as keyof POMVote] = undefined;
        }
      });
      
      // Toggle the selection for the current position
      const positionKey = `${position}_place_player_id` as keyof POMVote;
      if (newVote[positionKey] === playerId) {
        newVote[positionKey] = undefined; // Deselect if already selected
      } else {
        newVote[positionKey] = playerId; // Select the player
      }
      
      console.log('🗳️ POM - New vote state:', newVote);
      return newVote;
    });
  };

  const submitVote = async () => {
    if (!selectedMatch || !user?.teamId || !user?.id) return;

    if (!userVote.first_place_player_id) {
      Alert.alert(commonT('error'), 'Please select at least a first place player.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPOMVote({
        eventId: selectedMatch.id,
        voterId: user.id,
        teamId: user.teamId,
        firstPlacePlayerId: userVote.first_place_player_id,
        secondPlacePlayerId: userVote.second_place_player_id,
        thirdPlacePlayerId: userVote.third_place_player_id,
      });

      Alert.alert(
        commonT('success'), 
        'Your POM vote has been submitted successfully!',
        [
          {
            text: commonT('confirm'),
            onPress: () => {
              setSelectedMatch(null);
              setUserVote({});
              setVotingStatus(null);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting POM vote:', error);
      Alert.alert(commonT('error'), commonT('somethingWentWrong'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeVoting = async () => {
    if (!selectedMatch || !user?.teamId || !user?.id) return;

    Alert.alert(
      'Close Voting',
      'Are you sure you want to close voting for this match? This action cannot be undone.',
      [
        { text: commonT('cancel'), style: 'cancel' },
        {
          text: 'Close Voting',
          style: 'destructive',
          onPress: async () => {
            try {
              await closePOMVoting(selectedMatch.id, user.teamId!, user.id);
              Alert.alert(commonT('success'), 'Voting has been closed successfully!');
              setSelectedMatch(null);
              setVotingStatus(null);
              setUserVote({});
            } catch (error) {
              console.error('Error closing voting:', error);
              Alert.alert(commonT('error'), commonT('somethingWentWrong'));
            }
          }
        }
      ]
    );
  };

  const getPlayerName = (playerId: string | undefined) => {
    if (!playerId) return 'Unknown Player';
    const player = players.find(p => p.id === playerId);
    return player ? (player.name || `${player.first_name} ${player.last_name}`.trim()) : 'Unknown Player';
  };

  const isPlayerSelected = (playerId: string) => {
    return Object.values(userVote).some(vote => vote === playerId);
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown size={20} color="#FFD700" strokeWidth={2} />;
      case 2: return <Medal size={20} color="#C0C0C0" strokeWidth={2} />;
      case 3: return <Award size={20} color="#CD7F32" strokeWidth={2} />;
      default: return <Star size={20} color="#8E8E93" strokeWidth={2} />;
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return '#8E8E93';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{commonT('loading')}</Text>
      </View>
    );
  }

  if (!selectedMatch) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#007AFF" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>POM Voting</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.introSection}>
            <View style={styles.introIcon}>
              <Trophy size={24} color="#FFD700" strokeWidth={2} />
            </View>
            <Text style={styles.introTitle}>Player of the Match Voting</Text>
            <Text style={styles.introDescription}>
              Vote for the best players from completed matches
            </Text>
            <View style={styles.pointsInfo}>
              <View style={styles.pointItem}>
                <Crown size={16} color="#FFD700" strokeWidth={2} />
                <Text style={styles.pointText}>1st Place: 100 points</Text>
              </View>
              <View style={styles.pointItem}>
                <Medal size={16} color="#C0C0C0" strokeWidth={2} />
                <Text style={styles.pointText}>2nd Place: 50 points</Text>
              </View>
              <View style={styles.pointItem}>
                <Award size={16} color="#CD7F32" strokeWidth={2} />
                <Text style={styles.pointText}>3rd Place: 25 points</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select a Match</Text>
            {matches.length === 0 ? (
              <View style={styles.emptyState}>
                <Trophy size={48} color="#E5E5E7" strokeWidth={1} />
                <Text style={styles.emptyStateText}>No completed matches found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Matches will appear here once they are completed
                </Text>
              </View>
            ) : (
              matches.map((match) => (
                <TouchableOpacity
                  key={match.id}
                  style={styles.matchCard}
                  onPress={() => handleMatchSelect(match)}
                >
                  <View style={styles.matchInfo}>
                    <Text style={styles.matchTitle}>{match.title}</Text>
                    <Text style={styles.matchDate}>
                      {new Date(match.event_date).toLocaleDateString()}
                    </Text>
                    <Text style={styles.matchLocation}>{match.location}</Text>
                    {match.match_results && match.match_results.length > 0 && (
                      <View style={styles.matchResult}>
                        <Text style={styles.matchScore}>
                          {match.match_results[0].team_score} - {match.match_results[0].opponent_score}
                        </Text>
                        <Text style={styles.matchOutcome}>
                          vs {match.match_results[0].opponent_name}
                        </Text>
                      </View>
                    )}
                  </View>
                  <ChevronRight size={20} color="#8E8E93" strokeWidth={1.5} />
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setSelectedMatch(null)}
        >
          <ArrowLeft size={24} color="#007AFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>POM Voting</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.matchHeader}>
          <Text style={styles.matchTitle}>{selectedMatch.title}</Text>
          <Text style={styles.matchDate}>
            {new Date(selectedMatch.event_date).toLocaleDateString()}
          </Text>
          <Text style={styles.matchLocation}>{selectedMatch.location}</Text>
          {selectedMatch.match_results && selectedMatch.match_results.length > 0 && (
            <View style={styles.matchResult}>
              <Text style={styles.matchScore}>
                {selectedMatch.match_results[0].team_score} - {selectedMatch.match_results[0].opponent_score}
              </Text>
              <Text style={styles.matchOutcome}>
                vs {selectedMatch.match_results[0].opponent_name}
              </Text>
            </View>
          )}
        </View>

        {votingStatus?.voting_closed ? (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <CheckCircle size={24} color="#34C759" strokeWidth={2} />
              <Text style={styles.resultsTitle}>Voting Results</Text>
            </View>
            <Text style={styles.resultsSubtitle}>
              Voting closed • {votingStatus.total_votes} votes cast
            </Text>
            
            {votingStatus.pom_player_standings && (
              <View style={styles.resultsList}>
                {votingStatus.pom_player_standings
                  .filter((standing: any) => standing.final_position)
                  .sort((a: any, b: any) => a.final_position - b.final_position)
                  .map((standing: any) => (
                    <View key={standing.player_id} style={styles.resultItem}>
                      <View style={styles.resultPosition}>
                        {getPositionIcon(standing.final_position)}
                        <Text style={styles.resultPositionText}>
                          {standing.final_position}
                        </Text>
                      </View>
                      <View style={styles.resultPlayer}>
                        <Text style={styles.resultPlayerName}>
                          {standing.users?.name || `${standing.users?.first_name} ${standing.users?.last_name}`.trim()}
                        </Text>
                        <Text style={styles.resultPoints}>
                          {standing.total_points} points
                        </Text>
                      </View>
                      <View style={styles.resultVotes}>
                        <Text style={styles.resultVoteCount}>
                          {standing.first_place_votes}st: {standing.second_place_votes}nd: {standing.third_place_votes}rd
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            )}
          </View>
        ) : (
          <>
            <View style={styles.votingSection}>
              <Text style={styles.votingTitle}>Cast Your Vote</Text>
              <Text style={styles.votingSubtitle}>
                Select your top 3 players for this match
              </Text>

              <View style={styles.voteSummary}>
                <View style={styles.voteSummaryItem}>
                  <Crown size={14} color="#FFD700" strokeWidth={2} />
                  <Text style={styles.voteSummaryLabel}>1st Place:</Text>
                  <Text style={styles.voteSummaryPlayer}>
                    {userVote.first_place_player_id ? getPlayerName(userVote.first_place_player_id) : 'Not selected'}
                  </Text>
                </View>
                <View style={styles.voteSummaryItem}>
                  <Medal size={14} color="#C0C0C0" strokeWidth={2} />
                  <Text style={styles.voteSummaryLabel}>2nd Place:</Text>
                  <Text style={styles.voteSummaryPlayer}>
                    {userVote.second_place_player_id ? getPlayerName(userVote.second_place_player_id) : 'Not selected'}
                  </Text>
                </View>
                <View style={styles.voteSummaryItem}>
                  <Award size={14} color="#CD7F32" strokeWidth={2} />
                  <Text style={styles.voteSummaryLabel}>3rd Place:</Text>
                  <Text style={styles.voteSummaryPlayer}>
                    {userVote.third_place_player_id ? getPlayerName(userVote.third_place_player_id) : 'Not selected'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.playersSection}>
              <Text style={styles.playersTitle}>Select Players ({players.length} available)</Text>
              <View style={styles.playersList}>
                {players.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Users size={48} color="#E5E5E7" strokeWidth={1} />
                    <Text style={styles.emptyStateText}>No players found</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Make sure players are added to your team
                    </Text>
                  </View>
                ) : (
                  players.map((player) => {
                    console.log('🗳️ POM - Rendering player:', {
                      id: player.id,
                      name: player.name,
                      position: player.position,
                      isSelected: isPlayerSelected(player.id)
                    });
                    
                    return (
                      <View key={player.id} style={styles.playerCard}>
                        <View style={styles.playerInfo}>
                          <Text style={styles.playerName}>
                            {player.name || `${player.first_name} ${player.last_name}`.trim()}
                          </Text>
                          {player.position && (
                            <Text style={styles.playerPosition}>{player.position}</Text>
                          )}
                        </View>
                    <View style={styles.voteButtons}>
                      <TouchableOpacity
                        style={[
                          styles.voteButton,
                          styles.firstPlaceButton,
                          userVote.first_place_player_id === player.id && styles.voteButtonActive,
                          isPlayerSelected(player.id) && userVote.first_place_player_id !== player.id && styles.voteButtonDisabled
                        ]}
                        onPress={() => handlePlayerVote('first', player.id)}
                      >
                        <Crown size={14} color={userVote.first_place_player_id === player.id ? '#FFFFFF' : '#FFD700'} strokeWidth={2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.voteButton,
                          styles.secondPlaceButton,
                          userVote.second_place_player_id === player.id && styles.voteButtonActive,
                          isPlayerSelected(player.id) && userVote.second_place_player_id !== player.id && styles.voteButtonDisabled
                        ]}
                        onPress={() => handlePlayerVote('second', player.id)}
                      >
                        <Medal size={14} color={userVote.second_place_player_id === player.id ? '#FFFFFF' : '#C0C0C0'} strokeWidth={2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.voteButton,
                          styles.thirdPlaceButton,
                          userVote.third_place_player_id === player.id && styles.voteButtonActive,
                          isPlayerSelected(player.id) && userVote.third_place_player_id !== player.id && styles.voteButtonDisabled
                        ]}
                        onPress={() => handlePlayerVote('third', player.id)}
                      >
                        <Award size={14} color={userVote.third_place_player_id === player.id ? '#FFFFFF' : '#CD7F32'} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>
                    );
                  })
                )}
              </View>
            </View>

            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !userVote.first_place_player_id && styles.submitButtonDisabled
                ]}
                onPress={submitVote}
                disabled={!userVote.first_place_player_id || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[
                    styles.submitButtonText,
                    !userVote.first_place_player_id && styles.submitButtonTextDisabled
                  ]}>
                    Submit Vote
                  </Text>
                )}
              </TouchableOpacity>

              {(user?.role === 'trainer' || user?.role === 'admin') && (
                <TouchableOpacity
                  style={styles.closeVotingButton}
                  onPress={closeVoting}
                >
                  <Text style={styles.closeVotingButtonText}>Close Voting</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  headerSpacer: {
    width: 40,
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
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  introSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginVertical: 20,
  },
  introIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFBF0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 6,
    textAlign: 'center',
  },
  introDescription: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  pointsInfo: {
    gap: 12,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 18,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#C7C7CC',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
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
  matchInfo: {
    flex: 1,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 4,
  },
  matchDate: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginBottom: 4,
  },
  matchLocation: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginBottom: 8,
  },
  matchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  matchOutcome: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  matchHeader: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 16,
    marginVertical: 24,
  },
  votingSection: {
    marginBottom: 32,
  },
  votingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 8,
  },
  votingSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginBottom: 20,
  },
  voteSummary: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 16,
  },
  voteSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voteSummaryLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
    minWidth: 80,
  },
  voteSummaryPlayer: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    flex: 1,
  },
  playersSection: {
    marginBottom: 32,
  },
  playersTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 16,
  },
  playersList: {
    gap: 12,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
    marginBottom: 4,
  },
  playerPosition: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  voteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  firstPlaceButton: {
    borderColor: '#FFD700',
    backgroundColor: '#FFFBF0',
  },
  secondPlaceButton: {
    borderColor: '#C0C0C0',
    backgroundColor: '#F8F8F8',
  },
  thirdPlaceButton: {
    borderColor: '#CD7F32',
    backgroundColor: '#FFF8F0',
  },
  voteButtonActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  voteButtonDisabled: {
    opacity: 0.3,
  },
  actionsSection: {
    gap: 12,
    marginBottom: 32,
  },
  submitButton: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-Medium',
  },
  submitButtonTextDisabled: {
    color: '#8E8E93',
  },
  closeVotingButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeVotingButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-Medium',
  },
  resultsSection: {
    marginBottom: 32,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  resultsSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginBottom: 20,
  },
  resultsList: {
    gap: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  resultPosition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 16,
  },
  resultPositionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  resultPlayer: {
    flex: 1,
  },
  resultPlayerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
    marginBottom: 4,
  },
  resultPoints: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  resultVotes: {
    alignItems: 'flex-end',
  },
  resultVoteCount: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
});
