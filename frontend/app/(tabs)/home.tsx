import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, RefreshControl, Alert, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../store/languageStore';
import api from '../../utils/api';
import * as ImagePicker from 'expo-image-picker';
import { formatDistanceToNow } from 'date-fns';
import { tr, es } from 'date-fns/locale';
import { useRouter } from 'expo-router';

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

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { t, language } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'friends' | 'specific'>('friends');
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  
  // Edit post state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState('');
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  
  // Get locale for date-fns
  const getDateLocale = () => {
    if (language === 'tr') return tr;
    if (language === 'es') return es;
    return undefined; // English default
  };

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (createModalVisible) {
      loadFriends();
    }
  }, [createModalVisible]);

  const loadFriends = async () => {
    try {
      const response = await api.get('/api/friends');
      setFriends(response.data);
    } catch (error) {
      console.error('Load friends error:', error);
    }
  };

  const loadPosts = async () => {
    try {
      const response = await api.get('/api/posts/enhanced');
      setPosts(response.data);
    } catch (error) {
      console.error('Load posts error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setNewPostImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const createPost = async () => {
    if (!newPostContent.trim()) {
      Alert.alert('Error', 'Please write something');
      return;
    }

    setPosting(true);
    try {
      const response = await api.post('/api/posts/enhanced', {
        content: newPostContent,
        image: newPostImage,
        privacy: {
          level: privacyLevel,
          specific_user_ids: privacyLevel === 'specific' ? selectedFriends : [],
        },
      });
      
      setPosts([response.data, ...posts]);
      setNewPostContent('');
      setNewPostImage(null);
      setPrivacyLevel('friends');
      setSelectedFriends([]);
      setCreateModalVisible(false);
      Alert.alert('Success', 'Your post has been published');
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setPosting(false);
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
        // Post was auto-deleted
        Alert.alert('Notice', 'This post was removed due to community feedback');
        setPosts(posts.filter(p => p.id !== postId));
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
        // Post was auto-deleted
        Alert.alert('Notice', 'This post was removed due to community feedback');
        setPosts(posts.filter(p => p.id !== postId));
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    const message = user?.is_admin 
      ? 'Are you sure you want to delete this post as an admin?' 
      : 'Are you sure you want to delete your post?';
    
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        try {
          await api.delete(`/api/posts/${postId}`);
          setPosts(posts.filter(p => p.id !== postId));
          alert('Post deleted successfully');
        } catch (error) {
          console.error('Delete error:', error);
          alert('Failed to delete post');
        }
      }
    } else {
      Alert.alert(
        'Delete Post',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await api.delete(`/api/posts/${postId}`);
                setPosts(posts.filter(p => p.id !== postId));
                Alert.alert('Success', 'Post deleted successfully');
              } catch (error) {
                console.error('Delete error:', error);
                Alert.alert('Error', 'Failed to delete post');
              }
            },
          },
        ]
      );
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setEditContent(post.content);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (content: string) => {
    if (!editingPost) return;
    
    try {
      const response = await api.put(`/api/posts/${editingPost.id}?content=${encodeURIComponent(content)}`);
      setPosts(posts.map(p => p.id === editingPost.id ? response.data : p));
      setEditModalVisible(false);
      Alert.alert('Success', 'Post updated successfully');
    } catch (error) {
      console.error('Edit error:', error);
      Alert.alert('Error', 'Failed to update post');
    }
  };

  const renderPost = ({ item }: { item: Post }) => {
    const isLiked = item.likes?.includes(user?.id || '');
    const isDisliked = item.dislikes?.includes(user?.id || '');
    const isOwnPost = item.user_id === user?.id;
    const canDelete = user?.is_admin || isOwnPost;
    
    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => router.push(`/profile/${item.user_id}`)}
          >
            {item.user_profile_picture ? (
              <Image source={{ uri: item.user_profile_picture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={24} color="#999" />
              </View>
            )}
            <View>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.timestamp}>
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: tr })}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            {isOwnPost && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditPost(item)}
              >
                <Ionicons name="create-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeletePost(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.postContent}>{item.content}</Text>

        {item.image && (
          <TouchableOpacity onPress={() => setFullScreenImage(item.image)}>
            <Image source={{ uri: item.image }} style={styles.postImage} resizeMode="contain" />
          </TouchableOpacity>
        )}

        <View style={styles.postActions}>
          <TouchableOpacity 
            style={[styles.actionButton, isOwnPost && styles.actionButtonDisabled]}
            onPress={() => !isOwnPost && handleLike(item.id)}
            disabled={isOwnPost}
          >
            <Ionicons 
              name="thumbs-up" 
              size={24} 
              color={isOwnPost ? "#ccc" : isLiked ? "#34C759" : "#666"} 
            />
            <Text style={[styles.actionText, isLiked && styles.likedText, isOwnPost && styles.disabledText]}>
              {item.likes?.length || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, isOwnPost && styles.actionButtonDisabled]}
            onPress={() => !isOwnPost && handleDislike(item.id)}
            disabled={isOwnPost}
          >
            <Ionicons 
              name="thumbs-down" 
              size={24} 
              color={isOwnPost ? "#ccc" : isDisliked ? "#FF3B30" : "#666"} 
            />
            <Text style={[styles.actionText, isDisliked && styles.dislikedText, isOwnPost && styles.disabledText]}>
              {item.dislikes?.length || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push(`/post/${item.id}`)}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#666" />
            <Text style={styles.actionText}>{item.comments_count}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Drivers Chat</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <Ionicons name="add" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to post!</Text>
          </View>
        }
      />

      <Modal
        visible={createModalVisible}
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Post</Text>
            <TouchableOpacity 
              onPress={createPost}
              disabled={posting}
            >
              <Text style={[styles.postButton, posting && styles.postButtonDisabled]}>
                {posting ? 'Publishing...' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.textInput}
              placeholder="What's on your mind?"
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              placeholderTextColor="#999"
            />

            {newPostImage && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: newPostImage }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setNewPostImage(null)}
                >
                  <Ionicons name="close-circle" size={32} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={24} color="#007AFF" />
              <Text style={styles.addImageText}>Add Photo</Text>
            </TouchableOpacity>

            {/* Privacy Options */}
            <View style={styles.privacySection}>
              <Text style={styles.privacyTitle}>Who can see this?</Text>
              
              <TouchableOpacity 
                style={[styles.privacyOption, privacyLevel === 'public' && styles.privacyOptionSelected]}
                onPress={() => setPrivacyLevel('public')}
              >
                <Ionicons name="globe-outline" size={20} color={privacyLevel === 'public' ? '#007AFF' : '#666'} />
                <Text style={[styles.privacyText, privacyLevel === 'public' && styles.privacyTextSelected]}>Public - Everyone</Text>
                {privacyLevel === 'public' && <Ionicons name="checkmark-circle" size={20} color="#007AFF" />}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.privacyOption, privacyLevel === 'friends' && styles.privacyOptionSelected]}
                onPress={() => setPrivacyLevel('friends')}
              >
                <Ionicons name="people-outline" size={20} color={privacyLevel === 'friends' ? '#007AFF' : '#666'} />
                <Text style={[styles.privacyText, privacyLevel === 'friends' && styles.privacyTextSelected]}>Friends - Only friends</Text>
                {privacyLevel === 'friends' && <Ionicons name="checkmark-circle" size={20} color="#007AFF" />}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.privacyOption, privacyLevel === 'specific' && styles.privacyOptionSelected]}
                onPress={() => {
                  setPrivacyLevel('specific');
                  setShowFriendSelector(!showFriendSelector);
                }}
              >
                <Ionicons name="person-outline" size={20} color={privacyLevel === 'specific' ? '#007AFF' : '#666'} />
                <Text style={[styles.privacyText, privacyLevel === 'specific' && styles.privacyTextSelected]}>
                  Specific - Choose friends {selectedFriends.length > 0 && `(${selectedFriends.length})`}
                </Text>
                {privacyLevel === 'specific' && <Ionicons name="checkmark-circle" size={20} color="#007AFF" />}
              </TouchableOpacity>

              {/* Friend Selector */}
              {showFriendSelector && privacyLevel === 'specific' && (
                <View style={styles.friendSelector}>
                  {friends.length === 0 ? (
                    <Text style={styles.noFriendsText}>No friends yet. Add friends to share with specific people.</Text>
                  ) : (
                    friends.map((friend) => (
                      <TouchableOpacity
                        key={friend.id}
                        style={styles.friendItem}
                        onPress={() => {
                          if (selectedFriends.includes(friend.id)) {
                            setSelectedFriends(selectedFriends.filter(id => id !== friend.id));
                          } else {
                            setSelectedFriends([...selectedFriends, friend.id]);
                          }
                        }}
                      >
                        <Text style={styles.friendName}>{friend.full_name}</Text>
                        {selectedFriends.includes(friend.id) && (
                          <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Post Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Post</Text>
            <TouchableOpacity 
              onPress={() => handleSaveEdit(editContent)}
              disabled={!editContent.trim()}
            >
              <Text style={[styles.postButton, !editContent.trim() && styles.postButtonDisabled]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.textInput}
              placeholder="What's on your mind?"
              value={editContent}
              onChangeText={setEditContent}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Full Screen Image Modal */}
      <Modal
        visible={fullScreenImage !== null}
        animationType="fade"
        onRequestClose={() => setFullScreenImage(null)}
        transparent={true}
      >
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity style={styles.closeFullScreenButton} onPress={() => setFullScreenImage(null)}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          {fullScreenImage && (
            <Image
              source={{ uri: fullScreenImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  createButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  postCard: {
    backgroundColor: '#fff',
    marginBottom: 8,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deleteButton: {
    padding: 8,
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  likedText: {
    color: '#34C759',
  },
  dislikedText: {
    color: '#FF3B30',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#ccc',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 48,
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  postButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  textInput: {
    fontSize: 18,
    color: '#000',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginTop: 16,
  },
  addImageText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 16,
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
  },
  privacySection: {
    marginTop: 24,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  privacyOptionSelected: {
    backgroundColor: '#E3F2FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  privacyTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  friendSelector: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  noFriendsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 16,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  friendName: {
    fontSize: 14,
    color: '#000',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeFullScreenButton: {
    position: 'absolute',
    top: 48,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});
