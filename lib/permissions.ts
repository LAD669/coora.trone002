import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';

// Safe permission checking utilities
export class SafePermissions {
  // Check if a module is available before using it
  static isModuleAvailable(module: any): boolean {
    try {
      return module !== null && module !== undefined;
    } catch {
      return false;
    }
  }

  // Safe notification permission check
  static async checkNotificationPermissions(): Promise<boolean> {
    try {
      if (!this.isModuleAvailable(Notifications)) {
        console.warn('Notifications module not available');
        return false;
      }

      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.warn('Error checking notification permissions:', error);
      return false;
    }
  }

  // Safe camera permission check
  static async checkCameraPermissions(): Promise<boolean> {
    try {
      if (!this.isModuleAvailable(Camera)) {
        console.warn('Camera module not available');
        return false;
      }

      const { status } = await Camera.getCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.warn('Error checking camera permissions:', error);
      return false;
    }
  }

  // Safe permission request for notifications
  static async requestNotificationPermissions(): Promise<boolean> {
    try {
      if (!this.isModuleAvailable(Notifications)) {
        console.warn('Notifications module not available');
        return false;
      }

      // Set up notification channel for Android before requesting permissions
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        } catch (channelError) {
          console.warn('Failed to setup notification channel:', channelError);
          // Continue anyway
        }
      }

      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.warn('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Safe permission request for camera
  static async requestCameraPermissions(): Promise<boolean> {
    try {
      if (!this.isModuleAvailable(Camera)) {
        console.warn('Camera module not available');
        return false;
      }

      const { status } = await Camera.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.warn('Error requesting camera permissions:', error);
      return false;
    }
  }

  // Check all permissions safely
  static async checkAllPermissions(): Promise<{
    notifications: boolean;
    camera: boolean;
  }> {
    try {
      const [notifications, camera] = await Promise.allSettled([
        this.checkNotificationPermissions(),
        this.checkCameraPermissions(),
      ]);

      return {
        notifications: notifications.status === 'fulfilled' ? notifications.value : false,
        camera: camera.status === 'fulfilled' ? camera.value : false,
      };
    } catch (error) {
      console.warn('Error checking all permissions:', error);
      return {
        notifications: false,
        camera: false,
      };
    }
  }
} 