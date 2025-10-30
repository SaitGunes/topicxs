import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import { useRouter, useLocalSearchParams } from 'expo-router';

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  bio: string;
  profile_picture: string | null;
  created_at: string;
}

interface Post {
  id: string;
  user_id: string;
  username: string;
  user_profile_picture: string | null;
  content: string;
  image: string | null;
  likes: string[];
  dislikes: string[];
  comments_count: number;
  created_at: string;
}

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useAuthStore((state) => state.user);
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserProfile();
    loadUserPosts();
  }, [id]);

  const loadUserProfile = async () => {
    try {
      const response = await api.get(`/api/users/${id}`);
      setUser(response.data);
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const loadUserPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/posts/user/${id}`);
      setPosts(response.data);
    } catch (error) {
      console.error('Load posts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!user) return;
    
    try {
      const response = await api.post('/api/chats', {
        name: user.full_name,
        is_group: false,
        members: [user.id],
      });
      router.push(`/chat/${response.data.id}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to start chat');
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await api.post(`/api/posts/${postId}/vote`, {
        vote_type: 'like',
      });
      
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return response.data;
        }
        return post;
      }));
    } catch (error: any) {
      if (error.response?.status === 404) {
        Alert.alert('Notice', 'This post was removed due to community feedback');
        setPosts(posts.filter(p => p.id !== postId));
      } else if (error.response?.status === 400) {
        Alert.alert('Notice', 'Cannot vote on your own post');
      }
    }
  };

  const handleDislike = async (postId: string) => {
    try {
      const response = await api.post(`/api/posts/${postId}/vote`, {
        vote_type: 'dislike',
      });
      
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return response.data;
        }
        return post;
      }));
    } catch (error: any) {
      if (error.response?.status === 404) {
        Alert.alert('Notice', 'This post was removed due to community feedback');
        setPosts(posts.filter(p => p.id !== postId));
      } else if (error.response?.status === 400) {
        Alert.alert('Notice', 'Cannot vote on your own post');
      }
    }
  };

  const renderPost = ({ item }: { item: Post }) => {
    const isLiked = item.likes?.includes(currentUser?.id || '');
    const isDisliked = item.dislikes?.includes(currentUser?.id || '');
    const isOwnPost = item.user_id === currentUser?.id;
    
    return (
      <TouchableOpacity 
        style={styles.postItem}
        onPress={() => router.push(`/post/${item.id}`)}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.postThumbnail} />
        ) : (
          <View style={[styles.postThumbnail, styles.postPlaceholder]}>
            <Text style={styles.postText} numberOfLines={3}>{item.content}</Text>
          </View>
        )}
        <View style={styles.postStats}>
          <TouchableOpacity 
            style={styles.postStat}
            onPress={(e) => {
              e.stopPropagation();
              if (!isOwnPost) handleLike(item.id);
            }}
            disabled={isOwnPost}
          >
            <Ionicons 
              name="thumbs-up" 
              size={16} 
              color={isOwnPost ? "#ccc" : isLiked ? "#34C759" : "#666"} 
            />
            <Text style={styles.postStatText}>{item.likes?.length || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.postStat}
            onPress={(e) => {
              e.stopPropagation();
              if (!isOwnPost) handleDislike(item.id);
            }}
            disabled={isOwnPost}
          >
            <Ionicons 
              name="thumbs-down" 
              size={16} 
              color={isOwnPost ? "#ccc" : isDisliked ? "#FF3B30" : "#666"} 
            />
            <Text style={styles.postStatText}>{item.dislikes?.length || 0}</Text>
          </TouchableOpacity>
          <View style={styles.postStat}>
            <Ionicons name="chatbubble" size={16} color="#666" />
            <Text style={styles.postStatText}>{item.comments_count}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text>Yüklen iyor...</Text>
        </View>
      </View>
    );
  }

  const isOwnProfile = currentUser?.id === user.id;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView>
        <View style={styles.profileSection}>
          {user.profile_picture ? (
            <Image source={{ uri: user.profile_picture }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, styles.profilePlaceholder]}>
              <Ionicons name="person" size={48} color="#999" />
            </View>
          )}
          <Text style={styles.fullName}>{user.full_name}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

          {!isOwnProfile && (
            <TouchableOpacity 
              style={styles.messageButton}
              onPress={handleStartChat}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#fff" />
              <Text style={styles.messageButtonText}>Send Message</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.postsSection}>
          <Text style={styles.postsTitle}>
            Posts ({posts.length})
          </Text>
          {posts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No posts yet</Text>
            </View>
          ) : (
            <View style={styles.postsGrid}>
              {posts.map((post) => (
                <View key={post.id} style={styles.postWrapper}>
                  {renderPost({ item: post })}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 32,
    marginBottom: 8,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profilePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  postsSection: {
    backgroundColor: '#fff',
    padding: 16,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  postWrapper: {
    width: '33.33%',
    padding: 4,
  },
  postItem: {
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  postThumbnail: {
    width: '100%',
    height: '100%',
  },
  postPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  postText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  postStats: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 4,
    padding: 4,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  postStatText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
});
