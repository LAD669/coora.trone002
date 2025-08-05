import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { initializeNotifications } from '@/lib/notifications';

interface AppInitializerProps {
  children: React.ReactNode;
  onInitializationComplete?: () => void;
}

export default function AppInitializer({ children, onInitializationComplete }: AppInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');
        
        // Initialize notifications safely (this won't request permissions or tokens)
        const notificationsInitialized = await initializeNotifications();
        
        if (!notificationsInitialized) {
          console.warn('Notifications initialization failed, but app will continue');
          // Don't set error - app should continue without notifications
        }
        
        console.log('App initialization completed successfully');
        setIsInitialized(true);
        onInitializationComplete?.();
        
      } catch (error) {
        console.error('App initialization error:', error);
        setInitializationError(error instanceof Error ? error.message : 'Unknown initialization error');
        // Still set as initialized to prevent app from hanging
        setIsInitialized(true);
        onInitializationComplete?.();
      }
    };

    initializeApp();
  }, [onInitializationComplete]);

  // Show loading state during initialization
  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  // Show error state if initialization failed
  if (initializationError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Initialization Warning</Text>
        <Text style={styles.errorText}>
          Some features may not work properly: {initializationError}
        </Text>
        <Text style={styles.continueText}>Continuing with limited functionality...</Text>
        {children}
      </View>
    );
  }

  // App is ready
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  continueText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
}); 