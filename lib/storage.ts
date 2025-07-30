import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A simple wrapper around AsyncStorage that provides a base API
 * for storing and retrieving data
 */

/**
 * Get an item from storage by key
 *
 * @param {string} key of the item to fetch
 * @returns {Promise<string | null>} value for the key as a string or null if not found
 */
export async function getItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn(`Failed to get key "${key}" from storage:`, error);
    return null;
  }
}

/**
 * Sets an item in storage by key
 *
 * @param {string} key of the item to store
 * @param {string} value of the item to store
 */
export async function setItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Failed to set key "${key}" in storage:`, error);
  }
}

/**
 * Removes a single item from storage by key
 *
 * @param {string} key of the item to remove
 */
export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove key "${key}" from storage:`, error);
  }
}

export const storage = {
  getItem,
  setItem,
  removeItem,
}; 