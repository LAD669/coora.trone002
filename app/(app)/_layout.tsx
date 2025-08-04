import React from 'react';
import { Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

function AppContent() {
  const { session, isLoading } = useSession();

  // Show loading state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Redirect to auth login if no session
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // Render Stack with all screens when session exists
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false,
          gestureEnabled: true 
        }} 
      />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="EditProfileScreen" />
      <Stack.Screen name="live-ticker" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

function AppLayoutWithAuth() {
  return (
    <AuthProvider>
      <AppContent />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

export default function AppLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AppLayoutWithAuth />
      </LanguageProvider>
    </SafeAreaProvider>
  );
} 