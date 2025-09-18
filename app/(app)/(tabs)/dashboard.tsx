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
import { Users, Calendar, Trophy, TrendingUp, Target, Award, Activity, CircleCheck, Circle, Plus, ChevronRight, Clock, X, CalendarDays, Zap } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { getTeamGoals, createTeamGoal, getTeamStats, getClubStats, getTeamUsers, getTeamEvents, submitMatchResult } from '@/lib/supabase';

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
  const { t: commonT } = useTranslation('common');
  const { t: tabsT } = useTranslation('tabs');
  const { user } = useAuth();
  
  // Early return if user is not available
  if (!user) {
    return null;
  }
  
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
  const [matchesWithResults, setMatchesWithResults] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [matchResult, setMatchResult] = useState({
    teamScore: 0,
    opponentScore: 0,
    opponentName: '',
    goals: [] as any[],
    assists: [] as any[],
  });

  // Separate selection state for goals and assists - using objects for better isolation
  const [selectedGoalUsers, setSelectedGoalUsers] = useState<Record<number, string>>({});
  const [selectedAssistUsers, setSelectedAssistUsers] = useState<Record<number, string>>({});

  // Function to update goal player selection
  const updateGoalPlayer = (goalIndex: number, user_id: string) => {
    const player = teamPlayers.find(p => p.user_id === user_id);
    console.log('🎯 Updating goal player:', {
      goalIndex,
      user_id,
      playerName: player?.name || player?.first_name || player?.last_name,
      currentSelectedGoalUsers: selectedGoalUsers
    });
    
    // Update the separate selection state - only update the specific index
    // If the same user is already selected, deselect them (toggle behavior)
    setSelectedGoalUsers(prev => {
      if (prev[goalIndex] === user_id) {
        // Deselect if already selected
        const newState = { ...prev };
        delete newState[goalIndex];
        return newState;
      } else {
        // Select the new user
        return {
          ...prev,
          [goalIndex]: user_id
        };
      }
    });
    
    // Also update the matchResult for submission
    setMatchResult(prev => {
      const updatedGoals = prev.goals.map((goal, index) => 
        index === goalIndex ? { 
          ...goal, 
          playerId: user_id || '', 
          playerName: player?.name || `${player?.first_name || ''} ${player?.last_name || ''}`.trim() || 'Unknown Player' 
        } : goal
      );
      
      console.log('🎯 Updated goals state:', {
        goalIndex,
        selectedUserId: user_id,
        allGoals: updatedGoals.map((g, i) => ({ 
          index: i, 
          playerId: g.playerId, 
          playerName: g.playerName 
        }))
      });
      
      return {
        ...prev,
        goals: updatedGoals
      };
    });
  };

  // Function to update assist player selection
  const updateAssistPlayer = (assistIndex: number, user_id: string) => {
    const player = teamPlayers.find(p => p.user_id === user_id);
    console.log('🎯 Updating assist player:', {
      assistIndex,
      user_id,
      playerName: player?.name || player?.first_name || player?.last_name,
      currentSelectedAssistUsers: selectedAssistUsers
    });
    
    // Update the separate selection state - only update the specific index
    // If the same user is already selected, deselect them (toggle behavior)
    setSelectedAssistUsers(prev => {
      if (prev[assistIndex] === user_id) {
        // Deselect if already selected
        const newState = { ...prev };
        delete newState[assistIndex];
        return newState;
      } else {
        // Select the new user
        return {
          ...prev,
          [assistIndex]: user_id
        };
      }
    });
    
    // Also update the matchResult for submission
    setMatchResult(prev => {
      const updatedAssists = prev.assists.map((assist, index) => 
        index === assistIndex ? { 
          ...assist, 
          playerId: user_id || '', 
          playerName: player?.name || `${player?.first_name || ''} ${player?.last_name || ''}`.trim() || 'Unknown Player' 
        } : assist
      );
      
      console.log('🎯 Updated assists state:', {
        assistIndex,
        selectedUserId: user_id,
        allAssists: updatedAssists.map((a, i) => ({ 
          index: i, 
          playerId: a.playerId, 
          playerName: a.playerName 
        }))
      });
      
      return {
        ...prev,
        assists: updatedAssists
      };
    });
  };

  // Function to generate unique player keys
  const generatePlayerKey = (type: 'goal' | 'assist', typeIndex: number, player: any, playerIndex: number) => {
    const user_id = player.user_id || `unknown-${playerIndex}`;
    const playerName = player.name || player.first_name || player.last_name || `player-${playerIndex}`;
    return `${type}-${typeIndex}-player-${user_id}-${playerName}`;
  };
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
      let statsData;
      try {
        statsData = user.role === 'admin' && user.clubId
          ? await getClubStats(user.clubId)
          : await getTeamStats(user.teamId);
      } catch (error) {
        console.error('❌ Error loading stats data:', error);
        // Provide fallback data if stats loading fails
        statsData = {
          totalGoals: 0,
          totalMatches: 0,
          winRate: 0,
          totalPlayers: 0,
          upcomingEvents: 0,
          trainings: 0
        };
      }
      
      // Log the raw stats data to understand the structure
      console.log('🔍 Dashboard - Raw stats data:', {
        statsData,
        userRole: user.role,
        teamId: user.teamId,
        clubId: user.clubId,
        totalGoals: statsData?.totalGoals,
        totalMatches: statsData?.totalMatches,
        winRate: statsData?.winRate,
        trainings: statsData?.trainings,
        totalPlayers: statsData?.totalPlayers,
        upcomingEvents: statsData?.upcomingEvents
      });
      
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
            currentValue = statsData?.totalGoals ?? 0;
                  console.log('🎯 Goals Scored calculation:', {
        rawValue: statsData?.totalGoals,
        type: typeof statsData?.totalGoals,
        finalValue: currentValue,
        isNull: statsData?.totalGoals === null,
        isUndefined: statsData?.totalGoals === undefined,
        statsDataKeys: statsData ? Object.keys(statsData) : [],
        note: 'Calculated by summing team_score from all match_results'
      });
            change = calculateChange(currentValue, previousStats?.totalGoals);
            break;
          case 'Matches Played':
            currentValue = statsData?.totalMatches ?? 0;
            change = calculateChange(currentValue, previousStats?.totalMatches);
            break;
          case 'Trainings Done':
            currentValue = statsData?.trainings ?? 0;
            change = calculateChange(currentValue, previousStats?.trainings);
            break;
          case 'Win Rate':
            currentValue = `${statsData?.winRate ?? 0}%`;
            change = calculatePercentageChange(statsData?.winRate ?? 0, previousStats?.winRate);
            break;
          case 'Team Players':
            currentValue = statsData?.totalPlayers ?? 0;
            change = calculateChange(currentValue, previousStats?.totalPlayers);
            break;
          case 'Upcoming Events':
            currentValue = statsData?.upcomingEvents ?? 0;
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
      
      // Filter for all completed matches (past matches only)
      const allPastMatches = events.filter((event: any) => 
        event.event_type === 'match' && 
        new Date(event.event_date) < now
      );
      
      // Sort all past matches by most recent first
      const sortedPastMatches = allPastMatches.sort((a: any, b: any) => 
        new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
      );
      
      // Separate matches that don't have results yet
      const completed = sortedPastMatches.filter((event: any) => 
        !event.match_results || event.match_results.length === 0
      );
      
      // Separate matches that already have results
      const withResults = sortedPastMatches.filter((event: any) => 
        event.match_results && event.match_results.length > 0
      );
      
      console.log('📊 Loaded past matches:', {
        totalPastMatches: sortedPastMatches.length,
        matchesNeedingResults: completed.length,
        matchesWithResults: withResults.length,
        sampleMatch: sortedPastMatches[0]
      });
      
      setCompletedMatches(completed);
      setMatchesWithResults(withResults);
    } catch (error) {
      console.error('Error loading completed matches:', error);
    }
  };

  const loadTeamPlayers = async () => {
    if (!user) {
      console.warn('⚠️ Cannot load players: No user object available');
      return;
    }

    // Use teamId from the User interface (AuthContext maps Supabase's team_id to this)
    const teamId = user.teamId;
    if (!teamId) {
      console.warn('⚠️ Cannot load players: No team assigned to user:', {
        userId: user.id,
        email: user.email,
        role: user.role
      });
      return;
    }
    
    console.log('📊 Fetching team users for team:', teamId);
    
    try {
      const data = await getTeamUsers(teamId);
      
      // getTeamUsers already returns properly transformed and sorted data
      // Just add the computed 'name' field for UI consistency
      const playersWithComputedName = (data || []).map(user => ({
        ...user,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User',
        user_id: user.id, // For UI compatibility
      }));
      
      console.log('✅ Successfully loaded team users:', {
        teamId,
        totalCount: playersWithComputedName.length,
        trainerCount: playersWithComputedName.filter(u => u.role === 'trainer').length,
        playerCount: playersWithComputedName.filter(u => u.role === 'player').length
      });
      
      setTeamPlayers(playersWithComputedName);
      
      if (!data || data.length === 0) {
        console.warn('⚠️ No team members found for team:', teamId);
      }
    } catch (error) {
      console.error('❌ Error loading team members:', error);
      setTeamPlayers([]);
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
      Alert.alert(commonT('error'), commonT('fillAllFields'));
      return;
    }

    // Validate deadline is a proper date and in the future
    const deadlineDate = new Date(newGoal.deadline);
    if (isNaN(deadlineDate.getTime())) {
      Alert.alert(commonT('error'), commonT('invalidDate'));
      return;
    }

    if (deadlineDate <= new Date()) {
      Alert.alert(commonT('error'), commonT('deadlineFuture'));
      return;
    }

    if (!user?.teamId || !user?.id) {
      Alert.alert(commonT('error'), commonT('authError'));
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
      Alert.alert(commonT('success'), commonT('goalCreated'));
      loadDashboardData(); // Reload data
    } catch (error) {
      console.error('Error creating team goal:', error);
      Alert.alert(commonT('error'), commonT('somethingWentWrong'));
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
    
    // Reset selection state for new match
    setSelectedGoalUsers({});
    setSelectedAssistUsers({});
  };

  const addGoal = () => {
    // Check if we can add more goals based on the team score
    const currentGoalsCount = matchResult.goals.length;
    const maxGoals = matchResult.teamScore;
    
    if (currentGoalsCount >= maxGoals) {
      Alert.alert(
        commonT('error'), 
        `Cannot add more goals. Team score is ${maxGoals}, so you can only assign ${maxGoals} goal scorer${maxGoals === 1 ? '' : 's'}.`
      );
      return;
    }
    
    setMatchResult(prev => ({
      ...prev,
      goals: [...prev.goals, { playerId: '', playerName: '', minute: null }]
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
    
    // Clean up selection state for removed goal
    setSelectedGoalUsers(prev => {
      const newState = { ...prev };
      delete newState[index];
      // Shift down selections for goals after the removed one
      Object.keys(newState).forEach(key => {
        const keyIndex = parseInt(key);
        if (keyIndex > index) {
          newState[keyIndex - 1] = newState[keyIndex];
          delete newState[keyIndex];
        }
      });
      return newState;
    });
  };

  const addAssist = () => {
    // Check if we can add more assists based on the team score
    const currentAssistsCount = matchResult.assists.length;
    const maxAssists = matchResult.teamScore; // Allow up to same number as goals
    
    if (currentAssistsCount >= maxAssists) {
      Alert.alert(
        commonT('error'), 
        `Cannot add more assists. Team score is ${maxAssists}, so you can only assign up to ${maxAssists} assist provider${maxAssists === 1 ? '' : 's'}.`
      );
      return;
    }
    
    setMatchResult(prev => ({
      ...prev,
      assists: [...prev.assists, { playerId: '', playerName: '', minute: null }]
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
    
    // Clean up selection state for removed assist
    setSelectedAssistUsers(prev => {
      const newState = { ...prev };
      delete newState[index];
      // Shift down selections for assists after the removed one
      Object.keys(newState).forEach(key => {
        const keyIndex = parseInt(key);
        if (keyIndex > index) {
          newState[keyIndex - 1] = newState[keyIndex];
          delete newState[keyIndex];
        }
      });
      return newState;
    });
  };

  const handleSubmitMatchResult = async () => {
    if (!selectedMatch || !user?.teamId || !user?.id) {
      Alert.alert(commonT('error'), commonT('missingInfo'));
      return;
    }

    // Check if match result already exists
    if (selectedMatch.match_results && selectedMatch.match_results.length > 0) {
      Alert.alert(
        commonT('error'), 
        'A match result has already been submitted for this match. Each match can only have one result.'
      );
      return;
    }

    // Validate that number of goals matches team score
    if (matchResult.goals.length !== matchResult.teamScore) {
      Alert.alert(
        commonT('error'), 
        `Team score is ${matchResult.teamScore}, but you have assigned ${matchResult.goals.length} goal scorer${matchResult.goals.length === 1 ? '' : 's'}. Please assign exactly ${matchResult.teamScore} goal scorer${matchResult.teamScore === 1 ? '' : 's'}.`
      );
      return;
    }

    // Validate that all goals have players selected
    const goalsWithoutPlayers = matchResult.goals.filter(goal => !goal.playerId);
    if (goalsWithoutPlayers.length > 0) {
      Alert.alert(commonT('error'), 'Please select players for all goals.');
      return;
    }

    // Validate that assists don't exceed goals
    if (matchResult.assists.length > matchResult.goals.length) {
      Alert.alert(
        commonT('error'), 
        `You have ${matchResult.assists.length} assist${matchResult.assists.length === 1 ? '' : 's'} but only ${matchResult.goals.length} goal${matchResult.goals.length === 1 ? '' : 's'}. You cannot have more assists than goals.`
      );
      return;
    }

    try {
      // Prepare goals with player IDs and minutes for submission
      const goalsWithPlayer = matchResult.goals.map((goal, index) => ({
        playerId: selectedGoalUsers[index] || '',
        minute: goal.minute
      }));
      
      const assistsWithPlayer = matchResult.assists.map((assist, index) => ({
        playerId: selectedAssistUsers[index] || '',
        minute: assist.minute
      }));

      await submitMatchResult({
        eventId: selectedMatch.id,
        teamScore: matchResult.teamScore,
        opponentScore: matchResult.opponentScore,
        opponentName: matchResult.opponentName,
        goals: goalsWithPlayer,
        assists: assistsWithPlayer,
        otherStats: {},
        submittedBy: user.id,
        teamId: user.teamId,
      });

      Alert.alert(commonT('success'), commonT('matchResultSubmitted'));
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
      
      // Check if it's a duplicate constraint error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage === 'duplicate_match_result' || errorMessage.includes('duplicate')) {
        Alert.alert(
          commonT('error'), 
          'A match result has already been submitted for this match. Each match can only have one result.'
        );
      } else {
        Alert.alert(commonT('error'), commonT('matchResultFailed'));
      }
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
      Alert.alert(commonT('error'), `${commonT('fillAllFields')} - ${commonT('firstPlace')}`);
      return;
    }

    const selectedPlayers = {
      first: potmVotes.first ? getPlayerName(potmVotes.first) : commonT('notSelected'),
      second: potmVotes.second ? getPlayerName(potmVotes.second) : commonT('notSelected'),
      third: potmVotes.third ? getPlayerName(potmVotes.third) : commonT('notSelected'),
    };

    let message = `Player of the Match votes for ${selectedMatch.opponent}:\n\n`;
    if (selectedPlayers.first) message += `🥇 ${commonT('firstPlace')}: ${selectedPlayers.first}\n`;
    if (selectedPlayers.second) message += `🥈 ${commonT('secondPlace')}: ${selectedPlayers.second}\n`;
    if (selectedPlayers.third) message += `🥉 ${commonT('thirdPlace')}: ${selectedPlayers.third}\n`;
    message += `\n${commonT('votesSubmitted')}!`;

    Alert.alert(
      commonT('votesSubmitted'),
      message,
      [
        {
          text: commonT('confirm'),
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
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{commonT('loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>{commonT('welcomeBack')}, {user?.name}!</Text>
          <Text style={styles.teamName}>
            {user?.role === 'admin' ? 'Club Admin' : 'Team Member'}
          </Text>
        </View>

        {/* Stats Cards Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {user?.role === 'admin' ? commonT('clubStatistics') : commonT('teamStatistics')}
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

        {/* Team Goals Section - DEACTIVATED */}
        {/* 
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{commonT('teamGoals')}</Text>
            <View style={styles.sectionActions}>
              {canManagePlayers && (completedMatches.length > 0 || matchesWithResults.length > 0) && (
                <TouchableOpacity 
                  style={styles.matchResultsButton}
                  onPress={() => setMatchResultsModalVisible(true)}
                >
                  <Trophy size={16} color="#FF9500" strokeWidth={2} />
                  <Text style={styles.matchResultsText}>
                    {completedMatches.length > 0 ? 'Enter Results' : 'View Results'}
                  </Text>
                </TouchableOpacity>
              )}
              {canManagePlayers && (
                <TouchableOpacity 
                  style={styles.addGoalButton}
                  onPress={() => setCreateGoalModalVisible(true)}
                >
                  <Plus size={16} color="#007AFF" strokeWidth={2} />
                  <Text style={styles.addGoalText}>{commonT('addGoal')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {teamGoals.length === 0 ? (
            <View style={styles.emptyGoalsState}>
              <Target size={48} color="#E5E5E7" strokeWidth={1} />
              <Text style={styles.emptyGoalsText}>{commonT('noTeamGoals')}</Text>
              {canManagePlayers && (
                <Text style={styles.emptyGoalsSubtext}>
                  {commonT('createFirstTeamGoal')}
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
                        <CircleCheck size={16} color="#34C759" strokeWidth={1.5} />
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
                      <Text style={styles.progressLabel}>{commonT('progress')}</Text>
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
                        {commonT('due')}: {formatDeadline(goal.deadline)}
                      </Text>
                      <Text style={styles.goalTasks}>
                        {getCompletedTasks(goal.goal_tasks)}/{goal.goal_tasks?.length || 0} {commonT('tasks')}
                      </Text>
                    </View>
                  </View>

                  {selectedGoal === goal.id && goal.goal_tasks && (
                    <View style={styles.tasksList}>
                      <Text style={styles.tasksTitle}>{commonT('tasks')}:</Text>
                      {goal.goal_tasks.map((task: any) => (
                        <View key={task.id} style={styles.taskItem}>
                          {task.completed ? (
                            <CircleCheck size={16} color="#34C759" strokeWidth={1.5} />
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
        */}

        {/* Match Results Section - KEPT ACTIVE */}
        {canManagePlayers && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Match Results</Text>
              <TouchableOpacity 
                style={styles.matchResultsButton}
                onPress={() => setMatchResultsModalVisible(true)}
              >
                <Trophy size={16} color="#FF9500" strokeWidth={2} />
                <Text style={styles.matchResultsText}>
                  {completedMatches.length > 0 ? 'Enter Results' : 'View Results'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* POM Voting Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.pomButton}
            onPress={() => router.push('/POMVotingScreen')}
          >
            <View style={styles.pomIcon}>
              <Trophy size={20} color="#FFD700" strokeWidth={2} />
            </View>
            <View style={styles.pomContent}>
              <Text style={styles.pomTitle}>POM Voting</Text>
              <Text style={styles.pomSubtitle}>
                Vote for Player of the Match • 1st: 100P • 2nd: 50P • 3rd: 25P
              </Text>
            </View>
            <ChevronRight size={20} color="#8E8E93" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Create Team Goal Modal */}
      <Modal
        isVisible={isCreateGoalModalVisible}
        onBackdropPress={() => setCreateGoalModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{commonT('createTeamGoal')}</Text>
            <TouchableOpacity onPress={() => setCreateGoalModalVisible(false)}>
              <X size={24} color="#8E8E93" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{commonT('goalTitle')} *</Text>
              <TextInput
                style={styles.formInput}
                placeholder={commonT('goalTitle')}
                value={newGoal.title}
                onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{commonT('description')} *</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder={commonT('description')}
                value={newGoal.description}
                onChangeText={(text) => setNewGoal({ ...newGoal, description: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{commonT('priority')}</Text>
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
                      {commonT(priority)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{commonT('deadline')} *</Text>
              <View style={styles.dateInputContainer}>
                <CalendarDays size={20} color="#8E8E93" strokeWidth={1.5} />
                <TextInput
                  style={styles.dateInput}
                  placeholder={commonT('deadlinePlaceholder')}
                  value={newGoal.deadline}
                  onChangeText={handleDateChange}
                  placeholderTextColor="#8E8E93"
                  maxLength={10}
                />
              </View>
              <Text style={styles.formHint}>
                {commonT('deadlineHint')}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setCreateGoalModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>{commonT('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateGoal}
            >
              <Text style={styles.createButtonText}>{commonT('create')}</Text>
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
            <Text style={styles.modalTitle}>
              {completedMatches.length > 0 ? 'Enter Match Results' : 'Match Results'}
            </Text>
            <TouchableOpacity onPress={() => setMatchResultsModalVisible(false)}>
              <X size={24} color="#8E8E93" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          {!selectedMatch ? (
            <ScrollView style={styles.matchesList} showsVerticalScrollIndicator={false}>
              <Text style={styles.matchesTitle}>
                {completedMatches.length > 0 ? 'Select a Completed Match' : 'Completed Matches'}
              </Text>
              
              {/* Matches that need results */}
              {completedMatches.length === 0 ? (
                <View style={styles.emptyMatches}>
                  <Trophy size={48} color="#E5E5E7" strokeWidth={1} />
                  <Text style={styles.emptyMatchesText}>
                    {matchesWithResults.length > 0 
                      ? 'All completed matches have results' 
                      : 'No completed matches found'
                    }
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.sectionSubtitle}>{commonT('matchesNeedingResults')}</Text>
                  {completedMatches.map((match) => (
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
                  ))}
                </>
              )}

              {/* Matches that already have results */}
              {matchesWithResults.length > 0 && (
                <>
                  <Text style={styles.sectionSubtitle}>{commonT('matchesWithResults')}</Text>
                  {matchesWithResults.map((match) => (
                    <TouchableOpacity
                      key={match.id}
                      style={[styles.matchCard, styles.matchCardWithResults]}
                      disabled={true}
                    >
                      <View style={styles.matchInfo}>
                        <Text style={styles.matchOpponent}>{match.title}</Text>
                        <Text style={styles.matchDate}>
                          {new Date(match.event_date).toLocaleDateString()}
                        </Text>
                        <Text style={styles.matchLocation}>{match.location}</Text>
                        <View style={styles.resultSubmittedBadge}>
                          <Text style={styles.resultSubmittedText}>{commonT('resultSubmitted')}</Text>
                        </View>
                      </View>
                      <CircleCheck size={20} color="#34C759" strokeWidth={1.5} />
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
          ) : (
            <ScrollView style={styles.matchResultForm} showsVerticalScrollIndicator={false}>
              <View style={styles.selectedMatchHeader}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => setSelectedMatch(null)}
                >
                  <Text style={styles.backButtonText}>← {commonT('backToMatches')}</Text>
                </TouchableOpacity>
                <Text style={styles.selectedMatchTitle}>{selectedMatch.title}</Text>
                <Text style={styles.selectedMatchDate}>
                  {new Date(selectedMatch.event_date).toLocaleDateString()}
                </Text>
              </View>

              {/* Score Section */}
              <View style={styles.scoreSection}>
                <Text style={styles.scoreSectionTitle}>{commonT('finalScore')}</Text>
                <View style={styles.scoreInputs}>
                  <View style={styles.scoreInput}>
                    <Text style={styles.scoreLabel}>{commonT('myTeam')}</Text>
                    <TextInput
                      style={styles.scoreField}
                      value={matchResult.teamScore.toString()}
                      onChangeText={(text) => {
                        const newScore = parseInt(text) || 0;
                        setMatchResult(prev => {
                          // If score is reduced, remove excess goals and assists
                          const adjustedGoals = prev.goals.slice(0, newScore);
                          const adjustedAssists = prev.assists.slice(0, newScore);
                          
                          // Also update selection objects to match
                          setSelectedGoalUsers(prev => {
                            const newState = { ...prev };
                            Object.keys(newState).forEach(key => {
                              const keyIndex = parseInt(key);
                              if (keyIndex >= newScore) {
                                delete newState[keyIndex];
                              }
                            });
                            return newState;
                          });
                          setSelectedAssistUsers(prev => {
                            const newState = { ...prev };
                            Object.keys(newState).forEach(key => {
                              const keyIndex = parseInt(key);
                              if (keyIndex >= newScore) {
                                delete newState[keyIndex];
                              }
                            });
                            return newState;
                          });
                          
                          return {
                            ...prev,
                            teamScore: newScore,
                            goals: adjustedGoals,
                            assists: adjustedAssists
                          };
                        });
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                  <Text style={styles.scoreDivider}>-</Text>
                  <View style={styles.scoreInput}>
                    <Text style={styles.scoreLabel}>{commonT('opponent')}</Text>
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
                  <Text style={styles.statsInputTitle}>{commonT('goals')}</Text>
                  <TouchableOpacity style={styles.addStatButton} onPress={addGoal}>
                    <Plus size={16} color="#007AFF" strokeWidth={2} />
                    <Text style={styles.addStatText}>{commonT('addGoal')}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.limitText}>
                  {matchResult.goals.length}/{matchResult.teamScore} goal scorer{matchResult.teamScore === 1 ? '' : 's'} assigned
                </Text>
                {matchResult.goals.map((goal, index) => {
                  console.log(`🎯 Rendering goal ${index}:`, {
                    goalIndex: index,
                    goalPlayerId: goal.playerId,
                    goalPlayerName: goal.playerName,
                    allGoals: matchResult.goals.map(g => ({ playerId: g.playerId, playerName: g.playerName }))
                  });
                  
                  return (
                    <View key={`goal-${index}`} style={styles.statInputRow}>
                      <View style={styles.playerSelectContainer}>
                        <Text style={styles.playerSelectLabel}>Goal {index + 1}:</Text>
                        
                        {/* Selected Player Display */}
                        <Text style={styles.selectedPlayerText}>
                          {selectedGoalUsers[index] ? 
                            teamPlayers.find(p => p.user_id === selectedGoalUsers[index])?.name || 
                            'Unknown Player' 
                            : 'No player selected'
                          }
                        </Text>
                        
                        {/* Minute Input */}
                        <View style={styles.minuteInputContainer}>
                          <Text style={styles.minuteLabel}>Minute:</Text>
                          <TextInput
                            style={styles.minuteInput}
                            value={goal.minute ? goal.minute.toString() : ''}
                            onChangeText={(text) => {
                              const minute = parseInt(text) || null;
                              setMatchResult(prev => ({
                                ...prev,
                                goals: prev.goals.map((g, i) => 
                                  i === index ? { ...g, minute } : g
                                )
                              }));
                            }}
                            placeholder="e.g. 23"
                            keyboardType="numeric"
                            maxLength={3}
                          />
                        </View>
                        
                        {/* Player Selection */}
                        <View style={styles.playerSelect}>
                          {(() => {
                            console.log(`🎯 Rendering goal ${index} players:`, {
                              totalTeamPlayers: teamPlayers.length,
                              players: teamPlayers.map(p => ({
                                user_id: p.user_id,
                                name: p.name,
                                role: p.role
                              }))
                            });
                            return teamPlayers.map((player, playerIndex) => {
                              const isSelected = selectedGoalUsers[index] === player.user_id;
                              console.log(`🎯 Goal ${index} - Player ${player.user_id}:`, {
                                goalIndex: index,
                                playerUserId: player.user_id,
                                selectedGoalUsers: selectedGoalUsers,
                                isSelected,
                                playerName: player.name
                              });
                              
                              return (
                                <TouchableOpacity
                                  key={generatePlayerKey('goal', index, player, playerIndex)}
                                  style={[
                                    styles.playerOption,
                                    isSelected && styles.playerOptionSelected
                                  ]}
                                  onPress={() => updateGoalPlayer(index, player.user_id)}
                                >
                                  <Text style={[
                                    styles.playerOptionText,
                                    isSelected && styles.playerOptionTextSelected
                                  ]}>
                                    {player.name || `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Unknown Player'}
                                  </Text>
                                </TouchableOpacity>
                              );
                            });
                          })()}
                        </View>
                      </View>
                      
                      {/* Remove Button */}
                      <TouchableOpacity 
                        style={styles.removeStatButton}
                        onPress={() => removeGoal(index)}
                      >
                        <X size={16} color="#FF3B30" strokeWidth={1.5} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              {/* Assists Section */}
              <View style={styles.statsInputSection}>
                <View style={styles.statsInputHeader}>
                  <Text style={styles.statsInputTitle}>{commonT('assists')}</Text>
                  <TouchableOpacity style={styles.addStatButton} onPress={addAssist}>
                    <Plus size={16} color="#34C759" strokeWidth={2} />
                    <Text style={styles.addStatText}>{commonT('addAssist')}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.limitText}>
                  {matchResult.assists.length}/{matchResult.teamScore} assist provider{matchResult.teamScore === 1 ? '' : 's'} assigned (max {matchResult.teamScore})
                </Text>
                {matchResult.assists.map((assist, index) => (
                  <View key={index} style={styles.statInputRow}>
                    <View style={styles.playerSelectContainer}>
                      <Text style={styles.playerSelectLabel}>Assist {index + 1}:</Text>
                                              <Text style={styles.selectedPlayerText}>
                          {selectedAssistUsers[index] ? 
                            teamPlayers.find(p => p.user_id === selectedAssistUsers[index])?.name || 
                            'Unknown Player' 
                            : 'No player selected'
                          }
                        </Text>
                      <View style={styles.playerSelect}>
                        {(() => {
                          console.log(`🎯 Rendering assist ${index} players:`, {
                            totalTeamPlayers: teamPlayers.length,
                            players: teamPlayers.map(p => ({
                              user_id: p.user_id,
                              name: p.name,
                              role: p.role
                            }))
                          });
                          return teamPlayers.map((player, playerIndex) => {
                            const isSelected = selectedAssistUsers[index] === player.user_id;
                            console.log(`🎯 Assist ${index} - Player ${player.user_id}:`, {
                              assistIndex: index,
                              playerUserId: player.user_id,
                              selectedAssistUsers: selectedAssistUsers,
                              isSelected,
                              playerName: player.name
                            });
                            
                            return (
                              <TouchableOpacity
                                key={generatePlayerKey('assist', index, player, playerIndex)}
                                style={[
                                  styles.playerOption,
                                  isSelected && styles.playerOptionSelected
                                ]}
                                onPress={() => updateAssistPlayer(index, player.user_id)}
                              >
                                <Text style={[
                                  styles.playerOptionText,
                                  isSelected && styles.playerOptionTextSelected
                                ]}>
                                  {player.name || `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Unknown Player'}
                                </Text>
                              </TouchableOpacity>
                            );
                          });
                        })()}
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
                <Text style={styles.submitResultButtonText}>{commonT('submitMatchResult')}</Text>
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
            <Text style={styles.modalTitle}>{commonT('playerOfTheMatch')}</Text>
            <TouchableOpacity onPress={() => setPotmModalVisible(false)}>
              <X size={24} color="#8E8E93" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          {!selectedMatch ? (
            <ScrollView style={styles.matchesList} showsVerticalScrollIndicator={false}>
              <Text style={styles.matchesTitle}>{commonT('selectRecentMatch')}</Text>
              {recentMatches.length === 0 ? (
                <View style={styles.emptyMatches}>
                  <Text style={styles.emptyMatchesText}>
                    {commonT('noRecentMatches')}
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
                    <Text style={styles.matchOpponent}>{match.opponent}</Text>
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
                  <Text style={styles.backButtonText}>← {commonT('backToMatches')}</Text>
                </TouchableOpacity>
                <Text style={styles.selectedMatchTitle}>{commonT('vs')} {selectedMatch.opponent}</Text>
                <Text style={styles.selectedMatchDate}>
                  {new Date(selectedMatch.date).toLocaleDateString()}
                </Text>
              </View>

              {/* Voting Summary */}
              <View style={styles.votingSummary}>
                <Text style={styles.votingSummaryTitle}>{commonT('yourVotes')}</Text>
                <View style={styles.votesSummaryList}>
                  <View style={styles.voteSummaryItem}>
                    <Text style={styles.votePosition}>🥇 {commonT('firstPlace')}:</Text>
                    <Text style={styles.votePlayer}>
                      {potmVotes.first ? getPlayerName(potmVotes.first) : commonT('notSelected')}
                    </Text>
                  </View>
                  <View style={styles.voteSummaryItem}>
                    <Text style={styles.votePosition}>🥈 {commonT('secondPlace')}:</Text>
                    <Text style={styles.votePlayer}>
                      {potmVotes.second ? getPlayerName(potmVotes.second) : commonT('notSelected')}
                    </Text>
                  </View>
                  <View style={styles.voteSummaryItem}>
                    <Text style={styles.votePosition}>🥉 {commonT('thirdPlace')}:</Text>
                    <Text style={styles.votePlayer}>
                      {potmVotes.third ? getPlayerName(potmVotes.third) : commonT('notSelected')}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Player Selection */}
              <Text style={styles.playersTitle}>{commonT('selectPlayer')}</Text>
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
                  {commonT('submitVotes')}
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
  limitText: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  selectedPlayerText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
    fontWeight: '500',
  },
  clearSelectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
  },
  clearSelectionText: {
    fontSize: 12,
    color: '#FF3B30',
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
  minuteInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  minuteLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
    minWidth: 50,
  },
  minuteInput: {
    flex: 1,
    maxWidth: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
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
  pomButton: {
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
  pomIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFBF0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pomContent: {
    flex: 1,
  },
  pomTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 4,
  },
  pomSubtitle: {
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

  // Match results styles
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 12,
    marginTop: 20,
  },
  matchCardWithResults: {
    opacity: 0.6,
    backgroundColor: '#F8F9FA',
  },
  resultSubmittedBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  resultSubmittedText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
});