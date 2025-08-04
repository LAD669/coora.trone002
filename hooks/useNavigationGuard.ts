import { useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';

export function useNavigationGuard(isAppReady: boolean) {
  const router = useRouter();
  const pendingNavigations = useRef<Array<{ type: 'push' | 'replace' | 'back'; route?: string }>>([]);

  // Safe navigation functions that only work when app is ready
  const safePush = useCallback((route: string) => {
    if (isAppReady) {
      console.log('App ready, pushing to:', route);
      router.push(route as any);
    } else {
      console.log('App not ready, storing push navigation:', route);
      pendingNavigations.current.push({ type: 'push', route });
    }
  }, [isAppReady, router]);

  const safeReplace = useCallback((route: string) => {
    if (isAppReady) {
      console.log('App ready, replacing with:', route);
      router.replace(route as any);
    } else {
      console.log('App not ready, storing replace navigation:', route);
      pendingNavigations.current.push({ type: 'replace', route });
    }
  }, [isAppReady, router]);

  const safeBack = useCallback(() => {
    if (isAppReady) {
      console.log('App ready, going back');
      router.back();
    } else {
      console.log('App not ready, storing back navigation');
      pendingNavigations.current.push({ type: 'back' });
    }
  }, [isAppReady, router]);

  // Execute pending navigations when app becomes ready
  const executePendingNavigations = useCallback(() => {
    if (isAppReady && pendingNavigations.current.length > 0) {
      console.log('Executing pending navigations:', pendingNavigations.current.length);
      
      // Execute the most recent navigation
      const lastNavigation = pendingNavigations.current[pendingNavigations.current.length - 1];
      
      switch (lastNavigation.type) {
        case 'push':
          if (lastNavigation.route) {
            router.push(lastNavigation.route as any);
          }
          break;
        case 'replace':
          if (lastNavigation.route) {
            router.replace(lastNavigation.route as any);
          }
          break;
        case 'back':
          router.back();
          break;
      }
      
      // Clear pending navigations
      pendingNavigations.current = [];
    }
  }, [isAppReady, router]);

  // Execute pending navigations when app becomes ready
  if (isAppReady && pendingNavigations.current.length > 0) {
    executePendingNavigations();
  }

  return {
    safePush,
    safeReplace,
    safeBack,
    executePendingNavigations,
    hasPendingNavigations: pendingNavigations.current.length > 0,
  };
} 