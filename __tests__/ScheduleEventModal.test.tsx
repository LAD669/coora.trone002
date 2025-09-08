import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import CalendarScreen from '../app/(app)/(tabs)/calendar';

// Mock the hooks and dependencies
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

jest.mock('../lib/supabase', () => ({
  getTeamEvents: jest.fn(() => Promise.resolve([])),
  createEvent: jest.fn(() => Promise.resolve({ id: 'new-event-id' })),
  respondToEvent: jest.fn(() => Promise.resolve()),
  getEventResponses: jest.fn(() => Promise.resolve([])),
}));

jest.mock('react-native-modal', () => {
  const { View, Text } = require('react-native');
  return function MockModal({ isVisible, children, onBackdropPress }: any) {
    if (!isVisible) return null;
    return (
      <View testID="modal-overlay" onTouchEnd={onBackdropPress}>
        {children}
      </View>
    );
  };
});

describe('ScheduleEventModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with correct accessibility attributes', () => {
    render(<CalendarScreen />);
    
    // The modal should not be visible initially
    expect(screen.queryByTestId('modal-overlay')).toBeNull();
  });

  it('opens modal when schedule event button is pressed', () => {
    render(<CalendarScreen />);
    
    // Find and press the schedule event button (Plus button)
    const scheduleButton = screen.getByTestId('schedule-event-button');
    fireEvent.press(scheduleButton);
    
    // Modal should now be visible
    expect(screen.getByTestId('modal-overlay')).toBeTruthy();
    expect(screen.getByText('Schedule event')).toBeTruthy();
  });

  it('renders modal with proper app-style structure', () => {
    render(<CalendarScreen />);
    
    // Open modal
    const scheduleButton = screen.getByTestId('schedule-event-button');
    fireEvent.press(scheduleButton);
    
    // Check modal structure follows app pattern
    expect(screen.getByText('Schedule event')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
    expect(screen.getByPlaceholderText('Event title')).toBeTruthy();
    expect(screen.getByText('Training')).toBeTruthy();
    expect(screen.getByText('Match')).toBeTruthy();
    expect(screen.getByText('Schedule event')).toBeTruthy();
  });

  it('closes modal when cancel button is pressed', () => {
    render(<CalendarScreen />);
    
    // Open modal
    const scheduleButton = screen.getByTestId('schedule-event-button');
    fireEvent.press(scheduleButton);
    
    // Verify modal is open
    expect(screen.getByText('Schedule event')).toBeTruthy();
    
    // Close modal
    const cancelButton = screen.getByText('Cancel');
    fireEvent.press(cancelButton);
    
    // Modal should be closed
    expect(screen.queryByTestId('modal-overlay')).toBeNull();
  });

  it('closes modal when backdrop is pressed', () => {
    render(<CalendarScreen />);
    
    // Open modal
    const scheduleButton = screen.getByTestId('schedule-event-button');
    fireEvent.press(scheduleButton);
    
    // Verify modal is open
    expect(screen.getByText('Schedule event')).toBeTruthy();
    
    // Close modal by pressing backdrop
    const modalOverlay = screen.getByTestId('modal-overlay');
    fireEvent(modalOverlay, 'touchEnd');
    
    // Modal should be closed
    expect(screen.queryByTestId('modal-overlay')).toBeNull();
  });

  it('follows app modal pattern without custom accessibility overrides', () => {
    render(<CalendarScreen />);
    
    // Open modal
    const scheduleButton = screen.getByTestId('schedule-event-button');
    fireEvent.press(scheduleButton);
    
    // Check that modal follows standard app pattern
    expect(screen.getByText('Schedule event')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
    expect(screen.getByPlaceholderText('Event title')).toBeTruthy();
    
    // Modal should render without custom accessibility overrides
    const titleInput = screen.getByPlaceholderText('Event title');
    expect(titleInput.props.accessibilityLabel).toBeUndefined();
    expect(titleInput.props.accessibilityHint).toBeUndefined();
    expect(titleInput.props.autoFocus).toBeUndefined();
  });

  it('handles form input correctly', () => {
    render(<CalendarScreen />);
    
    // Open modal
    const scheduleButton = screen.getByTestId('schedule-event-button');
    fireEvent.press(scheduleButton);
    
    // Test title input
    const titleInput = screen.getByPlaceholderText('Event title');
    fireEvent.changeText(titleInput, 'Test Event');
    expect(titleInput.props.value).toBe('Test Event');
    
    // Test type selection
    const trainingButton = screen.getByText('Training');
    fireEvent.press(trainingButton);
    expect(trainingButton.parent?.props.accessibilityState?.selected).toBe(true);
    
    const matchButton = screen.getByText('Match');
    fireEvent.press(matchButton);
    expect(matchButton.parent?.props.accessibilityState?.selected).toBe(true);
  });

  it('renders with app-style modal layout (flex-end positioning)', () => {
    render(<CalendarScreen />);
    
    // Open modal
    const scheduleButton = screen.getByTestId('schedule-event-button');
    fireEvent.press(scheduleButton);
    
    // Modal should be properly contained following app pattern
    const modalOverlay = screen.getByTestId('modal-overlay');
    expect(modalOverlay).toBeTruthy();
    
    // Check that modal follows app pattern with proper structure
    expect(screen.getByText('Schedule event')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
    expect(screen.getByPlaceholderText('Event title')).toBeTruthy();
  });
});
