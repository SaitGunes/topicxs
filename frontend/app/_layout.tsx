import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, sendPushTokenToBackend } from '../utils/notifications';

export default function RootLayout() {
  const router = useRouter();
  const loadToken = useAuthStore((state) => state.loadToken);
  const user = useAuthStore((state) => state.user);
  const setExpoPushToken = useNotificationStore((state) => state.setExpoPushToken);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    loadToken();
  }, []);

  // Setup push notifications when user is logged in
  useEffect(() => {
    if (user) {
      setupPushNotifications();
    }
  }, [user]);

  const setupPushNotifications = async () => {
    // Register for push notifications
    const token = await registerForPushNotificationsAsync();
    if (token) {
      setExpoPushToken(token);
      await sendPushTokenToBackend(token);
    }

    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      
      const data = response.notification.request.content.data;
      
      // Navigate based on notification type
      if (data.type === 'friend_request') {
        router.push('/(tabs)/friends');
      } else if (data.type === 'message') {
        if (data.chat_id) {
          router.push(`/chat/${data.chat_id}`);
        } else {
          router.push('/(tabs)/chatroom');
        }
      } else if (data.type === 'like' || data.type === 'comment') {
        if (data.post_id) {
          router.push(`/post/${data.post_id}`);
        }
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  };

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(auth)/register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="post/[id]" />
      <Stack.Screen name="profile/[id]" />
      <Stack.Screen name="chat/[id]" />
    </Stack>
  );
}
