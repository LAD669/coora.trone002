import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { TouchableOpacity } from 'react-native';

interface LoadingScreenProps {
  message?: string;
  isError?: boolean;
  showRetry?: boolean;
  onRetry?: () => void;
}

const { width, height } = Dimensions.get('window');

export function LoadingScreen({ 
  message = "Loading...", 
  isError = false, 
  showRetry = false, 
  onRetry 
}: LoadingScreenProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start the rotation animation
    const startRotation = () => {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    };

    // Start the scale and opacity animations
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      startRotation();
    });
  }, [rotateAnim, scaleAnim, opacityAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* COORA Logo with rotating C */}
        <View style={styles.logoContainer}>
          <Animated.View
            style={[
              styles.logo,
              {
                transform: [
                  { rotate: spin },
                  { scale: scaleAnim },
                ],
                opacity: opacityAnim,
              },
            ]}
          >
            <Text style={styles.logoText}>C</Text>
          </Animated.View>
          <Animated.Text 
            style={[
              styles.brandText,
              {
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            OORA
          </Animated.Text>
        </View>

        {/* Loading Message */}
        <Animated.View
          style={[
            styles.messageContainer,
            {
              opacity: opacityAnim,
              transform: [{ translateY: opacityAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }) }],
            },
          ]}
        >
          <Text style={[
            styles.message,
            isError && styles.errorMessage
          ]}>
            {message}
          </Text>
        </Animated.View>

        {/* Retry Button */}
        {showRetry && onRetry && (
          <Animated.View
            style={[
              styles.retryContainer,
              {
                opacity: opacityAnim,
                transform: [{ translateY: opacityAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }) }],
              },
            ]}
          >
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </Animated.View>
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
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-Bold',
  },
  brandText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    letterSpacing: 2,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontFamily: 'Urbanist-Medium',
    lineHeight: 24,
  },
  errorMessage: {
    color: '#FF3B30',
  },
  retryContainer: {
    marginTop: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Urbanist-SemiBold',
  },
});