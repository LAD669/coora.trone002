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
import { getClubEvents, getClubTeams } from '@/lib/supabase';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Filter,
  ChevronDown
} from 'lucide-react-native';

export default function ManagerCalendarScreen() {
  const { t } = useTranslation('manager');
  const { clubId } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    if (clubId) {
      loadData();
    }
  }, [clubId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsData, teamsData] = await Promise.all([
        getClubEvents(clubId!, {
          teamId: selectedTeam,
          type: selectedType,
          dateRange: '30d'
        }),
        getClubTeams(clubId!)
      ]);
      setEvents(eventsData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading club data:', error);
      Alert.alert(t('error'), t('eventsLoadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clubId) {
      loadData();
    }
  }, [selectedTeam, selectedType]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'match':
        return <Users size={16} color="#FF3B30" />;
      case 'training':
        return <Clock size={16} color="#007AFF" />;
      default:
        return <Calendar size={16} color="#8E8E93" />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    return t(`eventTypes.${type}`) || type;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('calendar')}</Text>
        <Text style={styles.subtitle}>Club-wide events</Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={16} color="#007AFF" />
          <Text style={styles.filterText}>{t('filters.team')}</Text>
          <ChevronDown size={16} color="#8E8E93" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={16} color="#007AFF" />
          <Text style={styles.filterText}>{t('filters.type')}</Text>
          <ChevronDown size={16} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      {/* Events List */}
      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={48} color="#8E8E93" />
          <Text style={styles.emptyTitle}>{t('noEvents')}</Text>
          <Text style={styles.emptyDescription}>{t('noEventsDescription')}</Text>
        </View>
      ) : (
        <View style={styles.eventsList}>
          {events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <View style={styles.eventTypeContainer}>
                  {getEventIcon(event.event_type)}
                  <Text style={styles.eventTypeLabel}>
                    {getEventTypeLabel(event.event_type)}
                  </Text>
                </View>
                <Text style={styles.eventDate}>
                  {new Date(event.event_date).toLocaleDateString()}
                </Text>
              </View>
              
              <Text style={styles.eventTitle}>{event.title}</Text>
              
              {event.teams && (
                <Text style={styles.eventTeam}>
                  {event.teams.name} ({event.teams.sport})
                </Text>
              )}
              
              <View style={styles.eventDetails}>
                {event.start_time && (
                  <View style={styles.eventDetail}>
                    <Clock size={14} color="#8E8E93" />
                    <Text style={styles.eventDetailText}>
                      {new Date(event.start_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                )}
                
                {event.location && (
                  <View style={styles.eventDetail}>
                    <MapPin size={14} color="#8E8E93" />
                    <Text style={styles.eventDetailText}>{event.location}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginTop: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 50,
    fontFamily: 'Urbanist-Regular',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 50,
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
  },
  eventsList: {
    paddingHorizontal: 24,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
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
    gap: 8,
  },
  eventTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  eventDate: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 8,
  },
  eventTeam: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginBottom: 12,
  },
  eventDetails: {
    gap: 8,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
});
