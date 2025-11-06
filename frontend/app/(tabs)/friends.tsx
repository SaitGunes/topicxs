import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { useState, useEffect } from 'react';
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

  const renderFriend = ({ item }: { item: User }) => (
    <TouchableOpacity 
      style={styles.friendItem}
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
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('friendsTitle')}</Text>
      </View>

      {/* Search Section */}
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
        {searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            renderItem={renderUser}
            keyExtractor={(item) => item.id}
            style={styles.searchResults}
          />
        )}
      </View>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('friendsFriendRequests')}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{friendRequests.length}</Text>
            </View>
          </View>
          <FlatList
            data={friendRequests}
            renderItem={renderRequest}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Friends List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('friendsMyFriends')} ({friends.length})</Text>
        {friends.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>{t('friendsNoFriendsYet')}</Text>
            <Text style={styles.emptySubtext}>{t('friendsSearchAddFriends')}</Text>
          </View>
        ) : (
          <FlatList
            data={friends}
            renderItem={renderFriend}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>
    </View>
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
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
