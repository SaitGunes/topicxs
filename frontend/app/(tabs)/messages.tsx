import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Chat {
  id: string;
  name: string;
  is_group: boolean;
  members: string[];
  last_message: string | null;
  last_message_time: string | null;
}

export default function MessagesScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/chats');
      setChats(response.data);
    } catch (error) {
      console.error('Load chats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChat = ({ item }: { item: Chat }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View style={styles.chatAvatar}>
        <Ionicons 
          name={item.is_group ? "people" : "person"} 
          size={28} 
          color="#007AFF" 
        />
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{item.name}</Text>
        {item.last_message && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message}
          </Text>
        )}
      </View>
      {item.last_message_time && (
        <Text style={styles.timestamp}>
          {formatDistanceToNow(new Date(item.last_message_time), { locale: tr })}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mesajlar</Text>
        <TouchableOpacity onPress={() => router.push('/new-chat')}>
          <Ionicons name="create-outline" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={chats}
        renderItem={renderChat}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Henüz mesaj yok</Text>
            <Text style={styles.emptySubtext}>Sohbete başlayın!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chatAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
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
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
});
