import React from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native';

interface LoadingScreenProps {
  message?: string;
  isError?: boolean;
  showRetry?: boolean;
  onRetry?: () => void;
}

export function LoadingScreen({ 
  message = 'Loading...', 
  isError = false, 
  showRetry = false,
  onRetry 
}: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={isError ? '#FF3B30' : '#1A1A1A'} />
        <Text style={[styles.text, isError && styles.errorText]}>{message}</Text>
        
        {showRetry && onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
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
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#FF3B30',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Urbanist-SemiBold',
  },
});