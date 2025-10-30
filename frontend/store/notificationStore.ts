import { create } from 'zustand';
import api from '../utils/api';

interface NotificationState {
  friendRequestCount: number;
  unreadMessageCount: number;
  loadFriendRequestCount: () => Promise<void>;
  loadUnreadMessageCount: () => Promise<void>;
  resetFriendRequestCount: () => void;
  resetUnreadMessageCount: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  friendRequestCount: 0,
  unreadMessageCount: 0,

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
}));
