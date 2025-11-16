import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { clearAllCache } from '../utils/clearCache';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  bio: string;
  profile_picture: string | null;
  referral_code?: string;
  invited_by?: string | null;
  referral_count?: number;
  friend_ids?: string[];
  is_admin?: boolean;
  user_type?: 'professional_driver' | 'driver' | 'non_driver';
  email_verified?: boolean;
  phone_number?: string | null;
  star_level?: {
    stars: number;
    level_name: string;
    total_referrals: number;
    next_star_at: number | null;
    remaining_referrals: number;
  };
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, full_name: string, referral_code?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  setUser: (user: User) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  loadToken: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
      if (token && userData) {
        set({ token, user: JSON.parse(userData), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Load token error:', error);
      set({ isLoading: false });
    }
  },

  login: async (username: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password,
      });

      const { access_token, user } = response.data;
      
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token: access_token });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },

  register: async (username: string, email: string, password: string, full_name: string, referral_code?: string, user_type?: string, phone_number?: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        username,
        email,
        password,
        full_name,
        referral_code: referral_code || undefined,
        user_type: user_type || 'driver',
        phone_number: phone_number || undefined,
      });

      const { access_token, user } = response.data;
      
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token: access_token });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  },

  logout: async () => {
    try {
      // Remove push token from backend
      try {
        const { removePushTokenFromBackend } = await import('../utils/notifications');
        await removePushTokenFromBackend();
      } catch (error) {
        console.error('Error removing push token:', error);
      }
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.clear(); // Clear all storage
      
      // Clear state
      set({ user: null, token: null, isLoading: false });
      
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  setUser: async (user: User) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch (error) {
      console.error('Set user error:', error);
    }
  },
}));
