import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

// Configure how notifications should be displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and get the Expo Push Token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '97534a80-2fb3-4bbf-a17c-2fccf8f825ba', // Your Expo project ID
      });
      token = tokenData.data;
      console.log('Push token:', token);
    } catch (error) {
      // Silent fail - push notifications don't work in Expo Go
      // They will work in production build
      console.log('Push notifications not available (Expo Go limitation)');
      return null;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Send the push token to backend
 */
export async function sendPushTokenToBackend(token: string): Promise<boolean> {
  try {
    await api.post('/api/notifications/register', { token });
    console.log('Push token registered with backend');
    return true;
  } catch (error) {
    console.error('Failed to register push token with backend:', error);
    return false;
  }
}

/**
 * Update notification preferences on backend
 */
export async function updateNotificationPreferences(preferences: {
  friend_requests?: boolean;
  messages?: boolean;
  likes?: boolean;
  comments?: boolean;
}): Promise<boolean> {
  try {
    await api.put('/api/notifications/preferences', preferences);
    console.log('Notification preferences updated');
    return true;
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    return false;
  }
}

/**
 * Remove push token from backend (on logout)
 */
export async function removePushTokenFromBackend(): Promise<boolean> {
  try {
    await api.delete('/api/notifications/unregister');
    console.log('Push token removed from backend');
    return true;
  } catch (error) {
    console.error('Failed to remove push token from backend:', error);
    return false;
  }
}
