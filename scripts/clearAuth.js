#!/usr/bin/env node

/**
 * Script to clear all authentication data
 * Run this if you're having authentication issues
 */

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function clearAuthData() {
  try {
    console.log('🧹 Clearing authentication data...');
    
    // Clear all auth-related keys
    const keysToRemove = [
      'supabase.auth.token',
      'supabase.auth.refreshToken',
      'stored_sessions',
      'expo.auth.session',
      'expo.auth.refreshToken'
    ];
    
    for (const key of keysToRemove) {
      try {
        await AsyncStorage.removeItem(key);
        console.log(`✅ Removed: ${key}`);
      } catch (error) {
        console.log(`⚠️  Could not remove ${key}:`, error.message);
      }
    }
    
    console.log('🎉 Authentication data cleared successfully!');
    console.log('📱 You can now restart your app and log in again.');
    
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
  }
}

clearAuthData();
