import { Linking } from 'react-native';
import { useAuth } from '@/contexts/AuthProvider';
import { useRouter } from 'expo-router';

/**
 * Deep linking utility for role-based routing
 */
export class DeepLinkHandler {
  private router: any;
  private auth: any;

  constructor(router: any, auth: any) {
    this.router = router;
    this.auth = auth;
  }

  /**
   * Handle incoming deep links with role-based routing
   */
  async handleDeepLink(url: string) {
    try {
      console.log('Deep link received:', url);
      
      // Parse the URL
      const parsedUrl = this.parseDeepLink(url);
      if (!parsedUrl) return;

      const { path, params } = parsedUrl;

      // Wait for session to be loaded
      if (!this.auth.sessionLoaded) {
        console.log('Session not loaded yet, queuing deep link');
        // Queue the deep link for later processing
        setTimeout(() => this.handleDeepLink(url), 1000);
        return;
      }

      // Handle manager-specific deep links
      if (path.startsWith('manager/')) {
        if (!this.auth.isManager) {
          console.log('Non-manager user attempting to access manager deep link, redirecting to app');
          this.router.replace('/(app)/(tabs)/dashboard');
          return;
        }

        // Route to manager section
        const managerPath = path.replace('manager/', '');
        this.routeToManagerSection(managerPath, params);
        return;
      }

      // Handle regular app deep links
      if (this.auth.isManager) {
        // Allow managers to access shared screens (settings, notifications, EditProfileScreen)
        const sharedScreens = ['settings', 'notifications', 'EditProfileScreen'];
        if (sharedScreens.includes(path)) {
          console.log('Manager user accessing shared screen:', path);
          this.routeToAppSection(path, params);
          return;
        }
        
        console.log('Manager user accessing app deep link, redirecting to manager section');
        this.router.replace('/(manager)/(tabs)/dashboard');
        return;
      }

      // Route to regular app section
      this.routeToAppSection(path, params);

    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  }

  /**
   * Parse deep link URL
   */
  private parseDeepLink(url: string) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.replace('/', '');
      const params: Record<string, string> = {};
      
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      return { path, params };
    } catch (error) {
      console.error('Error parsing deep link:', error);
      return null;
    }
  }

  /**
   * Route to manager section
   */
  private routeToManagerSection(path: string, params: Record<string, string>) {
    const managerRoutes: Record<string, string> = {
      'dashboard': '/(manager)/(tabs)/dashboard',
      'infohub': '/(manager)/(tabs)/infohub',
      'calendar': '/(manager)/(tabs)/calendar',
      'playerboard': '/(manager)/(tabs)/playerboard',
    };

    const route = managerRoutes[path] || '/(manager)/(tabs)/dashboard';
    
    if (Object.keys(params).length > 0) {
      this.router.push({ pathname: route, params });
    } else {
      this.router.push(route);
    }
  }

  /**
   * Route to app section
   */
  private routeToAppSection(path: string, params: Record<string, string>) {
    const appRoutes: Record<string, string> = {
      'dashboard': '/(app)/(tabs)/dashboard',
      'infohub': '/(app)/(tabs)/infohub',
      'calendar': '/(app)/(tabs)/calendar',
      'playerboard': '/(app)/(tabs)/playerboard',
    };

    const route = appRoutes[path] || '/(app)/(tabs)/dashboard';
    
    if (Object.keys(params).length > 0) {
      this.router.push({ pathname: route, params });
    } else {
      this.router.push(route);
    }
  }
}

/**
 * Hook to use deep linking with role-based routing
 */
export function useDeepLinking() {
  const router = useRouter();
  const auth = useAuth();

  const handleDeepLink = async (url: string) => {
    const handler = new DeepLinkHandler(router, auth);
    await handler.handleDeepLink(url);
  };

  return { handleDeepLink };
}

/**
 * Generate deep link URL for sharing
 */
export function generateDeepLink(path: string, params?: Record<string, string>) {
  const baseUrl = 'coora://';
  let url = `${baseUrl}${path}`;
  
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
}

/**
 * Example deep link URLs:
 * - coora://manager/dashboard
 * - coora://manager/infohub
 * - coora://manager/calendar
 * - coora://manager/playerboard
 * - coora://dashboard
 * - coora://infohub
 * - coora://calendar
 * - coora://playerboard
 */
