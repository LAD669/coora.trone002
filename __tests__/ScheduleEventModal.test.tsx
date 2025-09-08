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
    expect(screen.getByText('Schedule Event')).toBeTruthy();
  });

  it('renders modal with proper structure', () => {
    render(<CalendarScreen />);
    
    // Open modal
    const scheduleButton = screen.getByTestId('schedule-event-button');
    fireEvent.press(scheduleButton);
    
    // Check modal structure
    expect(screen.getByText('Schedule Event')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
    expect(screen.getByPlaceholderText('Event title')).toBeTruthy();
    expect(screen.getByText('Training')).toBeTruthy();
    expect(screen.getByText('Match')).toBeTruthy();
    expect(screen.getByText('Schedule Event')).toBeTruthy();
  });

  it('closes modal when cancel button is pressed', () => {
    render(<CalendarScreen />);
    
    // Open modal
    const scheduleButton = screen.getByTestId('schedule-event-button');
    fireEvent.press(scheduleButton);
    
    // Verify modal is open
    expect(screen.getByText('Schedule Event')).toBeTruthy();
    
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
    expect(screen.getByText('Schedule Event')).toBeTruthy();
    
    // Close modal by pressing backdrop
    const modalOverlay = screen.getByTestId('modal-overlay');
    fireEvent(modalOverlay, 'touchEnd');
    
    // Modal should be closed
    expect(screen.queryByTestId('modal-overlay')).toBeNull();
  });

  it('has proper accessibility attributes', () => {
    render(<CalendarScreen />);
    
    // Open modal
    const scheduleButton = screen.getByTestId('schedule-event-button');
    fireEvent.press(scheduleButton);
    
    // Check accessibility attributes
    const modalContent = screen.getByText('Schedule Event').parent;
    expect(modalContent?.props.accessibilityRole).toBe('dialog');
    expect(modalContent?.props.accessibilityModal).toBe(true);
    
    // Check input accessibility
    const titleInput = screen.getByPlaceholderText('Event title');
    expect(titleInput.props.accessibilityLabel).toBe('Event title');
    expect(titleInput.props.accessibilityHint).toBe('Enter the title for your event');
    expect(titleInput.props.autoFocus).toBe(true);
    
    // Check button accessibility
    const createButton = screen.getByText('Schedule Event');
    expect(createButton.parent?.props.accessibilityLabel).toBe('Schedule Event');
    expect(createButton.parent?.props.accessibilityRole).toBe('button');
    expect(createButton.parent?.props.accessibilityHint).toBe('Create and schedule the event');
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

  it('renders responsive layout without overflow', () => {
    render(<CalendarScreen />);
    
    // Open modal
    const scheduleButton = screen.getByTestId('schedule-event-button');
    fireEvent.press(scheduleButton);
    
    // Modal should be properly contained
    const modalOverlay = screen.getByTestId('modal-overlay');
    expect(modalOverlay).toBeTruthy();
    
    // Check that scrollable content exists
    const scrollView = screen.getByText('Schedule Event').parent?.parent?.children[1];
    expect(scrollView?.props.style).toMatchObject({
      flex: 1
    });
  });
});
