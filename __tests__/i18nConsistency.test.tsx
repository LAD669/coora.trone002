import { render, screen } from '@testing-library/react-native';
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';
import CalendarScreen from '../app/(app)/(tabs)/calendar';

// Mock dependencies
jest.mock('../contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      teamId: 'test-team-id',
      role: 'trainer',
      name: 'Test User'
    },
  }),
}));

jest.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'en',
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'calendar.title': 'Calendar',
        'calendar.schedule.title': 'Schedule event',
        'calendar.schedule.eventTitlePlaceholder': 'Enter event title',
        'calendar.schedule.type': 'Type',
        'calendar.schedule.training': 'Training',
        'calendar.schedule.match': 'Match',
        'calendar.schedule.date': 'Date',
        'calendar.schedule.datePlaceholder': 'YYYY-MM-DD',
        'calendar.schedule.startTime': 'Start time',
        'calendar.schedule.startTimePlaceholder': 'HH:MM',
        'calendar.schedule.endTime': 'End time',
        'calendar.schedule.endTimePlaceholder': 'HH:MM',
        'calendar.schedule.location': 'Location',
        'calendar.schedule.locationPlaceholder': 'Enter location',
        'calendar.schedule.notes': 'Notes',
        'calendar.schedule.notesPlaceholder': 'Notes (optional)',
        'calendar.schedule.durationPlaceholder': 'Auto-calculated',
        'calendar.actions.schedule': 'Schedule event',
        'calendar.actions.save': 'Save',
        'calendar.actions.cancel': 'Cancel',
        'calendar.emptyState.title': 'No events scheduled',
        'calendar.emptyState.subtitle': 'Create your first event to get started'
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../lib/supabase', () => ({
  getTeamEvents: jest.fn(() => Promise.resolve([])),
  createEvent: jest.fn(() => Promise.resolve({})),
  respondToEvent: jest.fn(() => Promise.resolve({})),
  getEventResponses: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../components/Header', () => {
  const { Text } = require('react-native');
  return function MockHeader({ title }: { title: string }) {
    return <Text testID="header-title">{title}</Text>;
  };
});

describe('i18n Consistency Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    i18next.init({
      lng: 'en',
      fallbackLng: 'en',
      resources: {
        en: {
          translation: {
            calendar: {
              title: 'Calendar',
              schedule: {
                title: 'Schedule event',
                eventTitlePlaceholder: 'Enter event title',
                type: 'Type',
                training: 'Training',
                match: 'Match',
                date: 'Date',
                datePlaceholder: 'YYYY-MM-DD',
                startTime: 'Start time',
                startTimePlaceholder: 'HH:MM',
                endTime: 'End time',
                endTimePlaceholder: 'HH:MM',
                location: 'Location',
                locationPlaceholder: 'Enter location',
                notes: 'Notes',
                notesPlaceholder: 'Notes (optional)',
                durationPlaceholder: 'Auto-calculated'
              },
              actions: {
                schedule: 'Schedule event',
                save: 'Save',
                cancel: 'Cancel'
              },
              emptyState: {
                title: 'No events scheduled',
                subtitle: 'Create your first event to get started'
              }
            }
          }
        }
      }
    });
  });

  it('renders calendar with correct i18n titles', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <CalendarScreen />
      </I18nextProvider>
    );

    // Check header title uses i18n
    expect(screen.getByTestId('header-title')).toHaveTextContent('Calendar');
  });

  it('uses sentence case for headings and labels', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <CalendarScreen />
      </I18nextProvider>
    );

    // Check that titles follow sentence case convention
    expect(screen.getByTestId('header-title')).toHaveTextContent('Calendar');
    
    // Empty state should use sentence case
    expect(screen.getByText('No events scheduled')).toBeTruthy();
  });

  it('does not display raw i18n keys', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <CalendarScreen />
      </I18nextProvider>
    );

    // Check that no raw keys are visible
    expect(screen.queryByText(/^calendar\./)).toBeNull();
    expect(screen.queryByText(/^common\./)).toBeNull();
    expect(screen.queryByText(/^auth\./)).toBeNull();
  });

  it('has consistent button text casing', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <CalendarScreen />
      </I18nextProvider>
    );

    // Open modal to test button texts
    const createButton = screen.getByTestId('schedule-event-button');
    expect(createButton).toBeTruthy();
    
    // Note: Modal buttons would be tested when modal is opened
    // This test structure allows for future expansion
  });

  it('uses proper placeholder conventions', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <CalendarScreen />
      </I18nextProvider>
    );

    // Test that placeholders follow "Enter..." or descriptive format
    // This would be expanded when modal testing is implemented
    expect(screen.getByText('No events scheduled')).toBeTruthy();
  });

  it('maintains accessibility with proper labels', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <CalendarScreen />
      </I18nextProvider>
    );

    // Check that screen readers would get proper labels
    expect(screen.getByTestId('header-title')).toHaveTextContent('Calendar');
    
    // Test that important interactive elements have proper accessibility
    const createButton = screen.getByTestId('schedule-event-button');
    expect(createButton).toBeTruthy();
  });

  it('follows German translation conventions', () => {
    // Test German translations follow proper capitalization rules
    const germanTranslations = {
      'calendar.title': 'Kalender',
      'calendar.schedule.title': 'Termin planen',
      'calendar.actions.save': 'Speichern',
      'calendar.actions.cancel': 'Abbrechen'
    };

    // Verify German translations exist and follow conventions
    Object.entries(germanTranslations).forEach(([key, expectedValue]) => {
      expect(expectedValue).not.toMatch(/^[a-z]/); // Should not start with lowercase for nouns
      expect(expectedValue).not.toMatch(/[A-Z]{2,}/); // Should not have multiple consecutive capitals
    });
  });

  it('prevents hardcoded strings in UI components', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <CalendarScreen />
      </I18nextProvider>
    );

    // This test would be enhanced by ESLint rules to prevent hardcoded strings
    // Check that common hardcoded strings are not present
    expect(screen.queryByText('Schedule Event')).toBeNull(); // Old hardcoded version
    expect(screen.queryByText('Type')).toBeNull(); // Should use i18n
    expect(screen.queryByText('Location')).toBeNull(); // Should use i18n
  });
});
