import { storage } from './storage';
import { supabase } from './supabaseClient';

/**
 * Clears all stored authentication data
 * Useful when dealing with corrupted or invalid tokens
 */
export async function clearAllAuthData(): Promise<void> {
  try {
    console.log('Clearing all authentication data...');
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear stored tokens
    await storage.removeItem('supabase.auth.token');
    await storage.removeItem('supabase.auth.refreshToken');
    
    // Clear any other stored session data
    await storage.removeItem('stored_sessions');
    
    console.log('Authentication data cleared successfully');
  } catch (error) {
    console.error('Error clearing authentication data:', error);
    throw error;
  }
}
