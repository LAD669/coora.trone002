import { initializeNotifications } from '../lib/notifications';
import * as Device from 'expo-device';

// Mock expo modules
jest.mock('expo-device', () => ({
  isDevice: true,
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'mock-token' })),
}));

describe('Notifications Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips initialization on simulator for faster startup', async () => {
    // Mock simulator environment
    (Device.isDevice as jest.Mock).mockReturnValue(false);

    const result = await initializeNotifications();

    expect(result).toBeUndefined();
    // Should not call any notification APIs on simulator
  });

  it('initializes quickly on real device', async () => {
    // Mock real device environment
    (Device.isDevice as jest.Mock).mockReturnValue(true);

    const result = await initializeNotifications();

    expect(result).toBe('mock-token');
  });

  it('handles permission errors gracefully', async () => {
    const { getPermissionsAsync, requestPermissionsAsync } = require('expo-notifications');
    
    // Mock permission denied
    getPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    const result = await initializeNotifications();

    expect(result).toBeUndefined();
    // Should not throw error, just return undefined
  });

  it('handles token generation errors gracefully', async () => {
    const { getExpoPushTokenAsync } = require('expo-notifications');
    
    // Mock token generation failure
    getExpoPushTokenAsync.mockRejectedValueOnce(new Error('Token generation failed'));

    const result = await initializeNotifications();

    expect(result).toBeUndefined();
    // Should not throw error, just return undefined
  });

  it('completes initialization quickly', async () => {
    const startTime = Date.now();
    
    await initializeNotifications();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time (less than 1 second)
    expect(duration).toBeLessThan(1000);
  });
});
