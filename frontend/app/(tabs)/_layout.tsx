import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';

export default function TabsLayout() {
  const user = useAuthStore((state) => state.user);
  const friendRequestCount = useNotificationStore((state) => state.friendRequestCount);
  const unreadMessageCount = useNotificationStore((state) => state.unreadMessageCount);
  const loadFriendRequestCount = useNotificationStore((state) => state.loadFriendRequestCount);
  const loadUnreadMessageCount = useNotificationStore((state) => state.loadUnreadMessageCount);

  useEffect(() => {
    // Load counts on mount
    loadFriendRequestCount();
    loadUnreadMessageCount();

    // Refresh counts every 30 seconds
    const interval = setInterval(() => {
      loadFriendRequestCount();
      loadUnreadMessageCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
          tabBarBadge: friendRequestCount > 0 ? friendRequestCount : undefined,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
          tabBarBadge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      {user?.is_admin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="shield-checkmark" size={size} color={color} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}
