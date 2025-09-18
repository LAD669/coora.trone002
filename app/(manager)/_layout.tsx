import { Slot, Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthProvider';

export default function ManagerGuard() {
  const { session, isManager } = useAuth();
  
  // Show nothing while session is loading
  if (session === undefined) return null;
  
  // Redirect non-managers to app tabs
  if (!isManager) {
    return <Redirect href="/(app)/(tabs)/dashboard" />;
  }
  
  return <Slot />;
}
