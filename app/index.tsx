import { Redirect, useRootNavigationState } from "expo-router";
import { useAuth } from "@/contexts/AuthProvider";

export default function Index() {
  const { sessionLoaded, isManager } = useAuth();
  const nav = useRootNavigationState();
  
  // Wait until router is ready and session is loaded
  if (!sessionLoaded || !nav?.key) return null;
  
  return (
    <Redirect href={isManager ? "/(manager)/(tabs)/dashboard" : "/(app)/(tabs)/dashboard"} />
  );
}
