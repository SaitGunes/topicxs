import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../store/languageStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Message {
  id: string;
  group_id: string;
  user_id: string;
  username: string;
  full_name: string;
  user_profile_picture?: string;
  content: string;
  created_at: string;
}

interface GroupChatProps {
  groupId: string;
}

export default function GroupChat({ groupId }: GroupChatProps) {
  const { t, language } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);

  const getDateLocale = () => {
    switch (language) {
      case 'tr': return tr;
      case 'es': return es;
      default: return undefined;
    }
  };

  useEffect(() => {
    loadMessages();
    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_group_chat', { group_id: groupId });
        socketRef.current.disconnect();
      }
    };
  }, [groupId]);

  const connectSocket = () => {
    const socketUrl = API_URL || 'http://localhost:8001';
    console.log('Connecting to Socket.IO for group:', socketUrl);
    
    try {
      socketRef.current = io(socketUrl, {
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000,
        forceNew: true,
      });

      socketRef.current.on('connect', () => {
        console.log('Socket.IO connected for group chat');
        socketRef.current?.emit('join_group_chat', {
          group_id: groupId,
          user_id: user?.id,
          username: user?.username,
        });
      });

      socketRef.current.on('new_group_message', (message: Message) => {
        console.log('New group message received:', message);
        if (message.group_id === groupId) {
          setMessages(prev => [...prev, message]);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      });

      socketRef.current.on('delete_group_message', (data: { message_id: string }) => {
        console.log('Message deleted:', data.message_id);
        setMessages(prev => prev.filter(m => m.id !== data.message_id));
      });

      socketRef.current.on('connect_error', (error) => {
        console.log('Real-time connection not available, using manual refresh');
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket.IO disconnected from group chat');
      });
    } catch (error) {
      console.log('Real-time updates not available for group chat');
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/groups/${groupId}/messages`);
      setMessages(response.data);
    } catch (error: any) {
      if (error.response?.status === 403) {
        Alert.alert('Error', 'You are not a member of this group');
      } else {
        console.error('Failed to load messages:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const formData = new URLSearchParams();
      formData.append('content', messageText);

      await api.post(`/api/groups/${groupId}/messages`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      // Message will be added via Socket.IO
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error: any) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Failed to send message');
      setNewMessage(messageText); // Restore message
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.user_id === user?.id;

    return (
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
        {!isOwnMessage && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.full_name?.charAt(0).toUpperCase() || item.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
        )}
        
        <View style={[styles.messageBubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}>
          {!isOwnMessage && <Text style={styles.senderName}>{item.full_name || item.username}</Text>}
          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.timestamp, isOwnMessage && styles.ownTimestamp]}>
            {formatDistanceToNow(new Date(item.created_at), { 
              addSuffix: true, 
              locale: getDateLocale() 
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>{t('noMessages') || 'No messages yet'}</Text>
            <Text style={styles.emptySubtext}>{t('startConversation') || 'Start the conversation!'}</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={t('typeMessage') || 'Type a message...'}
          value={newMessage}
          onChangeText={setNewMessage}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity 
          style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
