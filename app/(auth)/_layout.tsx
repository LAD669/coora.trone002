import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="login" 
        options={{
          title: 'Sign In',
          headerBackTitle: 'Back',
          headerBackTitleVisible: true,
        }}
      />
      <Stack.Screen 
        name="signup" 
        options={{
          title: 'Sign Up',
          headerBackTitle: 'Back',
          headerBackTitleVisible: true,
        }}
      />
    </Stack>
  );
} 