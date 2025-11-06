import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../store/languageStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  user_profile_picture?: string;
  content: string;
  created_at: string;
}

export default function ChatRoomScreen() {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);
  
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    checkChatStatus();
    connectSocket();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_chatroom');
        socketRef.current.disconnect();
      }
    };
  }, []);

  const loadMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chatroom/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data);
      setLoading(false);
    } catch (error: any) {
      console.error('Load messages error:', error);
      setLoading(false);
    }
  };

  const checkChatStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chatroom/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChatEnabled(response.data.enabled);
    } catch (error) {
      console.error('Check status error:', error);
    }
  };

  const connectSocket = () => {
    const socketUrl = API_URL?.replace('/api', '') || 'http://localhost:8001';
    console.log('Connecting to Socket.IO:', socketUrl);
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket.IO connected!');
      if (user) {
        socketRef.current?.emit('join_chatroom', {
          user_id: user.id,
          username: user.username,
        });
        console.log('Joined chatroom');
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socketRef.current.on('new_chatroom_message', (message: ChatMessage) => {
      console.log('New message received via Socket.IO:', message);
      setMessages((prev) => {
        const exists = prev.some(m => m.id === message.id);
        if (exists) {
          console.log('Message already exists, skipping');
          return prev;
        }
        console.log('Adding new message to state');
        return [...prev, message];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socketRef.current.on('chatroom_message_deleted', (data: { message_id: string }) => {
      setMessages((prev) => prev.filter(m => m.id !== data.message_id));
    });

    socketRef.current.on('chatroom_cleared', () => {
      setMessages([]);
    });

    socketRef.current.on('chatroom_status_changed', (data: { enabled: boolean }) => {
      setChatEnabled(data.enabled);
      if (!data.enabled) {
        Alert.alert(t('chatDisabled'), t('chatDisabledMessage'));
      }
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !chatEnabled) return;

    setSending(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/chatroom/messages`,
        null,
        {
          params: { content: newMessage.trim() },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || error.message);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    Alert.alert(t('deleteMessage'), t('confirmDeleteMessage'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/api/chatroom/messages/${messageId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          } catch (error: any) {
            Alert.alert(t('error'), error.response?.data?.detail || error.message);
          }
        },
      },
    ]);
  };

  const handleClearChat = () => {
    Alert.alert(t('clearChat'), t('confirmClearChat'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('clearChat'),
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/api/admin/chatroom/clear`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert(t('success'), 'Chat cleared');
          } catch (error: any) {
            Alert.alert(t('error'), error.response?.data?.detail || error.message);
          }
        },
      },
    ]);
  };

  const handleToggleChat = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/chatroom/toggle`,
        null,
        {
          params: { enabled: !chatEnabled },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setChatEnabled(response.data.enabled);
      Alert.alert(t('success'), response.data.message);
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || error.message);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return t('justNow');
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    
    return date.toLocaleDateString();
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.user_id === user?.id;
    const canDelete = isOwnMessage || user?.is_admin;
    
    return (
      <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer]}>
        {!isOwnMessage && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
        )}
        
        <View style={[styles.messageBubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}>
          {!isOwnMessage && <Text style={styles.username}>{item.username}</Text>}
          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>{item.content}</Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.timeText, isOwnMessage && styles.ownTimeText]}>{formatTime(item.created_at)}</Text>
            {canDelete && (
              <TouchableOpacity onPress={() => handleDeleteMessage(item.id)} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={12} color={isOwnMessage ? 'rgba(255,255,255,0.7)' : '#999'} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('chatRoom')}</Text>
          <Text style={styles.subtitle}>{chatEnabled ? t('everyoneCanSee') : t('chatDisabled')}</Text>
        </View>
        <View style={styles.headerRight}>
          {!chatEnabled && <View style={styles.disabledBadge}><Text style={styles.disabledBadgeText}>🔒</Text></View>}
          {user?.is_admin && (
            <TouchableOpacity onPress={handleToggleChat} style={styles.adminButton}>
              <Ionicons name={chatEnabled ? 'lock-open' : 'lock-closed'} size={20} color="#007AFF" />
            </TouchableOpacity>
          )}
          {user?.is_admin && (
            <TouchableOpacity onPress={handleClearChat} style={styles.adminButton}>
              <Ionicons name="trash" size={20} color="#F44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>{t('noChatMessages')}</Text>
            </View>
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, !chatEnabled && styles.inputDisabled]}
            placeholder={chatEnabled ? t('typeMessage') : t('chatDisabled')}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
            editable={chatEnabled}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || sending || !chatEnabled) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending || !chatEnabled}
          >
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  disabledBadge: { backgroundColor: '#FFF3CD', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  disabledBadgeText: { fontSize: 14 },
  adminButton: { padding: 4 },
  content: { flex: 1 },
  messagesList: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 16, textAlign: 'center' },
  messageContainer: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  ownMessageContainer: { justifyContent: 'flex-end' },
  otherMessageContainer: { justifyContent: 'flex-start' },
  avatarContainer: { marginRight: 8 },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  messageBubble: { maxWidth: '70%', padding: 12, borderRadius: 16 },
  ownBubble: { backgroundColor: '#007AFF', borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  username: { fontSize: 12, fontWeight: '600', color: '#007AFF', marginBottom: 4 },
  messageText: { fontSize: 16, color: '#333', lineHeight: 20 },
  ownMessageText: { color: '#fff' },
  messageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  timeText: { fontSize: 10, color: '#999' },
  ownTimeText: { color: 'rgba(255, 255, 255, 0.7)' },
  deleteButton: { marginLeft: 8 },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, maxHeight: 100, marginRight: 8 },
  inputDisabled: { backgroundColor: '#e0e0e0', color: '#999' },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#ccc' },
});
