import { Redirect, useRootNavigationState } from "expo-router";
import { useAuth } from "@/contexts/AuthProvider";

export default function Index() {
  const { sessionLoaded, isManager } = useAuth();
  const nav = useRootNavigationState();
  
  // Debug logging
  console.log('Index: sessionLoaded =', sessionLoaded, 'nav?.key =', !!nav?.key, 'isManager =', isManager);
  
  // Wait until session is loaded (router readiness is optional for initial redirect)
  if (!sessionLoaded) return null;
  
  return (
    <Redirect href={isManager ? "/(manager)/(tabs)/dashboard" : "/(app)/(tabs)/dashboard"} />
  );
}
