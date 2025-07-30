import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from 'react-native';

interface LoadingScreenProps {
  message?: string;
  isError?: boolean;
}

export function LoadingScreen({ message = 'Loading...', isError = false }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={isError ? '#FF3B30' : '#1A1A1A'} />
        <Text style={[styles.text, isError && styles.errorText]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  text: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
  },
  errorText: {
    color: '#FF3B30',
  },
});