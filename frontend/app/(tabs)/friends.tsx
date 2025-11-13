import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useTranslation } from '../../store/languageStore';
import api from '../../utils/api';
import { useRouter } from 'expo-router';

interface User {
  id: string;
  username: string;
  full_name: string;
  profile_picture: string | null;
}

interface FriendRequest {
  id: string;
  from_user_id: string;
  from_username: string;
  from_user_picture: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

export default function FriendsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const loadFriendRequestCount = useNotificationStore((state) => state.loadFriendRequestCount);
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFriendRequests();
    loadFriends();
  }, []);

  const loadFriendRequests = async () => {
    try {
      const response = await api.get('/api/friends/requests');
      setFriendRequests(response.data);
    } catch (error) {
      console.error('Load requests error:', error);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await api.get('/api/friends');
      setFriends(response.data);
    } catch (error) {
      console.error('Load friends error:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/api/users?q=${searchQuery}`);
      // Filter out self and existing friends
      const filtered = response.data.filter((u: User) => 
        u.id !== user?.id && !friends.some(f => f.id === u.id)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      await api.post('/api/friends/request', {
        to_user_id: userId,
        message: null,
      });
      Alert.alert(t('success'), t('friendsFriendRequestSent'));
      setSearchResults(searchResults.filter(u => u.id !== userId));
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || t('friendsFailedSendRequest'));
    }
  };

  const handleRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      await api.post(`/api/friends/requests/${requestId}/action`, { action });
      Alert.alert(t('success'), action === 'accept' ? t('friendsFriendAdded') : t('friendsRequestRejected'));
      loadFriendRequests();
      loadFriends();
      loadFriendRequestCount();
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || t('friendsActionFailed'));
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      {item.profile_picture ? (
        <Image source={{ uri: item.profile_picture }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Ionicons name="person" size={24} color="#999" />
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.full_name}</Text>
        <Text style={styles.username}>@{item.username}</Text>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => sendFriendRequest(item.id)}
      >
        <Ionicons name="person-add" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestItem}>
      {item.from_user_picture ? (
        <Image source={{ uri: item.from_user_picture }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Ionicons name="person" size={24} color="#999" />
        </View>
      )}
      <View style={styles.requestInfo}>
        <Text style={styles.userName}>@{item.from_username}</Text>
        {item.message && <Text style={styles.requestMessage}>{item.message}</Text>}
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => handleRequest(item.id, 'accept')}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.rejectButton}
          onPress={() => handleRequest(item.id, 'reject')}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleMessage = async (friendId: string) => {
    try {
      // Get or create chat
      const response = await api.post('/api/chats', { user_id: friendId });
      router.push(`/chat/${response.data.id}`);
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || 'Failed to start chat');
    }
  };

  const renderFriend = ({ item }: { item: User }) => (
    <View style={styles.friendItem}>
      <TouchableOpacity 
        style={styles.friendTouchable}
        onPress={() => router.push(`/profile/${item.id}`)}
      >
        {item.profile_picture ? (
          <Image source={{ uri: item.profile_picture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={24} color="#999" />
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.full_name}</Text>
          <Text style={styles.username}>@{item.username}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.messageButton}
        onPress={() => handleMessage(item.id)}
      >
        <Ionicons name="chatbubble" size={20} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  // Combine all items into one FlatList data array
  type ListItem = 
    | { type: 'search' }
    | { type: 'searchResult'; data: User }
    | { type: 'requestHeader' }
    | { type: 'request'; data: FriendRequest }
    | { type: 'friendHeader' }
    | { type: 'friend'; data: User }
    | { type: 'empty' };

  const getListData = (): ListItem[] => {
    const items: ListItem[] = [];
    
    // Search section
    items.push({ type: 'search' });
    
    // Search results
    if (searchResults.length > 0) {
      searchResults.forEach(user => {
        items.push({ type: 'searchResult', data: user });
      });
    }
    
    // Friend requests
    if (friendRequests.length > 0) {
      items.push({ type: 'requestHeader' });
      friendRequests.forEach(request => {
        items.push({ type: 'request', data: request });
      });
    }
    
    // Friends list header
    items.push({ type: 'friendHeader' });
    
    // Friends
    if (friends.length === 0) {
      items.push({ type: 'empty' });
    } else {
      friends.forEach(friend => {
        items.push({ type: 'friend', data: friend });
      });
    }
    
    return items;
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    switch (item.type) {
      case 'search':
        return (
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('friendsSearchDrivers')}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchUsers}
                placeholderTextColor="#999"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      
      case 'searchResult':
        return (
          <View style={styles.userItem}>
            {item.data.profile_picture ? (
              <Image source={{ uri: item.data.profile_picture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={24} color="#999" />
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.data.full_name}</Text>
              <Text style={styles.username}>@{item.data.username}</Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => sendFriendRequest(item.data.id)}
            >
              <Ionicons name="person-add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        );
      
      case 'requestHeader':
        return (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('friendsFriendRequests')}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{friendRequests.length}</Text>
              </View>
            </View>
          </View>
        );
      
      case 'request':
        return (
          <View style={styles.requestItem}>
            {item.data.from_user_picture ? (
              <Image source={{ uri: item.data.from_user_picture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={24} color="#999" />
              </View>
            )}
            <View style={styles.requestInfo}>
              <Text style={styles.userName}>@{item.data.from_username}</Text>
              {item.data.message && <Text style={styles.requestMessage}>{item.data.message}</Text>}
            </View>
            <View style={styles.requestActions}>
              <TouchableOpacity 
                style={styles.acceptButton}
                onPress={() => handleRequest(item.data.id, 'accept')}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.rejectButton}
                onPress={() => handleRequest(item.data.id, 'reject')}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        );
      
      case 'friendHeader':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('friendsMyFriends')} ({friends.length})</Text>
          </View>
        );
      
      case 'empty':
        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>{t('friendsNoFriendsYet')}</Text>
            <Text style={styles.emptySubtext}>{t('friendsSearchAddFriends')}</Text>
          </View>
        );
      
      case 'friend':
        return (
          <View style={styles.friendItem}>
            <TouchableOpacity 
              style={styles.friendTouchable}
              onPress={() => router.push(`/profile/${item.data.id}`)}
            >
              {item.data.profile_picture ? (
                <Image source={{ uri: item.data.profile_picture }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={24} color="#999" />
                </View>
              )}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.data.full_name}</Text>
                <Text style={styles.username}>@{item.data.username}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.messageButton}
              onPress={() => handleMessage(item.data.id)}
            >
              <Ionicons name="chatbubble" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('friendsTitle')}</Text>
      </View>

      <FlatList
        data={getListData()}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={styles.flatList}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  searchSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  searchResults: {
    marginTop: 12,
    maxHeight: 200,
  },
  searchResultsContainer: {
    marginTop: 12,
  },
  listContent: {
    paddingBottom: 100,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  friendTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  requestInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  requestMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#34C759',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
});
