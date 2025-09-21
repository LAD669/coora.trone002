import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Modal from 'react-native-modal';
import { useAuth } from '@/contexts/AuthProvider';
import { getClubEvents } from '@/lib/api/club';
import { createEvent } from '@/lib/supabase';
import { Plus, Calendar as CalendarIcon, MapPin, Clock, ChevronLeft, ChevronRight, Check, X, Users, UserCheck, UserX, Clock as ClockIcon } from 'lucide-react-native';
import { Event } from '@/types';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import TopBarManager from '@/components/ui/TopBarManager';
import { useRouter } from 'expo-router';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function KalenderManager() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Early return if user is not available
  if (!user) {
    return null;
  }
  
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'training' as 'training' | 'match',
    date: '',
    trainingStartTime: '',
    trainingEndTime: '',
    meetingTime: '',
    matchStartTime: '',
    matchEndTime: '',
    location: '',
    notes: '',
  });

  const canCreateEvent = user?.role === 'manager' || user?.role === 'admin';

  // Load events from database on component mount
  useEffect(() => {
    if (user?.clubId) {
      loadEvents();
    }
  }, [user, currentMonth]);

  const loadEvents = async () => {
    if (!user?.clubId) return;
    
    try {
      // Manager: load club-wide events
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const data = await getClubEvents(user.clubId, startOfMonth.toISOString(), endOfMonth.toISOString());
      
      // Transform Supabase data to match component expectations
      const transformedEvents = (data || []).map((event: any) => ({
        id: event.id,
        title: event.title,
        type: event.event_type,
        date: new Date(event.event_date),
        meetingTime: event.meeting_time ? new Date(event.meeting_time) : undefined,
        startTime: event.start_time ? new Date(event.start_time) : undefined,
        endDate: event.end_time ? new Date(event.end_time) : undefined,
        location: event.location,
        notes: event.notes || undefined,
        teamId: event.team_id,
        createdBy: event.created_by,
        requiresResponse: event.requires_response,
        responses: event.responses || {},
        isRepeating: event.is_repeating,
        repeatPattern: event.repeat_pattern,
        parentEventId: event.parent_event_id,
        event_responses: event.event_responses || [],
      }));
      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.date || !newEvent.location.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user?.clubId || !user?.id) {
      Alert.alert('Error', 'Authentication error');
      return;
    }

    try {
      let eventDate: string;
      let meetingTime: string | undefined;
      let startTime: string | undefined;
      let endTime: string | undefined;
      
      if (newEvent.type === 'training') {
        eventDate = `${newEvent.date}T${newEvent.trainingStartTime}:00`;
        endTime = newEvent.trainingEndTime ? `${newEvent.date}T${newEvent.trainingEndTime}:00` : undefined;
      } else {
        eventDate = `${newEvent.date}T${newEvent.meetingTime}:00`;
        meetingTime = `${newEvent.date}T${newEvent.meetingTime}:00`;
        startTime = `${newEvent.date}T${newEvent.matchStartTime}:00`;
        endTime = newEvent.matchEndTime ? `${newEvent.date}T${newEvent.matchEndTime}:00` : undefined;
      }
      
      const eventData = {
        title: newEvent.title,
        eventType: newEvent.type,
        eventDate: eventDate,
        meetingTime: meetingTime,
        startTime: startTime,
        endTime: endTime,
        location: newEvent.location,
        notes: newEvent.notes || undefined,
        teamId: user.clubId, // For club events, we use clubId as teamId
        createdBy: user.id,
        requiresResponse: true,
        isRepeating: false,
      };

      await createEvent(eventData);
      
      setNewEvent({ 
        title: '', 
        type: 'training', 
        date: '', 
        trainingStartTime: '', 
        trainingEndTime: '', 
        meetingTime: '',
        matchStartTime: '',
        matchEndTime: '',
        location: '', 
        notes: '',
      });
      setModalVisible(false);
      Alert.alert('Success', 'Event created successfully!');
      loadEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
  };

  const getEventsForSelectedDate = () => {
    return events.filter(event => 
      event.date.getDate() === selectedDate.getDate() &&
      event.date.getMonth() === selectedDate.getMonth() &&
      event.date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const hasEvents = (date: Date) => {
    return events.some(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <SafeAreaView style={styles.container}>
      <TopBarManager 
        title="Kalender" 
        onPressBell={() => router.push("/notifications")} 
        onPressSettings={() => router.push("/settings")} 
      />
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 + insets.bottom + 49 }}
      >
        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigateMonth('prev')}
          >
            <ChevronLeft size={20} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
          
          <Text style={styles.monthYear}>
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigateMonth('next')}
          >
            <ChevronRight size={20} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Days of Week Header */}
        <View style={styles.daysHeader}>
          {DAYS.map(day => (
            <Text key={day} style={styles.dayHeaderText}>{day}</Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                day && isSameDay(day, selectedDate) && styles.selectedDay,
                day && isToday(day) && styles.today,
              ]}
              onPress={() => day && setSelectedDate(day)}
              disabled={!day}
            >
              {day && (
                <>
                  <Text style={[
                    styles.dayText,
                    isSameDay(day, selectedDate) && styles.selectedDayText,
                    isToday(day) && !isSameDay(day, selectedDate) && styles.todayText,
                  ]}>
                    {day.getDate()}
                  </Text>
                  {hasEvents(day) && (
                    <View style={[
                      styles.eventDot,
                      isSameDay(day, selectedDate) && styles.selectedEventDot
                    ]} />
                  )}
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected Date Events */}
        <View style={styles.selectedDateSection}>
          <Text style={styles.selectedDateTitle}>
            {formatDate(selectedDate)}
          </Text>

          <View style={styles.eventsContainer}>
            {getEventsForSelectedDate().length === 0 ? (
              <View style={styles.emptyState}>
                <CalendarIcon size={48} color="#E5E5E7" strokeWidth={1} />
                <Text style={styles.emptyStateText}>No events scheduled</Text>
              </View>
            ) : (
              getEventsForSelectedDate().map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <View style={styles.eventTypeContainer}>
                      <View style={[
                        styles.eventTypeDot,
                        { backgroundColor: event.type === 'match' ? '#FF3B30' : '#007AFF' }
                      ]} />
                      <Text style={styles.eventType}>
                        {event.type === 'match' ? 'Match' : 'Training'}
                      </Text>
                    </View>
                    <Text style={styles.eventTime}>
                      {formatTime(event.date)}
                    </Text>
                  </View>
                  
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  
                  <View style={styles.eventDetails}>
                    <View style={styles.eventDetailRow}>
                      <MapPin size={14} color="#8E8E93" strokeWidth={1.5} />
                      <Text style={styles.eventDetailText}>{event.location}</Text>
                    </View>
                  </View>
                  
                  {event.notes && (
                    <Text style={styles.eventNotes}>{event.notes}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      {canCreateEvent && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => {
            const dateStr = selectedDate.toISOString().split('T')[0];
            setNewEvent({ 
              ...newEvent, 
              date: dateStr, 
              trainingStartTime: '', 
              trainingEndTime: '',
              meetingTime: '',
              matchStartTime: '',
              matchEndTime: ''
            });
            setModalVisible(true);
          }}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      )}

      {/* Create Event Modal */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule Club Event</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              style={styles.input}
              placeholder="Event title"
              value={newEvent.title}
              onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
              placeholderTextColor="#8E8E93"
            />

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newEvent.type === 'training' && styles.typeButtonActive
                ]}
                onPress={() => setNewEvent({ ...newEvent, type: 'training' })}
              >
                <Text style={[
                  styles.typeButtonText,
                  newEvent.type === 'training' && styles.typeButtonTextActive
                ]}>Training</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newEvent.type === 'match' && styles.typeButtonActive
                ]}
                onPress={() => setNewEvent({ ...newEvent, type: 'match' })}
              >
                <Text style={[
                  styles.typeButtonText,
                  newEvent.type === 'match' && styles.typeButtonTextActive
                ]}>Match</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateRow}>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={newEvent.date}
                onChangeText={(text) => setNewEvent({ ...newEvent, date: text })}
                placeholderTextColor="#8E8E93"
              />
            </View>

            {newEvent.type === 'training' ? (
              <View style={styles.timeRow}>
                <View style={styles.timeInputContainer}>
                  <Text style={styles.timeLabel}>Start Time *</Text>
                  <TextInput
                    style={[styles.input, styles.timeInput]}
                    placeholder="HH:MM"
                    value={newEvent.trainingStartTime}
                    onChangeText={(text) => setNewEvent({ ...newEvent, trainingStartTime: text })}
                    placeholderTextColor="#8E8E93"
                  />
                </View>
                <View style={styles.timeInputContainer}>
                  <Text style={styles.timeLabel}>End Time</Text>
                  <TextInput
                    style={[styles.input, styles.timeInput]}
                    placeholder="HH:MM"
                    value={newEvent.trainingEndTime}
                    onChangeText={(text) => setNewEvent({ ...newEvent, trainingEndTime: text })}
                    placeholderTextColor="#8E8E93"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.matchTimesContainer}>
                <View style={styles.timeInputContainer}>
                  <Text style={styles.timeLabel}>Meeting Time *</Text>
                  <TextInput
                    style={[styles.input, styles.timeInput]}
                    placeholder="HH:MM"
                    value={newEvent.meetingTime}
                    onChangeText={(text) => setNewEvent({ ...newEvent, meetingTime: text })}
                    placeholderTextColor="#8E8E93"
                  />
                </View>
                
                <View style={styles.timeInputContainer}>
                  <Text style={styles.timeLabel}>Start Time *</Text>
                  <TextInput
                    style={[styles.input, styles.timeInput]}
                    placeholder="HH:MM"
                    value={newEvent.matchStartTime}
                    onChangeText={(text) => setNewEvent({ ...newEvent, matchStartTime: text })}
                    placeholderTextColor="#8E8E93"
                  />
                </View>
                
                <View style={styles.timeInputContainer}>
                  <Text style={styles.timeLabel}>End Time</Text>
                  <TextInput
                    style={[styles.input, styles.timeInput]}
                    placeholder="HH:MM"
                    value={newEvent.matchEndTime}
                    onChangeText={(text) => setNewEvent({ ...newEvent, matchEndTime: text })}
                    placeholderTextColor="#8E8E93"
                  />
                </View>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder="Location"
              value={newEvent.location}
              onChangeText={(text) => setNewEvent({ ...newEvent, location: text })}
              placeholderTextColor="#8E8E93"
            />

            <TextInput
              style={styles.notesInput}
              placeholder="Notes (optional)"
              value={newEvent.notes}
              onChangeText={(text) => setNewEvent({ ...newEvent, notes: text })}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor="#8E8E93"
            />

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateEvent}
            >
              <Text style={styles.createButtonText}>Schedule Event</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
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
    paddingBottom: 100,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  daysHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    marginBottom: 8,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 32,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  selectedDay: {
    backgroundColor: '#000000',
    borderRadius: 20,
  },
  today: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
  },
  dayText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Urbanist-SemiBold',
  },
  todayText: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontFamily: 'Urbanist-SemiBold',
  },
  eventDot: {
    position: 'absolute',
    bottom: 6,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#1A1A1A',
  },
  selectedEventDot: {
    backgroundColor: '#FFFFFF',
  },
  selectedDateSection: {
    marginBottom: 32,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 24,
    fontFamily: 'Urbanist-SemiBold',
  },
  eventsContainer: {
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
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
  eventTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventType: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  eventTime: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    fontFamily: 'Urbanist-SemiBold',
  },
  eventDetails: {
    gap: 8,
    marginBottom: 8,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
  },
  eventNotes: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 8,
    fontFamily: 'Urbanist-Regular',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  cancelText: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  modalScrollView: {
    maxHeight: '80%',
  },
  input: {
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 16,
    fontFamily: 'Urbanist-Regular',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#1A1A1A',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  dateRow: {
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  matchTimesContainer: {
    gap: 16,
    marginBottom: 16,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
    marginBottom: 8,
  },
  timeInput: {
    marginBottom: 0,
  },
  notesInput: {
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 16,
    height: 80,
    marginBottom: 24,
    fontFamily: 'Urbanist-Regular',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  createButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
});
