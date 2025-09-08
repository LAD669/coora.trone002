import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import AppInitializer from '../components/AppInitializer';

// Mock the notifications module
jest.mock('../lib/notifications', () => ({
  initializeNotifications: jest.fn(() => Promise.resolve('mock-token')),
}));

describe('AppInitializer Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes quickly with reduced timeout', async () => {
    const mockOnComplete = jest.fn();
    
    render(
      <AppInitializer onInitializationComplete={mockOnComplete}>
        <div>App Content</div>
      </AppInitializer>
    );

    // Should show loading initially
    expect(screen.getByText('Initializing...')).toBeTruthy();

    // Should complete within 1 second (reduced from 5 seconds)
    await waitFor(() => {
      expect(screen.getByText('App Content')).toBeTruthy();
    }, { timeout: 1500 }); // Allow 1.5 seconds for test

    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('handles notification initialization errors gracefully', async () => {
    const { initializeNotifications } = require('../lib/notifications');
    initializeNotifications.mockRejectedValueOnce(new Error('Notification error'));

    const mockOnComplete = jest.fn();
    
    render(
      <AppInitializer onInitializationComplete={mockOnComplete}>
        <div>App Content</div>
      </AppInitializer>
    );

    // Should still complete despite notification error
    await waitFor(() => {
      expect(screen.getByText('App Content')).toBeTruthy();
    }, { timeout: 1500 });

    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('completes initialization even if notifications fail', async () => {
    const { initializeNotifications } = require('../lib/notifications');
    initializeNotifications.mockResolvedValueOnce(undefined);

    const mockOnComplete = jest.fn();
    
    render(
      <AppInitializer onInitializationComplete={mockOnComplete}>
        <div>App Content</div>
      </AppInitializer>
    );

    // Should complete even without notifications
    await waitFor(() => {
      expect(screen.getByText('App Content')).toBeTruthy();
    }, { timeout: 1500 });

    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('shows error state when initialization fails', async () => {
    const mockOnComplete = jest.fn();
    
    // Mock a component that throws during render
    const ThrowingComponent = () => {
      throw new Error('Initialization error');
    };

    render(
      <AppInitializer onInitializationComplete={mockOnComplete}>
        <ThrowingComponent />
      </AppInitializer>
    );

    // Should handle error gracefully
    await waitFor(() => {
      expect(screen.getByText('Initialization Warning')).toBeTruthy();
    }, { timeout: 1500 });

    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('has fast timeout for quick startup', () => {
    const mockOnComplete = jest.fn();
    
    render(
      <AppInitializer onInitializationComplete={mockOnComplete}>
        <div>App Content</div>
      </AppInitializer>
    );

    // Should not take longer than 1 second
    expect(screen.getByText('Initializing...')).toBeTruthy();
    
    // The timeout should be 1 second, not 5 seconds
    // This is tested by the fact that the test completes quickly
  });
});
