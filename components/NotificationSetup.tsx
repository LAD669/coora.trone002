import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { 
  checkNotificationPermissions, 
  requestNotificationPermissions, 
  getNotificationTokenSafely 
} from '@/lib/notifications';

interface NotificationSetupProps {
  onTokenReceived?: (token: string) => void;
}

export default function NotificationSetup({ onTokenReceived }: NotificationSetupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Check current permission status
  const checkPermissions = async () => {
    try {
      setIsLoading(true);
      const granted = await checkNotificationPermissions();
      setHasPermission(granted);
      
      if (granted) {
        Alert.alert('Permissions', 'Notification permissions are already granted!');
      } else {
        Alert.alert('Permissions', 'Notification permissions are not granted.');
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      Alert.alert('Error', 'Failed to check notification permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  // Request permissions with user interaction
  const requestPermissions = async () => {
    try {
      setIsLoading(true);
      const granted = await requestNotificationPermissions();
      setHasPermission(granted);
      
      if (granted) {
        Alert.alert('Success', 'Notification permissions granted!');
        // Now safe to get token
        await getTokenSafely();
      } else {
        Alert.alert('Permission Denied', 'Notification permissions were denied.');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get token safely (only after permissions are granted)
  const getTokenSafely = async () => {
    try {
      setIsLoading(true);
      const token = await getNotificationTokenSafely();
      
      if (token) {
        Alert.alert('Token Retrieved', `Notification token: ${token.substring(0, 20)}...`);
        onTokenReceived?.(token);
      } else {
        Alert.alert('No Token', 'Could not retrieve notification token. Check permissions.');
      }
    } catch (error) {
      console.error('Error getting token:', error);
      Alert.alert('Error', 'Failed to get notification token.');
    } finally {
      setIsLoading(false);
    }
  };

  // Complete setup flow
  const setupNotifications = async () => {
    try {
      setIsLoading(true);
      
      // Step 1: Check current permissions
      let granted = await checkNotificationPermissions();
      
      // Step 2: Request if not granted
      if (!granted) {
        granted = await requestNotificationPermissions();
      }
      
      // Step 3: Get token if permissions granted
      if (granted) {
        setHasPermission(true);
        const token = await getNotificationTokenSafely();
        if (token) {
          onTokenReceived?.(token);
        }
      } else {
        setHasPermission(false);
        Alert.alert('Setup Failed', 'Notification permissions are required for push notifications.');
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
      Alert.alert('Error', 'Failed to setup notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Setup</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Permission Status:</Text>
        <Text style={[
          styles.statusValue, 
          hasPermission === null ? styles.statusUnknown :
          hasPermission ? styles.statusGranted : styles.statusDenied
        ]}>
          {hasPermission === null ? 'Unknown' : 
           hasPermission ? 'Granted' : 'Denied'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={checkPermissions}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Checking...' : 'Check Permissions'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={requestPermissions}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Requesting...' : 'Request Permissions'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={setupNotifications}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            {isLoading ? 'Setting Up...' : 'Setup Notifications'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusUnknown: {
    color: '#999',
  },
  statusGranted: {
    color: '#34C759',
  },
  statusDenied: {
    color: '#FF3B30',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  primaryButtonText: {
    color: '#fff',
  },
}); 