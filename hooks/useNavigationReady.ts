import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFrameworkReady } from './useFrameworkReady';

export function useNavigationReady() {
  const router = useRouter();
  const { isAppReady, navigationRef } = useFrameworkReady();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Check if navigation is fully ready
  const checkNavigationReady = useCallback(() => {
    try {
      return router && navigationRef && navigationRef.isReady() && isAppReady;
    } catch (error) {
      console.warn('Navigation ready check failed:', error);
      return false;
    }
  }, [router, navigationRef, isAppReady]);

  // Update navigation ready state
  useEffect(() => {
    const isReady = checkNavigationReady();
    setIsNavigationReady(isReady);
  }, [checkNavigationReady]);

  // Safe navigation functions
  const safePush = useCallback((href: string | { pathname: string; params?: any }) => {
    if (!isNavigationReady) {
      console.warn('Navigation not ready, skipping push to:', href);
      return;
    }
    router.push(href);
  }, [router, isNavigationReady]);

  const safeReplace = useCallback((href: string) => {
    if (!isNavigationReady) {
      console.warn('Navigation not ready, skipping replace to:', href);
      return;
    }
    router.replace(href);
  }, [router, isNavigationReady]);

  const safeBack = useCallback(() => {
    if (!isNavigationReady) {
      console.warn('Navigation not ready, skipping back navigation');
      return;
    }
    router.back();
  }, [router, isNavigationReady]);

  return {
    isNavigationReady,
    safePush,
    safeReplace,
    safeBack,
    router, // Still expose router for direct access when needed
  };
}
