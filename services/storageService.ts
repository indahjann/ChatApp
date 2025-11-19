// services/storageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthCredentials, User } from '../types';

const STORAGE_KEYS = {
  CREDENTIALS: '@ChatApp:credentials',
  USER_DATA: '@ChatApp:userData',
};

export const storageService = {
  // Save user credentials for auto-login
  saveUserCredentials: async (email: string, password: string): Promise<void> => {
    try {
      const credentials: AuthCredentials = { email, password };
      await AsyncStorage.setItem(
        STORAGE_KEYS.CREDENTIALS,
        JSON.stringify(credentials)
      );
    } catch (error) {
      console.error('Error saving credentials:', error);
      throw error;
    }
  },

  // Get saved credentials
  getUserCredentials: async (): Promise<AuthCredentials | null> => {
    try {
      const credentials = await AsyncStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      return credentials ? JSON.parse(credentials) : null;
    } catch (error) {
      console.error('Error getting credentials:', error);
      return null;
    }
  },

  // Remove credentials (for logout)
  removeUserCredentials: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
    } catch (error) {
      console.error('Error removing credentials:', error);
      throw error;
    }
  },

  // Save user data
  saveUserData: async (userData: User): Promise<void> => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(userData)
      );
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  },

  // Get user data
  getUserData: async (): Promise<User | null> => {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Remove user data
  removeUserData: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Error removing user data:', error);
      throw error;
    }
  },

  // Clear all data
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.CREDENTIALS,
        STORAGE_KEYS.USER_DATA,
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },
};