import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigationContainerRef } from 'expo-router';

export function useFrameworkReady() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isNavigationMounted, setIsNavigationMounted] = useState(false);
  const navigationRef = useNavigationContainerRef();
  const readyCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const readyCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Enhanced navigation ready check with safety guards
  const checkNavigationReady = useCallback(() => {
    try {
      if (navigationRef.isReady()) {
        console.log('Navigation container is ready');
        setIsAppReady(true);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Navigation ready check failed:', error);
      return false;
    }
  }, [navigationRef]);

  // Handle navigation container mount
  const handleNavigationMount = useCallback(() => {
    console.log('Navigation container mounted');
    setIsNavigationMounted(true);
    
    // Check immediately after mount
    if (checkNavigationReady()) {
      return;
    }

    // Set up interval to check periodically until ready
    readyCheckInterval.current = setInterval(() => {
      if (checkNavigationReady()) {
        if (readyCheckInterval.current) {
          clearInterval(readyCheckInterval.current);
          readyCheckInterval.current = null;
        }
      }
    }, 100);

    // Set a timeout to prevent infinite checking
    readyCheckTimeout.current = setTimeout(() => {
      console.warn('Navigation ready check timeout, forcing ready state');
      setIsAppReady(true);
      if (readyCheckInterval.current) {
        clearInterval(readyCheckInterval.current);
        readyCheckInterval.current = null;
      }
    }, 15000); // 15 second timeout - increased for safety
  }, [checkNavigationReady]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (readyCheckInterval.current) {
      clearInterval(readyCheckInterval.current);
      readyCheckInterval.current = null;
    }
    if (readyCheckTimeout.current) {
      clearTimeout(readyCheckTimeout.current);
      readyCheckTimeout.current = null;
    }
  }, []);

  // Set up navigation mount listener
  useEffect(() => {
    const handleMount = () => handleNavigationMount();
    
    // Check if already mounted
    if (navigationRef.isReady()) {
      handleMount();
    } else {
      // Listen for mount event
      const checkMount = () => {
        if (navigationRef.isReady()) {
          handleMount();
        } else {
          // Retry after a short delay
          setTimeout(checkMount, 50);
        }
      };
      checkMount();
    }

    return cleanup;
  }, [handleNavigationMount, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isAppReady,
    isNavigationMounted,
    navigationRef,
  };
}
