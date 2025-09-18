import { Slot, Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthProvider';

export default function ManagerGuard() {
  const { session, isManager, sessionLoaded } = useAuth();
  
  // Don't render until session is loaded to prevent flicker
  if (!sessionLoaded) return null;
  
  // Fallback: if role is unknown, redirect to app tabs
  if (session === null || !session?.user) {
    return <Redirect href="/(app)/(tabs)/dashboard" />;
  }
  
  // Redirect non-managers to app tabs
  if (!isManager) {
    console.log('Non-manager user attempting to access manager section, redirecting to app dashboard');
    return <Redirect href="/(app)/(tabs)/dashboard" />;
  }
  
  return <Slot />;
}
