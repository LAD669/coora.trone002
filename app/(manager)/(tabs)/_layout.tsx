import { Tabs } from 'expo-router';

export default function ManagerTabs() {
  return (
    <Tabs 
      screenOptions={{ headerShown: false }}
      initialRouteName="dashboard"
    >
      <Tabs.Screen name="index" options={{ title: "Index" }} />
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="infohub" options={{ title: "Info-Hub" }} />
      <Tabs.Screen name="calendar" options={{ title: "Kalender" }} />
      <Tabs.Screen name="playerboard" options={{ title: "Playerboard" }} />
    </Tabs>
  );
}
