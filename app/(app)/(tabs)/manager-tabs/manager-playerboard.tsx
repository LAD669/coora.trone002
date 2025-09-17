import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import Header from '@/components/Header';
import { Users, Search, User, Award, Filter, ChevronDown, ChevronUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { getAllClubTeams, getAllClubUsers } from '@/lib/supabase';

interface Team {
  id: string;
  name: string;
  sport: string;
  color: string;
  users: any[];
}

interface ClubUser {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  position: string;
  jersey_number: number;
  phone_number: string;
  teams: {
    id: string;
    name: string;
    sport: string;
  };
}

export default function ManagerPlayerboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [allUsers, setAllUsers] = useState<ClubUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ClubUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const roles = [
    { value: 'all', label: 'All Roles' },
    { value: 'player', label: 'Players' },
    { value: 'trainer', label: 'Trainers' },
    { value: 'manager', label: 'Managers' },
  ];

  const loadClubData = async () => {
    if (!user?.clubId) {
      console.log('No club ID found for manager');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Load all teams
      const teamsData = await getAllClubTeams(user.clubId);
      setTeams(teamsData);

      // Load all users
      const usersData = await getAllClubUsers(user.clubId);
      setAllUsers(usersData);
      setFilteredUsers(usersData);

    } catch (error) {
      console.error('Error loading club data:', error);
      Alert.alert('Error', 'Failed to load club data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClubData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadClubData();
  }, [user?.clubId]);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, selectedRole, selectedTeam, allUsers]);

  const filterUsers = () => {
    let filtered = allUsers;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.first_name.toLowerCase().includes(query) ||
        user.last_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.position?.toLowerCase().includes(query)
      );
    }

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // Filter by team
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(user => user.teams?.id === selectedTeam);
    }

    setFilteredUsers(filtered);
  };

  const toggleTeamExpansion = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const getUserRoleIcon = (role: string) => {
    switch (role) {
      case 'trainer':
        return <Award size={16} color="#FF9500" />;
      case 'manager':
        return <Award size={16} color="#007AFF" />;
      default:
        return <User size={16} color="#34C759" />;
    }
  };

  const getUserRoleColor = (role: string) => {
    switch (role) {
      case 'trainer':
        return '#FF9500';
      case 'manager':
        return '#007AFF';
      default:
        return '#34C759';
    }
  };

  const renderUserCard = (clubUser: ClubUser) => (
    <TouchableOpacity 
      key={clubUser.id} 
      style={styles.userCard}
      onPress={() => router.push(`/(app)/PlayerDetailScreen?id=${clubUser.id}`)}
    >
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{clubUser.name}</Text>
          <View style={styles.userRoleContainer}>
            {getUserRoleIcon(clubUser.role)}
            <Text style={[styles.userRole, { color: getUserRoleColor(clubUser.role) }]}>
              {clubUser.role.charAt(0).toUpperCase() + clubUser.role.slice(1)}
            </Text>
          </View>
        </View>
        {clubUser.jersey_number && (
          <View style={styles.jerseyNumber}>
            <Text style={styles.jerseyNumberText}>#{clubUser.jersey_number}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.userDetails}>
        <Text style={styles.userTeam}>{clubUser.teams?.name}</Text>
        {clubUser.position && (
          <Text style={styles.userPosition}>{clubUser.position}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderTeamSection = (team: Team) => {
    const teamUsers = filteredUsers.filter(user => user.teams?.id === team.id);
    const isExpanded = expandedTeams.has(team.id);

    return (
      <View key={team.id} style={styles.teamSection}>
        <TouchableOpacity 
          style={styles.teamHeader}
          onPress={() => toggleTeamExpansion(team.id)}
        >
          <View style={styles.teamHeaderLeft}>
            <View style={[styles.teamColorIndicator, { backgroundColor: team.color }]} />
            <View>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamSport}>{team.sport}</Text>
            </View>
          </View>
          <View style={styles.teamHeaderRight}>
            <Text style={styles.teamUserCount}>{teamUsers.length} members</Text>
            {isExpanded ? <ChevronUp size={20} color="#666" /> : <ChevronDown size={20} color="#666" />}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.teamUsers}>
            {teamUsers.length > 0 ? (
              teamUsers.map(renderUserCard)
            ) : (
              <Text style={styles.emptyTeamText}>No members found</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search members..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterRow}>
        <View style={styles.filterContainer}>
          <Filter size={16} color="#666" />
          <Text style={styles.filterLabel}>Role:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {roles.map(role => (
              <TouchableOpacity
                key={role.value}
                style={[
                  styles.filterChip,
                  selectedRole === role.value && styles.filterChipActive
                ]}
                onPress={() => setSelectedRole(role.value)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedRole === role.value && styles.filterChipTextActive
                ]}>
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.filterContainer}>
          <Filter size={16} color="#666" />
          <Text style={styles.filterLabel}>Team:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedTeam === 'all' && styles.filterChipActive
              ]}
              onPress={() => setSelectedTeam('all')}
            >
              <Text style={[
                styles.filterChipText,
                selectedTeam === 'all' && styles.filterChipTextActive
              ]}>
                All Teams
              </Text>
            </TouchableOpacity>
            {teams.map(team => (
              <TouchableOpacity
                key={team.id}
                style={[
                  styles.filterChip,
                  selectedTeam === team.id && styles.filterChipActive
                ]}
                onPress={() => setSelectedTeam(team.id)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedTeam === team.id && styles.filterChipTextActive
                ]}>
                  {team.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="All Teams & Members" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading club members...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="All Teams & Members" />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderFilters()}

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Users size={20} color="#007AFF" />
            <Text style={styles.statText}>{filteredUsers.length} Members</Text>
          </View>
          <View style={styles.statItem}>
            <Award size={20} color="#FF9500" />
            <Text style={styles.statText}>
              {filteredUsers.filter(u => u.role === 'trainer').length} Trainers
            </Text>
          </View>
        </View>

        {teams.map(renderTeamSection)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  filtersContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  filterRow: {
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
    marginRight: 8,
  },
  filterChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  teamSection: {
    backgroundColor: 'white',
    marginBottom: 8,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  teamHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  teamSport: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  teamHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamUserCount: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  teamUsers: {
    padding: 16,
  },
  emptyTeamText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  userCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRole: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  jerseyNumber: {
    backgroundColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  jerseyNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  userDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userTeam: {
    fontSize: 14,
    color: '#666',
  },
  userPosition: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
