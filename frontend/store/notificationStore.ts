import { create } from 'zustand';
import api from '../utils/api';

interface NotificationPreferences {
  friend_requests: boolean;
  messages: boolean;
  likes: boolean;
  comments: boolean;
}

interface NotificationState {
  friendRequestCount: number;
  unreadMessageCount: number;
  expoPushToken: string | null;
  preferences: NotificationPreferences;
  
  loadFriendRequestCount: () => Promise<void>;
  loadUnreadMessageCount: () => Promise<void>;
  resetFriendRequestCount: () => void;
  resetUnreadMessageCount: () => void;
  decrementFriendRequestCount: () => void;
  setExpoPushToken: (token: string | null) => void;
  setPreferences: (prefs: NotificationPreferences) => void;
  loadPreferences: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  friendRequestCount: 0,
  unreadMessageCount: 0,
  expoPushToken: null,
  preferences: {
    friend_requests: true,
    messages: true,
    likes: true,
    comments: true,
  },

  loadFriendRequestCount: async () => {
    try {
      const response = await api.get('/api/friends/requests');
      const pendingRequests = response.data.filter((req: any) => req.status === 'pending');
      set({ friendRequestCount: pendingRequests.length });
    } catch (error) {
      console.error('Load friend requests count error:', error);
    }
  },

  loadUnreadMessageCount: async () => {
    try {
      const response = await api.get('/api/chats');
      // For now, we'll just count total chats
      // In future, we can add unread_count to each chat
      set({ unreadMessageCount: response.data.length > 0 ? response.data.length : 0 });
    } catch (error) {
      console.error('Load unread messages count error:', error);
    }
  },

  resetFriendRequestCount: () => set({ friendRequestCount: 0 }),
  resetUnreadMessageCount: () => set({ unreadMessageCount: 0 }),
  
  decrementFriendRequestCount: () => {
    set((state) => ({
      friendRequestCount: Math.max(0, state.friendRequestCount - 1),
    }));
  },
  
  setExpoPushToken: (token: string | null) => {
    set({ expoPushToken: token });
  },
  
  setPreferences: (prefs: NotificationPreferences) => {
    set({ preferences: prefs });
  },
  
  loadPreferences: async () => {
    try {
      const response = await api.get('/api/notifications/preferences');
      set({ preferences: response.data });
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  },
}));
