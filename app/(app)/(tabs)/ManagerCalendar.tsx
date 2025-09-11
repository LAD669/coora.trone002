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
import { Calendar, Clock, MapPin, Users, Filter } from 'lucide-react-native';
import { getClubEvents } from '@/lib/supabase';

interface ClubEvent {
  id: string;
  title: string;
  event_type: 'training' | 'match';
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string;
  team_id: string;
  team_name: string;
  created_by: string;
  created_by_name: string;
}

interface EventFilters {
  teamId: string | null;
  type: 'all' | 'match' | 'training';
  dateRange: '30d' | '90d' | '1y';
}

export default function ManagerCalendarScreen() {
  const { t } = useTranslation('manager');
  const { user } = useAuth();
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({
    teamId: null,
    type: 'all',
    dateRange: '30d',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user?.clubId) {
      loadClubData();
    }
  }, [user?.clubId]);

  useEffect(() => {
    if (user?.clubId) {
      loadClubEvents();
    }
  }, [user?.clubId, filters]);

  const loadClubData = async () => {
    if (!user?.clubId) return;

    try {
      // Load teams for filter
      const clubTeams = await getClubTeams(user.clubId);
      setTeams(clubTeams);
    } catch (error) {
      console.error('Error loading club data:', error);
    }
  };

  const loadClubEvents = async () => {
    if (!user?.clubId) return;

    try {
      setIsLoading(true);
      const clubEvents = await getClubEvents(user.clubId, {
        teamId: filters.teamId,
        type: filters.type === 'all' ? null : filters.type,
        dateRange: filters.dateRange,
      });
      setEvents(clubEvents);
    } catch (error) {
      console.error('Error loading club events:', error);
      Alert.alert(t('error'), t('eventsLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClubEvents();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '';
    const time = new Date(timeString);
    return time.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'match':
        return <Users size={20} color="#FF3B30" />;
      case 'training':
        return <Clock size={20} color="#007AFF" />;
      default:
        return <Calendar size={20} color="#8E8E93" />;
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'match':
        return t('eventTypes.match');
      case 'training':
        return t('eventTypes.training');
      default:
        return t('eventTypes.other');
    }
  };

  const filteredEvents = events.filter((event) => {
    if (filters.teamId && event.team_id !== filters.teamId) return false;
    if (filters.type !== 'all' && event.event_type !== filters.type) return false;
    return true;
  });

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
        <Text style={styles.title}>{t('calendar')}</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color="#007AFF" />
          <Text style={styles.filterButtonText}>{t('filters')}</Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filters.type === 'all' && styles.filterChipActive,
                ]}
                onPress={() => setFilters({ ...filters, type: 'all' })}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filters.type === 'all' && styles.filterChipTextActive,
                  ]}
                >
                  {t('filters.allTypes')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filters.type === 'match' && styles.filterChipActive,
                ]}
                onPress={() => setFilters({ ...filters, type: 'match' })}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filters.type === 'match' && styles.filterChipTextActive,
                  ]}
                >
                  {t('filters.matches')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filters.type === 'training' && styles.filterChipActive,
                ]}
                onPress={() => setFilters({ ...filters, type: 'training' })}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filters.type === 'training' && styles.filterChipTextActive,
                  ]}
                >
                  {t('filters.trainings')}
                </Text>
              </TouchableOpacity>

              {teams.map((team) => (
                <TouchableOpacity
                  key={team.id}
                  style={[
                    styles.filterChip,
                    filters.teamId === team.id && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setFilters({
                      ...filters,
                      teamId: filters.teamId === team.id ? null : team.id,
                    })
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.teamId === team.id && styles.filterChipTextActive,
                    ]}
                  >
                    {team.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <ScrollView
        style={styles.eventsContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#8E8E93" />
            <Text style={styles.emptyTitle}>{t('noEvents')}</Text>
            <Text style={styles.emptySubtitle}>{t('noEventsDescription')}</Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {filteredEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <View style={styles.eventTypeContainer}>
                    {getEventIcon(event.event_type)}
                    <Text style={styles.eventTypeLabel}>
                      {getEventTypeLabel(event.event_type)}
                    </Text>
                  </View>
                  <Text style={styles.eventDate}>{formatDate(event.event_date)}</Text>
                </View>

                <Text style={styles.eventTitle}>{event.title}</Text>

                <View style={styles.eventDetails}>
                  <View style={styles.eventDetail}>
                    <Clock size={16} color="#8E8E93" />
                    <Text style={styles.eventDetailText}>
                      {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </Text>
                  </View>
                  <View style={styles.eventDetail}>
                    <MapPin size={16} color="#8E8E93" />
                    <Text style={styles.eventDetailText}>{event.location}</Text>
                  </View>
                  <View style={styles.eventDetail}>
                    <Users size={16} color="#8E8E93" />
                    <Text style={styles.eventDetailText}>{event.team_name}</Text>
                  </View>
                </View>
              </View>
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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontFamily: 'Urbanist-Medium',
    marginLeft: 4,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 12,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  eventsContainer: {
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
  },
  eventsList: {
    padding: 20,
  },
  eventCard: {
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    fontFamily: 'Urbanist-SemiBold',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  eventDate: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 16,
    lineHeight: 24,
  },
  eventDetails: {
    gap: 8,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDetailText: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginLeft: 8,
  },
});
