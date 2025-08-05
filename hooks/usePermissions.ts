import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { SafePermissions } from '@/lib/permissions';

export interface PermissionStatus {
  notifications: boolean;
  camera: boolean;
  location: boolean;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    notifications: false,
    camera: false,
    location: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Check notification permissions without requesting them
  const checkNotificationPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const isGranted = await SafePermissions.checkNotificationPermissions();
      setPermissions(prev => ({ ...prev, notifications: isGranted }));
      return isGranted;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }, []);

  // Request notification permissions (should be called on user interaction)
  const requestNotificationPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const isGranted = await SafePermissions.requestNotificationPermissions();
      
      setPermissions(prev => ({ ...prev, notifications: isGranted }));
      
      if (isGranted) {
        console.log('Notification permissions granted');
      } else {
        console.log('Notification permissions denied');
      }
      
      return isGranted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      Alert.alert(
        'Permission Error',
        'Failed to request notification permissions. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check camera permissions without requesting them
  const checkCameraPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const isGranted = await SafePermissions.checkCameraPermissions();
      setPermissions(prev => ({ ...prev, camera: isGranted }));
      return isGranted;
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      return false;
    }
  }, []);

  // Request camera permissions (should be called on user interaction)
  const requestCameraPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const isGranted = await SafePermissions.requestCameraPermissions();
      
      setPermissions(prev => ({ ...prev, camera: isGranted }));
      
      if (isGranted) {
        console.log('Camera permissions granted');
      } else {
        console.log('Camera permissions denied');
        Alert.alert(
          'Camera Permission Required',
          'Camera access is needed for this feature. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
      }
      
      return isGranted;
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      Alert.alert(
        'Permission Error',
        'Failed to request camera permissions. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check location permissions (placeholder for future use)
  const checkLocationPermissions = useCallback(async (): Promise<boolean> => {
    try {
      // This would be implemented when expo-location is added
      // const { status } = await Location.getForegroundPermissionsAsync();
      // const isGranted = status === 'granted';
      const isGranted = false; // Placeholder
      setPermissions(prev => ({ ...prev, location: isGranted }));
      return isGranted;
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  }, []);

  // Request location permissions (placeholder for future use)
  const requestLocationPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // This would be implemented when expo-location is added
      // const { status } = await Location.requestForegroundPermissionsAsync();
      // const isGranted = status === 'granted';
      const isGranted = false; // Placeholder
      
      setPermissions(prev => ({ ...prev, location: isGranted }));
      
      if (isGranted) {
        console.log('Location permissions granted');
      } else {
        console.log('Location permissions denied');
        Alert.alert(
          'Location Permission Required',
          'Location access is needed for this feature. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
      }
      
      return isGranted;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      Alert.alert(
        'Permission Error',
        'Failed to request location permissions. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check all permissions at once
  const checkAllPermissions = useCallback(async (): Promise<PermissionStatus> => {
    try {
      const [notifications, camera, location] = await Promise.all([
        checkNotificationPermissions(),
        checkCameraPermissions(),
        checkLocationPermissions(),
      ]);

      const allPermissions = {
        notifications,
        camera,
        location,
      };

      setPermissions(allPermissions);
      return allPermissions;
    } catch (error) {
      console.error('Error checking all permissions:', error);
      return permissions;
    }
  }, [checkNotificationPermissions, checkCameraPermissions, checkLocationPermissions, permissions]);

  // Request specific permission with user interaction
  const requestPermission = useCallback(async (
    permissionType: keyof PermissionStatus,
    showAlert: boolean = true
  ): Promise<boolean> => {
    try {
      let granted = false;

      switch (permissionType) {
        case 'notifications':
          granted = await requestNotificationPermissions();
          break;
        case 'camera':
          granted = await requestCameraPermissions();
          break;
        case 'location':
          granted = await requestLocationPermissions();
          break;
        default:
          console.warn(`Unknown permission type: ${permissionType}`);
          return false;
      }

      if (showAlert && !granted) {
        Alert.alert(
          'Permission Required',
          `${permissionType.charAt(0).toUpperCase() + permissionType.slice(1)} permission is required for this feature.`,
          [{ text: 'OK' }]
        );
      }

      return granted;
    } catch (error) {
      console.error(`Error requesting ${permissionType} permission:`, error);
      return false;
    }
  }, [requestNotificationPermissions, requestCameraPermissions, requestLocationPermissions]);

  return {
    permissions,
    isLoading,
    checkNotificationPermissions,
    requestNotificationPermissions,
    checkCameraPermissions,
    requestCameraPermissions,
    checkLocationPermissions,
    requestLocationPermissions,
    checkAllPermissions,
    requestPermission,
  };
} 