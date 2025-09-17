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
import { Calendar, Search, Filter, ChevronDown, ChevronUp, Clock, MapPin, Users, Trophy, Activity } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { getAllClubEvents, getAllClubTeams } from '@/lib/supabase';

interface ClubEvent {
  id: string;
  title: string;
  event_type: 'training' | 'match';
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  notes: string;
  teams: {
    id: string;
    name: string;
    sport: string;
    color: string;
  };
  users: {
    id: string;
    name: string;
    first_name: string;
    last_name: string;
  };
}

interface Team {
  id: string;
  name: string;
  sport: string;
  color: string;
}

export default function ManagerCalendar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<ClubEvent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('all');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const eventTypes = [
    { value: 'all', label: 'All Events' },
    { value: 'training', label: 'Training' },
    { value: 'match', label: 'Matches' },
  ];

  const timeFilters = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  const loadClubData = async () => {
    if (!user?.clubId) {
      console.log('No club ID found for manager');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Load all events
      const eventsData = await getAllClubEvents(user.clubId);
      setEvents(eventsData);
      setFilteredEvents(eventsData);

      // Load all teams
      const teamsData = await getAllClubTeams(user.clubId);
      setTeams(teamsData);

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
    filterEvents();
  }, [searchQuery, selectedTeam, selectedEventType, selectedTimeFilter, events]);

  const filterEvents = () => {
    let filtered = events;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.teams?.name.toLowerCase().includes(query) ||
        event.notes?.toLowerCase().includes(query)
      );
    }

    // Filter by team
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(event => event.teams?.id === selectedTeam);
    }

    // Filter by event type
    if (selectedEventType !== 'all') {
      filtered = filtered.filter(event => event.event_type === selectedEventType);
    }

    // Filter by time
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (selectedTimeFilter !== 'all') {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.event_date);
        switch (selectedTimeFilter) {
          case 'today':
            return eventDate >= today && eventDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          case 'week':
            return eventDate >= today && eventDate < weekFromNow;
          case 'month':
            return eventDate >= today && eventDate < monthFromNow;
          default:
            return true;
        }
      });
    }

    // Sort by date
    filtered.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

    setFilteredEvents(filtered);
  };

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'match':
        return <Trophy size={20} color="#FF9500" />;
      case 'training':
        return <Activity size={20} color="#007AFF" />;
      default:
        return <Calendar size={20} color="#666" />;
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'match':
        return '#FF9500';
      case 'training':
        return '#007AFF';
      default:
        return '#666';
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatEventTime = (timeString: string) => {
    if (!timeString) return '';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderEventCard = (event: ClubEvent) => {
    const isExpanded = expandedEvents.has(event.id);
    const eventDate = new Date(event.event_date);
    const isPast = eventDate < new Date();

    return (
      <TouchableOpacity 
        key={event.id} 
        style={[
          styles.eventCard,
          isPast && styles.pastEventCard
        ]}
        onPress={() => toggleEventExpansion(event.id)}
      >
        <View style={styles.eventHeader}>
          <View style={styles.eventHeaderLeft}>
            <View style={[styles.teamColorIndicator, { backgroundColor: event.teams?.color || '#666' }]} />
            <View style={styles.eventInfo}>
              <Text style={[styles.eventTitle, isPast && styles.pastEventText]}>
                {event.title}
              </Text>
              <Text style={[styles.eventTeam, isPast && styles.pastEventText]}>
                {event.teams?.name} • {event.teams?.sport}
              </Text>
            </View>
          </View>
          <View style={styles.eventHeaderRight}>
            {getEventIcon(event.event_type)}
            {isExpanded ? <ChevronUp size={20} color="#666" /> : <ChevronDown size={20} color="#666" />}
          </View>
        </View>

        <View style={styles.eventMeta}>
          <View style={styles.eventMetaItem}>
            <Calendar size={14} color="#666" />
            <Text style={[styles.eventMetaText, isPast && styles.pastEventText]}>
              {formatEventDate(event.event_date)}
            </Text>
          </View>
          {event.start_time && (
            <View style={styles.eventMetaItem}>
              <Clock size={14} color="#666" />
              <Text style={[styles.eventMetaText, isPast && styles.pastEventText]}>
                {formatEventTime(event.start_time)}
                {event.end_time && ` - ${formatEventTime(event.end_time)}`}
              </Text>
            </View>
          )}
          <View style={styles.eventMetaItem}>
            <MapPin size={14} color="#666" />
            <Text style={[styles.eventMetaText, isPast && styles.pastEventText]}>
              {event.location}
            </Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.eventDetails}>
            {event.notes && (
              <View style={styles.eventNotes}>
                <Text style={styles.eventNotesLabel}>Notes:</Text>
                <Text style={styles.eventNotesText}>{event.notes}</Text>
              </View>
            )}
            <View style={styles.eventCreator}>
              <Text style={styles.eventCreatorLabel}>Created by:</Text>
              <Text style={styles.eventCreatorText}>{event.users?.name}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterRow}>
        <View style={styles.filterContainer}>
          <Filter size={16} color="#666" />
          <Text style={styles.filterLabel}>Type:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {eventTypes.map(type => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.filterChip,
                  selectedEventType === type.value && styles.filterChipActive
                ]}
                onPress={() => setSelectedEventType(type.value)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedEventType === type.value && styles.filterChipTextActive
                ]}>
                  {type.label}
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

      <View style={styles.filterRow}>
        <View style={styles.filterContainer}>
          <Filter size={16} color="#666" />
          <Text style={styles.filterLabel}>Time:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {timeFilters.map(filter => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.filterChip,
                  selectedTimeFilter === filter.value && styles.filterChipActive
                ]}
                onPress={() => setSelectedTimeFilter(filter.value)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedTimeFilter === filter.value && styles.filterChipTextActive
                ]}>
                  {filter.label}
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
        <Header title="Club Calendar" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading club events...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Club Calendar" />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderFilters()}

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Calendar size={20} color="#007AFF" />
            <Text style={styles.statText}>{filteredEvents.length} Events</Text>
          </View>
          <View style={styles.statItem}>
            <Trophy size={20} color="#FF9500" />
            <Text style={styles.statText}>
              {filteredEvents.filter(e => e.event_type === 'match').length} Matches
            </Text>
          </View>
          <View style={styles.statItem}>
            <Activity size={20} color="#34C759" />
            <Text style={styles.statText}>
              {filteredEvents.filter(e => e.event_type === 'training').length} Trainings
            </Text>
          </View>
        </View>

        {filteredEvents.length > 0 ? (
          filteredEvents.map(renderEventCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Calendar size={48} color="#ccc" />
            <Text style={styles.emptyText}>No events found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        )}
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
  eventCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pastEventCard: {
    opacity: 0.7,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  teamColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  eventTeam: {
    fontSize: 14,
    color: '#666',
  },
  eventHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventMeta: {
    marginBottom: 8,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventMetaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  pastEventText: {
    color: '#999',
  },
  eventDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 8,
  },
  eventNotes: {
    marginBottom: 8,
  },
  eventNotesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  eventNotesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  eventCreator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventCreatorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 8,
  },
  eventCreatorText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});
