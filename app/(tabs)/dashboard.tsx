import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import Modal from 'react-native-modal';
import Header from '@/components/Header';
import { Users, Calendar, Trophy, TrendingUp, Target, Award, Activity, CircleCheck as CheckCircle, Circle, Plus, ChevronRight, Clock, X, CalendarDays, Zap } from 'lucide-react-native';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getTeamGoals, createTeamGoal, getTeamStats, getClubStats, getTeamPlayers, getTeamEvents, submitMatchResult } from '@/lib/supabase';
import { sendPushNotification } from '@/lib/notifications';

// Default stats structure - always visible with zero values
const defaultStats = [
  {
    id: '1',
    title: 'Goals Scored',
    value: 15,
    icon: Target,
    color: '#34C759',
    change: null,
    changeType: null,
  },
  {
    id: '2',
    title: 'Matches Played',
    value: 8,
    icon: Trophy,
    color: '#FF9500',
    change: null,
    changeType: null,
  },
  {
    id: '3',
    title: 'Trainings Done',
    value: 12,
    icon: Activity,
    color: '#007AFF',
    change: null,
    changeType: null,
  },
  {
    id: '4',
    title: 'Win Rate',
    value: '75%',
    icon: TrendingUp,
    color: '#FF3B30',
    change: null,
    changeType: null,
  },
  {
    id: '5',
    title: 'Team Players',
    value: 18,
    icon: Users,
    color: '#8E4EC6',
    change: null,
    changeType: null,
  },
  {
    id: '6',
    title: 'Upcoming Events',
    value: 3,
    icon: Calendar,
    color: '#FF6B6B',
    change: null,
    changeType: null,
  },
];


export default function DashboardScreen() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const canManagePlayers = user?.role === 'trainer' || user?.role === 'admin';
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [stats, setStats] = useState<any[]>(defaultStats);
  const [teamGoals, setTeamGoals] = useState<any[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [previousStats, setPreviousStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateGoalModalVisible, setCreateGoalModalVisible] = useState(false);
  const [isPotmModalVisible, setPotmModalVisible] = useState(false);
  const [isMatchResultsModalVisible, setMatchResultsModalVisible] = useState(false);
  const [completedMatches, setCompletedMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [matchResult, setMatchResult] = useState({
    teamScore: 0,
    opponentScore: 0,
    opponentName: '',
    goals: [] as any[],
    assists: [] as any[],
  });
  const [teamPlayers, setTeamPlayers] = useState<any[]>([]);
  const [potmVotes, setPotmVotes] = useState<{
    first: string | null;
    second: string | null;
    third: string | null;
  }>({
    first: null,
    second: null,
    third: null,
  });
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    deadline: '',
  });

  // Load data on component mount
  useEffect(() => {
    if (user?.teamId) {
      loadDashboardData();
      loadCompletedMatches();
      loadTeamPlayers();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.teamId) return;

    setIsLoading(true);
    try {
      // Load team goals
      const goalsData = await getTeamGoals(user.teamId);
      setTeamGoals(goalsData || []);

      // Load team stats
      const statsData = user.role === 'admin' && user.clubId
        ? await getClubStats(user.clubId)
        : await getTeamStats(user.teamId);
      
      // Calculate changes from previous stats
      const calculateChange = (current: number, previous: number | null) => {
        if (previous === null || previous === undefined) return null;
        const diff = current - previous;
        if (diff === 0) return null;
        return diff > 0 ? `+${diff}` : `${diff}`;
      };

      const calculatePercentageChange = (current: number, previous: number | null) => {
        if (previous === null || previous === undefined || previous === 0) return null;
        const diff = current - previous;
        if (diff === 0) return null;
        const percentChange = Math.round((diff / previous) * 100);
        return percentChange > 0 ? `+${percentChange}%` : `${percentChange}%`;
      };

      // Update stats with real data
      const updatedStats = defaultStats.map(stat => {
        let currentValue: any;
        let change = null;
        let changeType: 'positive' | 'negative' | null = null;

        switch (stat.title) {
          case 'Goals Scored':
            currentValue = statsData.totalGoals;
            change = calculateChange(currentValue, previousStats?.totalGoals);
            break;
          case 'Matches Played':
            currentValue = statsData.totalMatches;
            change = calculateChange(currentValue, previousStats?.totalMatches);
            break;
          case 'Trainings Done':
            currentValue = statsData.trainings;
            change = calculateChange(currentValue, previousStats?.trainings);
            break;
          case 'Win Rate':
            currentValue = `${statsData.winRate}%`;
            change = calculatePercentageChange(statsData.winRate, previousStats?.winRate);
            break;
          case 'Team Players':
            currentValue = statsData.totalPlayers;
            change = calculateChange(currentValue, previousStats?.totalPlayers);
            break;
          case 'Upcoming Events':
            currentValue = statsData.upcomingEvents;
            change = calculateChange(currentValue, previousStats?.upcomingEvents);
            break;
          default:
            currentValue = stat.value;
        }

        // Determine change type
        if (change) {
          changeType = change.startsWith('+') ? 'positive' : 'negative';
        }

        return {
          ...stat,
          value: currentValue,
          change,
          changeType,
        };
      });

      setStats(updatedStats);
      
      // Store current stats as previous for next comparison
      setPreviousStats(statsData);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCompletedMatches = async () => {
    if (!user?.teamId) return;

    try {
      const events = await getTeamEvents(user.teamId);
      const now = new Date();
      
      // Filter for completed matches that don't have results yet
      const completed = events.filter(event => 
        event.event_type === 'match' && 
        new Date(event.event_date) < now &&
        !event.match_results?.length // No results submitted yet
      );
      
      setCompletedMatches(completed);
    } catch (error) {
      console.error('Error loading completed matches:', error);
    }
  };

  const loadTeamPlayers = async () => {
    if (!user?.teamId) return;

    try {
      const players = await getTeamPlayers(user.teamId);
      setTeamPlayers(players || []);
    } catch (error) {
      console.error('Error loading team players:', error);
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCompletedTasks = (tasks: any[]) => {
    return tasks?.filter(task => task.completed).length || 0;
  };

  const handleCreateGoal = async () => {
    console.log('handleCreateGoal called with:', newGoal);
    
    if (!newGoal.title.trim() || !newGoal.description.trim() || !newGoal.deadline.trim()) {
      Alert.alert(t.error, t.fillAllFields);
      return;
    }

    // Validate deadline is a proper date and in the future
    const deadlineDate = new Date(newGoal.deadline);
    if (isNaN(deadlineDate.getTime())) {
      Alert.alert(t.error, language === 'de' ? 'Bitte geben Sie ein gültiges Datum ein (JJJJ-MM-TT)' : 'Please enter a valid date (YYYY-MM-DD)');
      return;
    }

    if (deadlineDate <= new Date()) {
      Alert.alert(t.error, language === 'de' ? 'Das Fälligkeitsdatum muss in der Zukunft liegen' : 'Deadline must be in the future');
      return;
    }

    if (!user?.teamId || !user?.id) {
      Alert.alert(t.error, 'User authentication error. Please try logging in again.');
      return;
    }

    try {
      console.log('Creating team goal with data:', {
        title: newGoal.title,
        description: newGoal.description,
        priority: newGoal.priority,
        deadline: newGoal.deadline,
        teamId: user.teamId,
        createdBy: user.id,
      });
      
      await createTeamGoal({
        title: newGoal.title,
        description: newGoal.description,
        priority: newGoal.priority,
        deadline: newGoal.deadline,
        teamId: user.teamId,
        createdBy: user.id,
      });

      console.log('Team goal created successfully');
      setNewGoal({ title: '', description: '', priority: 'medium', deadline: '' });
      setCreateGoalModalVisible(false);
      Alert.alert(t.success, t.goalCreated);
      loadDashboardData(); // Reload data
    } catch (error) {
      console.error('Error creating team goal:', error);
      Alert.alert(t.error, t.somethingWentWrong);
    }
  };

  const handleMatchSelect = (match: any) => {
    setSelectedMatch(match);
    setMatchResult({
      teamScore: 0,
      opponentScore: 0,
      opponentName: match.title.includes('vs ') ? match.title.split('vs ')[1] : 'Opponent',
      goals: [],
      assists: [],
    });
  };

  const addGoal = () => {
    setMatchResult(prev => ({
      ...prev,
      goals: [...prev.goals, { playerId: '', playerName: '', minute: '' }]
    }));
  };

  const updateGoal = (index: number, field: string, value: string) => {
    setMatchResult(prev => ({
      ...prev,
      goals: prev.goals.map((goal, i) => 
        i === index ? { ...goal, [field]: value } : goal
      )
    }));
  };

  const removeGoal = (index: number) => {
    setMatchResult(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }));
  };

  const addAssist = () => {
    setMatchResult(prev => ({
      ...prev,
      assists: [...prev.assists, { playerId: '', playerName: '', minute: '' }]
    }));
  };

  const updateAssist = (index: number, field: string, value: string) => {
    setMatchResult(prev => ({
      ...prev,
      assists: prev.assists.map((assist, i) => 
        i === index ? { ...assist, [field]: value } : assist
      )
    }));
  };

  const removeAssist = (index: number) => {
    setMatchResult(prev => ({
      ...prev,
      assists: prev.assists.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitMatchResult = async () => {
    if (!selectedMatch || !user?.teamId || !user?.id) {
      Alert.alert(t.error, 'Missing required information');
      return;
    }

    // Validate goals have players selected
    const invalidGoals = matchResult.goals.some(goal => !goal.playerId);
    if (invalidGoals) {
      Alert.alert(t.error, 'Please select a player for each goal');
      return;
    }

    try {
      await submitMatchResult({
        eventId: selectedMatch.id,
        teamScore: matchResult.teamScore,
        opponentScore: matchResult.opponentScore,
        opponentName: matchResult.opponentName,
        goals: matchResult.goals,
        assists: matchResult.assists,
        otherStats: {},
        submittedBy: user.id,
        teamId: user.teamId,
      });

      Alert.alert(t.success, 'Match result submitted successfully!');
      setMatchResultsModalVisible(false);
      setSelectedMatch(null);
      setMatchResult({
        teamScore: 0,
        opponentScore: 0,
        opponentName: '',
        goals: [],
        assists: [],
      });
      
      // Reload data to update stats
      loadDashboardData();
      loadCompletedMatches();
    } catch (error) {
      console.error('Error submitting match result:', error);
      Alert.alert(t.error, 'Failed to submit match result');
    }
  };

  const handlePlayerVote = (position: 'first' | 'second' | 'third', playerId: string) => {
    setPotmVotes(prev => {
      const newVotes = { ...prev };
      
      // If this player is already selected in another position, remove them
      Object.keys(newVotes).forEach(pos => {
        if (newVotes[pos as keyof typeof newVotes] === playerId && pos !== position) {
          newVotes[pos as keyof typeof newVotes] = null;
        }
      });
      
      // Toggle the selection for the current position
      if (newVotes[position] === playerId) {
        newVotes[position] = null; // Deselect if already selected
      } else {
        newVotes[position] = playerId; // Select the player
      }
      
      return newVotes;
    });
  };

  const submitPotmVotes = () => {
    if (!potmVotes.first) {
      Alert.alert(t.error, `${t.fillAllFields} - ${t.firstPlace}`);
      return;
    }

    const selectedPlayers = {
      first: potmVotes.first ? getPlayerName(potmVotes.first) : null,
      second: potmVotes.second ? getPlayerName(potmVotes.second) : null,
      third: potmVotes.third ? getPlayerName(potmVotes.third) : null,
    };

    let message = `Player of the Match votes for ${selectedMatch.opponent}:\n\n`;
    if (selectedPlayers.first) message += `🥇 ${t.firstPlace}: ${selectedPlayers.first}\n`;
    if (selectedPlayers.second) message += `🥈 ${t.secondPlace}: ${selectedPlayers.second}\n`;
    if (selectedPlayers.third) message += `🥉 ${t.thirdPlace}: ${selectedPlayers.third}\n`;
    message += `\n${t.votesSubmitted}!`;

    Alert.alert(
      t.votesSubmitted,
      message,
      [
        {
          text: t.confirm,
          onPress: () => {
            setPotmModalVisible(false);
            setSelectedMatch(null);
            setPotmVotes({ first: null, second: null, third: null });
          }
        }
      ]
    );
  };

  const getPlayerName = (playerId: string) => {
    if (!selectedMatch) return '';
    const player = selectedMatch?.players?.find((p: any) => p.id === playerId);
    return player ? player.name : '';
  };

  const isPlayerSelected = (playerId: string) => {
    return Object.values(potmVotes).includes(playerId);
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (dateString: string) => {
    // Validate date format and ensure it's a valid date
    if (dateString && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime()) && date > new Date()) {
        setNewGoal({ ...newGoal, deadline: dateString });
      }
    } else {
      setNewGoal({ ...newGoal, deadline: dateString });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title={t.dashboard} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={t.dashboard} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>{t.welcomeBack}, {user?.name}!</Text>
          <Text style={styles.teamName}>
            {user?.role === 'admin' ? 'Club Admin' : 'Team Member'}
          </Text>
        </View>

        {/* Stats Cards Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {user?.role === 'admin' ? t.clubStatistics : t.teamStatistics}
          </Text>
          <View style={styles.statsGrid}>
            {stats.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <TouchableOpacity key={stat.id} style={styles.statCard}>
                  <View style={styles.statHeader}>
                    <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}15` }]}>
                      <IconComponent size={20} color={stat.color} strokeWidth={1.5} />
                    </View>
                    <View style={[
                      styles.changeIndicator,
                      { 
                        backgroundColor: stat.change && stat.changeType === 'positive' 
                          ? '#34C75915' 
                          : stat.change && stat.changeType === 'negative' 
                            ? '#FF3B3015' 
                            : '#8E8E9315' 
                      }
                    ]}>
                      {stat.change && (
                        <Text style={[
                        styles.changeText,
                        { 
                          color: stat.changeType === 'positive' 
                            ? '#34C759' 
                            : stat.changeType === 'negative' 
                              ? '#FF3B30' 
                              : '#8E8E93' 
                        }
                      ]}>
                          {stat.change}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.title}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Team Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.teamGoals}</Text>
            <View style={styles.sectionActions}>
              {canManagePlayers && completedMatches.length > 0 && (
                <TouchableOpacity 
                  style={styles.matchResultsButton}
                  onPress={() => setMatchResultsModalVisible(true)}
                >
                  <Trophy size={16} color="#FF9500" strokeWidth={2} />
                  <Text style={styles.matchResultsText}>Enter Results</Text>
                </TouchableOpacity>
              )}
              {canManagePlayers && (
                <TouchableOpacity 
                  style={styles.addGoalButton}
                  onPress={() => setCreateGoalModalVisible(true)}
                >
                  <Plus size={16} color="#007AFF" strokeWidth={2} />
                  <Text style={styles.addGoalText}>{t.addGoal}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {teamGoals.length === 0 ? (
            <View style={styles.emptyGoalsState}>
              <Target size={48} color="#E5E5E7" strokeWidth={1} />
              <Text style={styles.emptyGoalsText}>{language === 'de' ? 'Noch keine Team-Ziele gesetzt' : 'No team goals set yet'}</Text>
              {canManagePlayers && (
                <Text style={styles.emptyGoalsSubtext}>
                  {language === 'de' ? 'Erstelle dein erstes Team-Ziel um den Fortschritt zu verfolgen' : 'Create your first team goal to track progress'}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.goalsContainer}>
              {teamGoals.map((goal) => (
                <TouchableOpacity 
                  key={goal.id} 
                  style={[
                    styles.goalCard,
                    goal.completed && styles.goalCardCompleted
                  ]}
                  onPress={() => setSelectedGoal(selectedGoal === goal.id ? null : goal.id)}
                >
                  <View style={styles.goalHeader}>
                    <View style={styles.goalTitleContainer}>
                      <View style={[
                        styles.priorityIndicator,
                        { backgroundColor: getPriorityColor(goal.priority) }
                      ]} />
                      <Text style={[
                        styles.goalTitle,
                        goal.completed && styles.goalTitleCompleted
                      ]}>
                        {goal.title}
                      </Text>
                      {goal.completed && (
                        <CheckCircle size={16} color="#34C759" strokeWidth={1.5} />
                      )}
                    </View>
                    <ChevronRight 
                      size={16} 
                      color="#8E8E93" 
                      strokeWidth={1.5}
                      style={[
                        styles.expandIcon,
                        selectedGoal === goal.id && styles.expandIconRotated
                      ]}
                    />
                  </View>

                  <Text style={styles.goalDescription}>{goal.description}</Text>

                  <View style={styles.goalProgress}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>{t.progress}</Text>
                      <Text style={styles.progressPercentage}>{goal.progress}%</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[
                          styles.progressBar,
                          { 
                            width: `${goal.progress}%`,
                            backgroundColor: goal.completed ? '#34C759' : getPriorityColor(goal.priority)
                          }
                        ]} 
                      />
                    </View>
                  </View>

                  <View style={styles.goalFooter}>
                    <View style={styles.goalMeta}>
                      <Text style={styles.goalDeadline}>
                        {t.due}: {formatDeadline(goal.deadline)}
                      </Text>
                      <Text style={styles.goalTasks}>
                        {getCompletedTasks(goal.goal_tasks)}/{goal.goal_tasks?.length || 0} {t.tasks}
                      </Text>
                    </View>
                  </View>

                  {/* Expanded Task List */}
                  {selectedGoal === goal.id && goal.goal_tasks && (
                    <View style={styles.tasksList}>
                      <Text style={styles.tasksTitle}>{t.tasks}:</Text>
                      {goal.goal_tasks.map((task: any) => (
                        <View key={task.id} style={styles.taskItem}>
                          {task.completed ? (
                            <CheckCircle size={16} color="#34C759" strokeWidth={1.5} />
                          ) : (
                            <Circle size={16} color="#8E8E93" strokeWidth={1.5} />
                          )}
                          <Text style={[
                            styles.taskText,
                            task.completed && styles.taskTextCompleted
                          ]}>
                            {task.title}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Create Goal Modal */}
      <Modal
        isVisible={isCreateGoalModalVisible}
        onBackdropPress={() => setCreateGoalModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.createTeamGoal}</Text>
            <TouchableOpacity onPress={() => setCreateGoalModalVisible(false)}>
              <X size={24} color="#8E8E93" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t.goalTitle} *</Text>
              <TextInput
                style={styles.formInput}
                placeholder={t.goalTitle}
                value={newGoal.title}
                onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t.description} *</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder={t.description}
                value={newGoal.description}
                onChangeText={(text) => setNewGoal({ ...newGoal, description: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t.priority}</Text>
              <View style={styles.prioritySelector}>
                {(['high', 'medium', 'low'] as const).map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      newGoal.priority === priority && styles.priorityButtonActive,
                      { borderColor: getPriorityColor(priority) }
                    ]}
                    onPress={() => setNewGoal({ ...newGoal, priority })}
                  >
                    <View style={[
                      styles.priorityIndicator,
                      { backgroundColor: getPriorityColor(priority) }
                    ]} />
                    <Text style={[
                      styles.priorityButtonText,
                      newGoal.priority === priority && { color: getPriorityColor(priority) }
                    ]}>
                      {priority === 'high' ? t.high : priority === 'medium' ? t.medium : t.low}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t.deadline} *</Text>
              <View style={styles.dateInputContainer}>
                <CalendarDays size={20} color="#8E8E93" strokeWidth={1.5} />
                <TextInput
                  style={styles.dateInput}
                  placeholder={language === 'de' ? 'JJJJ-MM-TT (z.B. 2024-12-31)' : 'YYYY-MM-DD (e.g. 2024-12-31)'}
                  value={newGoal.deadline}
                  onChangeText={handleDateChange}
                  placeholderTextColor="#8E8E93"
                  maxLength={10}
                />
              </View>
              <Text style={styles.formHint}>
                {language === 'de' ? 'Datum muss in der Zukunft liegen und im Format JJJJ-MM-TT sein' : 'Date must be in the future and in YYYY-MM-DD format'}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setCreateGoalModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateGoal}
            >
              <Text style={styles.createButtonText}>{t.create} Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Match Results Modal */}
      <Modal
        isVisible={isMatchResultsModalVisible}
        onBackdropPress={() => setMatchResultsModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Enter Match Results</Text>
            <TouchableOpacity onPress={() => setMatchResultsModalVisible(false)}>
              <X size={24} color="#8E8E93" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          {!selectedMatch ? (
            <ScrollView style={styles.matchesList} showsVerticalScrollIndicator={false}>
              <Text style={styles.matchesTitle}>Select a Completed Match</Text>
              {completedMatches.length === 0 ? (
                <View style={styles.emptyMatches}>
                  <Trophy size={48} color="#E5E5E7" strokeWidth={1} />
                  <Text style={styles.emptyMatchesText}>No completed matches without results</Text>
                </View>
              ) : (
                completedMatches.map((match) => (
                  <TouchableOpacity
                    key={match.id}
                    style={styles.matchCard}
                    onPress={() => handleMatchSelect(match)}
                  >
                    <View style={styles.matchInfo}>
                      <Text style={styles.matchOpponent}>{match.title}</Text>
                      <Text style={styles.matchDate}>
                        {new Date(match.event_date).toLocaleDateString()}
                      </Text>
                      <Text style={styles.matchLocation}>{match.location}</Text>
                    </View>
                    <ChevronRight size={20} color="#8E8E93" strokeWidth={1.5} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          ) : (
            <ScrollView style={styles.matchResultForm} showsVerticalScrollIndicator={false}>
              <View style={styles.selectedMatchHeader}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => setSelectedMatch(null)}
                >
                  <Text style={styles.backButtonText}>← Back to Matches</Text>
                </TouchableOpacity>
                <Text style={styles.selectedMatchTitle}>{selectedMatch.title}</Text>
                <Text style={styles.selectedMatchDate}>
                  {new Date(selectedMatch.event_date).toLocaleDateString()}
                </Text>
              </View>

              {/* Score Section */}
              <View style={styles.scoreSection}>
                <Text style={styles.scoreSectionTitle}>Final Score</Text>
                <View style={styles.scoreInputs}>
                  <View style={styles.scoreInput}>
                    <Text style={styles.scoreLabel}>My Team</Text>
                    <TextInput
                      style={styles.scoreField}
                      value={matchResult.teamScore.toString()}
                      onChangeText={(text) => setMatchResult(prev => ({
                        ...prev,
                        teamScore: parseInt(text) || 0
                      }))}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                  <Text style={styles.scoreDivider}>-</Text>
                  <View style={styles.scoreInput}>
                    <Text style={styles.scoreLabel}>Opponent</Text>
                    <TextInput
                      style={styles.scoreField}
                      value={matchResult.opponentScore.toString()}
                      onChangeText={(text) => setMatchResult(prev => ({
                        ...prev,
                        opponentScore: parseInt(text) || 0
                      }))}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                </View>
              </View>

              {/* Goals Section */}
              <View style={styles.statsInputSection}>
                <View style={styles.statsInputHeader}>
                  <Text style={styles.statsInputTitle}>Goals</Text>
                  <TouchableOpacity style={styles.addStatButton} onPress={addGoal}>
                    <Plus size={16} color="#007AFF" strokeWidth={2} />
                    <Text style={styles.addStatText}>Add Goal</Text>
                  </TouchableOpacity>
                </View>
                {matchResult.goals.map((goal, index) => (
                  <View key={index} style={styles.statInputRow}>
                    <View style={styles.playerSelectContainer}>
                      <Text style={styles.playerSelectLabel}>Player:</Text>
                      <View style={styles.playerSelect}>
                        {teamPlayers.map((player) => (
                          <TouchableOpacity
                            key={player.id}
                            style={[
                              styles.playerOption,
                              goal.playerId === player.id && styles.playerOptionSelected
                            ]}
                            onPress={() => {
                              updateGoal(index, 'playerId', player.id);
                              updateGoal(index, 'playerName', player.name);
                            }}
                          >
                            <Text style={[
                              styles.playerOptionText,
                              goal.playerId === player.id && styles.playerOptionTextSelected
                            ]}>
                              {player.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.removeStatButton}
                      onPress={() => removeGoal(index)}
                    >
                      <X size={16} color="#FF3B30" strokeWidth={1.5} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Assists Section */}
              <View style={styles.statsInputSection}>
                <View style={styles.statsInputHeader}>
                  <Text style={styles.statsInputTitle}>Assists</Text>
                  <TouchableOpacity style={styles.addStatButton} onPress={addAssist}>
                    <Plus size={16} color="#34C759" strokeWidth={2} />
                    <Text style={styles.addStatText}>Add Assist</Text>
                  </TouchableOpacity>
                </View>
                {matchResult.assists.map((assist, index) => (
                  <View key={index} style={styles.statInputRow}>
                    <View style={styles.playerSelectContainer}>
                      <Text style={styles.playerSelectLabel}>Player:</Text>
                      <View style={styles.playerSelect}>
                        {teamPlayers.map((player) => (
                          <TouchableOpacity
                            key={player.id}
                            style={[
                              styles.playerOption,
                              assist.playerId === player.id && styles.playerOptionSelected
                            ]}
                            onPress={() => {
                              updateAssist(index, 'playerId', player.id);
                              updateAssist(index, 'playerName', player.name);
                            }}
                          >
                            <Text style={[
                              styles.playerOptionText,
                              assist.playerId === player.id && styles.playerOptionTextSelected
                            ]}>
                              {player.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.removeStatButton}
                      onPress={() => removeAssist(index)}
                    >
                      <X size={16} color="#FF3B30" strokeWidth={1.5} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitResultButton}
                onPress={handleSubmitMatchResult}
              >
                <Text style={styles.submitResultButtonText}>Submit Match Result</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Player of the Match Modal */}
      <Modal
        isVisible={isPotmModalVisible}
        onBackdropPress={() => setPotmModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.playerOfTheMatch}</Text>
            <TouchableOpacity onPress={() => setPotmModalVisible(false)}>
              <X size={24} color="#8E8E93" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          {!selectedMatch ? (
            <ScrollView style={styles.matchesList} showsVerticalScrollIndicator={false}>
              <Text style={styles.matchesTitle}>{t.selectRecentMatch}</Text>
              {recentMatches.length === 0 ? (
                <View style={styles.emptyMatches}>
                  <Text style={styles.emptyMatchesText}>
                    {language === 'de' ? 'Keine aktuellen Spiele gefunden' : 'No recent matches found'}
                  </Text>
                </View>
              ) : (
                recentMatches.map((match) => (
                <TouchableOpacity
                  key={match.id}
                  style={styles.matchCard}
                  onPress={() => handleMatchSelect(match)}
                >
                  <View style={styles.matchInfo}>
                    <Text style={styles.matchOpponent}>vs {match.opponent}</Text>
                    <Text style={styles.matchDate}>{new Date(match.date).toLocaleDateString()}</Text>
                  </View>
                  <View style={[
                    styles.matchResult,
                    { 
                      backgroundColor: match.result.startsWith('W') 
                        ? '#34C75915' 
                        : match.result.startsWith('L') 
                          ? '#FF3B3015' 
                          : '#FF950015' 
                    }
                  ]}>
                    <Text style={[
                      styles.matchResultText,
                      { 
                        color: match.result.startsWith('W') 
                          ? '#34C759' 
                          : match.result.startsWith('L') 
                            ? '#FF3B30' 
                            : '#FF9500' 
                      }
                    ]}>
                      {match.result}
                    </Text>
                  </View>
                </TouchableOpacity>
               )))}
            </ScrollView>
          ) : (
            <ScrollView style={styles.votingSection} showsVerticalScrollIndicator={false}>
              <View style={styles.selectedMatchHeader}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => setSelectedMatch(null)}
                >
                  <Text style={styles.backButtonText}>← Back to Matches</Text>
                </TouchableOpacity>
                <Text style={styles.selectedMatchTitle}>vs {selectedMatch.opponent}</Text>
                <Text style={styles.selectedMatchDate}>
                  {new Date(selectedMatch.date).toLocaleDateString()}
                </Text>
              </View>

              {/* Voting Summary */}
              <View style={styles.votingSummary}>
                <Text style={styles.votingSummaryTitle}>{t.yourVotes}</Text>
                <View style={styles.votesSummaryList}>
                  <View style={styles.voteSummaryItem}>
                    <Text style={styles.votePosition}>🥇 {t.firstPlace}:</Text>
                    <Text style={styles.votePlayer}>
                      {potmVotes.first ? getPlayerName(potmVotes.first) : t.notSelected}
                    </Text>
                  </View>
                  <View style={styles.voteSummaryItem}>
                    <Text style={styles.votePosition}>🥈 {t.secondPlace}:</Text>
                    <Text style={styles.votePlayer}>
                      {potmVotes.second ? getPlayerName(potmVotes.second) : t.notSelected}
                    </Text>
                  </View>
                  <View style={styles.voteSummaryItem}>
                    <Text style={styles.votePosition}>🥉 {t.thirdPlace}:</Text>
                    <Text style={styles.votePlayer}>
                      {potmVotes.third ? getPlayerName(potmVotes.third) : t.notSelected}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Player Selection */}
              <Text style={styles.playersTitle}>{t.selectPlayer}</Text>
              <View style={styles.playersList}>
                {selectedMatch?.players?.map((player: any) => (
                  <View key={player.id} style={styles.playerVoteCard}>
                    <View style={styles.playerVoteInfo}>
                      <Text style={styles.playerVoteName}>{player.name}</Text>
                      <Text style={styles.playerVotePosition}>{player.position}</Text>
                    </View>
                    <View style={styles.voteButtons}>
                      <TouchableOpacity
                        style={[
                          styles.voteButton,
                          styles.firstPlaceButton,
                          potmVotes.first === player.id && styles.voteButtonActive,
                          isPlayerSelected(player.id) && potmVotes.first !== player.id && styles.voteButtonDisabled
                        ]}
                        onPress={() => handlePlayerVote('first', player.id)}
                      >
                        <Text style={[
                          styles.voteButtonText,
                          potmVotes.first === player.id && styles.voteButtonTextActive,
                          isPlayerSelected(player.id) && potmVotes.first !== player.id && styles.voteButtonTextDisabled
                        ]}>
                          1st
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.voteButton,
                          styles.secondPlaceButton,
                          potmVotes.second === player.id && styles.voteButtonActive,
                          isPlayerSelected(player.id) && potmVotes.second !== player.id && styles.voteButtonDisabled
                        ]}
                        onPress={() => handlePlayerVote('second', player.id)}
                      >
                        <Text style={[
                          styles.voteButtonText,
                          potmVotes.second === player.id && styles.voteButtonTextActive,
                          isPlayerSelected(player.id) && potmVotes.second !== player.id && styles.voteButtonTextDisabled
                        ]}>
                          2nd
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.voteButton,
                          styles.thirdPlaceButton,
                          potmVotes.third === player.id && styles.voteButtonActive,
                          isPlayerSelected(player.id) && potmVotes.third !== player.id && styles.voteButtonDisabled
                        ]}
                        onPress={() => handlePlayerVote('third', player.id)}
                      >
                        <Text style={[
                          styles.voteButtonText,
                          potmVotes.third === player.id && styles.voteButtonTextActive,
                          isPlayerSelected(player.id) && potmVotes.third !== player.id && styles.voteButtonTextDisabled
                        ]}>
                          3rd
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.submitVotesButton,
                  !potmVotes.first && styles.submitVotesButtonDisabled
                ]}
                onPress={submitPotmVotes}
                disabled={!potmVotes.first}
              >
                <Text style={[
                  styles.submitVotesButtonText,
                  !potmVotes.first && styles.submitVotesButtonTextDisabled
                ]}>
                  {t.submitVotes}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  addGoalText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  matchResultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF8F0',
    borderRadius: 8,
  },
  matchResultsText: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
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
  changeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Urbanist-SemiBold',
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
  goalsContainer: {
    gap: 16,
  },
  emptyGoalsState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyGoalsText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
  },
  emptyGoalsSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#C7C7CC',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
  },
  emptyMatches: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyMatchesText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
  },
  matchLocation: {
    fontSize: 12,
    color: '#C7C7CC',
    fontFamily: 'Urbanist-Regular',
  },
  matchResultForm: {
    maxHeight: 600,
    paddingHorizontal: 24,
  },
  scoreSection: {
    marginBottom: 32,
  },
  scoreSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 16,
  },
  scoreInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  scoreInput: {
    alignItems: 'center',
    gap: 8,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
    fontWeight: '500',
  },
  scoreField: {
    width: 80,
    height: 60,
    borderWidth: 2,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
  },
  scoreDivider: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8E8E93',
    fontFamily: 'Urbanist-SemiBold',
  },
  statsInputSection: {
    marginBottom: 24,
  },
  statsInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsInputTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  addStatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  addStatText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  statInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  playerSelectContainer: {
    flex: 1,
  },
  playerSelectLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
    marginBottom: 8,
  },
  playerSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  playerOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  playerOptionSelected: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  playerOptionText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  playerOptionTextSelected: {
    color: '#FFFFFF',
  },
  removeStatButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  submitResultButton: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitResultButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-Medium',
  },
  goalCard: {
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
  goalCardCompleted: {
    backgroundColor: '#F8FFF8',
    borderColor: '#34C759',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    flex: 1,
  },
  goalTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  expandIcon: {
    transform: [{ rotate: '0deg' }],
  },
  expandIconRotated: {
    transform: [{ rotate: '90deg' }],
  },
  goalDescription: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginBottom: 16,
    lineHeight: 20,
  },
  goalProgress: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
    fontFamily: 'Urbanist-SemiBold',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  goalDeadline: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  goalTasks: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  tasksList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  tasksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  taskText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
    flex: 1,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  bottomSpacing: {
    height: 32,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  modalForm: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    fontFamily: 'Urbanist-SemiBold',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
    backgroundColor: '#FFFFFF',
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  priorityButtonActive: {
    backgroundColor: '#F8F9FA',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
  },
  formHint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    fontFamily: 'Urbanist-Regular',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
  },
  createButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-Medium',
  },
  potmButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginTop: 16,
  },
  potmIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  potmContent: {
    flex: 1,
  },
  potmTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 4,
  },
  potmSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    lineHeight: 20,
  },
  matchesList: {
    maxHeight: 400,
    paddingHorizontal: 24,
  },
  matchesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 16,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  matchInfo: {
    flex: 1,
  },
  matchOpponent: {
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
  },
  matchResult: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  matchResultText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Urbanist-SemiBold',
  },
  votingSection: {
    maxHeight: 500,
    paddingHorizontal: 24,
  },
  selectedMatchHeader: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontFamily: 'Urbanist-Medium',
  },
  selectedMatchTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 4,
  },
  selectedMatchDate: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  votingSummary: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  votingSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 12,
  },
  votesSummaryList: {
    gap: 8,
  },
  voteSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  votePosition: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
  },
  votePlayer: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  playersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 16,
  },
  playersList: {
    gap: 12,
    marginBottom: 24,
  },
  playerVoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  playerVoteInfo: {
    flex: 1,
  },
  playerVoteName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
    marginBottom: 4,
  },
  playerVotePosition: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  voteButton: {
    width: 40,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
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
  },
  voteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    fontFamily: 'Urbanist-SemiBold',
  },
  voteButtonTextActive: {
    color: '#FFFFFF',
  },
  voteButtonDisabled: {
    opacity: 0.3,
  },
  voteButtonTextDisabled: {
    color: '#C7C7CC',
  },
  submitVotesButton: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitVotesButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },
  submitVotesButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-Medium',
  },
  submitVotesButtonTextDisabled: {
    color: '#8E8E93',
  },
  liveTickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
  liveTickerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  liveTickerContent: {
    flex: 1,
  },
  liveTickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 4,
  },
  liveTickerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    lineHeight: 20,
  },
});