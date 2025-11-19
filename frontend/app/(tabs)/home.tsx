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
import EmojiSelector from 'react-native-emoji-selector';
import LocationPicker, { LocationData } from '../../components/LocationPicker';

interface LocationInfo {
  latitude: number;
  longitude: number;
  location_type: string;
  description?: string;
}

interface Post {
  id: string;
  user_id: string;
  username: string;
  full_name?: string;
  user_profile_picture: string | null;
  content: string;
  image: string | null;
  location?: LocationInfo;
  likes: string[];
  dislikes: string[];
  comments_count: number;
  share_count: number;
  shared_from_id: string | null;
  created_at: string;
  reactions?: { [emoji: string]: string[] };
  privacy?: { type: string };
}

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { t, language } = useTranslation();
  const { currentSector } = require('../../store/sectorStore').useSectorStore();
  
  // Get current sector name
  const sectorInfo = {
    drivers: t('sectorDrivers'),
    sports: t('sectorSports'),
    science: t('sectorScience'),
    construction: t('sectorConstruction'),
    finance: t('sectorFinance'),
    tourism: t('sectorTourism'),
    food: t('sectorFood'),
    health: t('sectorHealth'),
    music: t('sectorMusic'),
    gaming: t('sectorGaming'),
  };
  const sectorName = sectorInfo[currentSector as keyof typeof sectorInfo] || 'Drivers';
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');
  const [refreshing, setRefreshing] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [newPostLocation, setNewPostLocation] = useState<LocationData | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
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
  
  // Search state
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Get locale for date-fns
  const getDateLocale = () => {
    if (language === 'tr') return tr;
    if (language === 'es') return es;
    return undefined; // English default
  };

  useEffect(() => {
    loadPosts();
    loadFollowing();
  }, [activeTab]);

  const loadFollowing = async () => {
    try {
      if (!user?.id) return;
      const response = await api.get(`/api/users/${user.id}/following`);
      const ids = response.data.map((u: any) => u.id);
      setFollowingIds(ids);
    } catch (error) {
      console.error('Load following error:', error);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await api.post(`/api/users/${userId}/follow`);
      setFollowingIds([...followingIds, userId]);
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || 'Failed to follow user');
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await api.delete(`/api/users/${userId}/follow`);
      setFollowingIds(followingIds.filter(id => id !== userId));
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || 'Failed to unfollow user');
    }
  };

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
      const endpoint = activeTab === 'following' 
        ? '/api/posts/following' 
        : '/api/posts/enhanced';
      const response = await api.get(`${endpoint}?sector=${currentSector || 'drivers'}`);
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
      allowsEditing: false,  // No cropping - keep original aspect ratio
      quality: 0.7,  // Better quality, reasonable size
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setNewPostImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const createPost = async () => {
    if (!newPostContent.trim()) {
      Alert.alert(t('error'), t('writeError'));
      return;
    }

    setPosting(true);
    try {
      const response = await api.post('/api/posts/enhanced', {
        content: newPostContent,
        image: newPostImage,
        location: newPostLocation,
        sector: currentSector || 'drivers',
        privacy: {
          level: privacyLevel,
          specific_user_ids: privacyLevel === 'specific' ? selectedFriends : [],
        },
      });
      
      setPosts([response.data, ...posts]);
      setNewPostContent('');
      setNewPostImage(null);
      setNewPostLocation(null);
      setPrivacyLevel('friends');
      setSelectedFriends([]);
      setCreateModalVisible(false);
      Alert.alert(t('success'), t('postPublished'));
    } catch (error: any) {
      // Check if it's a duplicate post error
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('already posted')) {
        Alert.alert(
          'Duplicate Post', 
          'You have already posted this content in the last 24 hours. Please share something new!'
        );
      } else {
        Alert.alert(t('error'), t('failedCreatePost'));
      }
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
        Alert.alert(t('success'), t('postRemoved'));
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
        Alert.alert(t('success'), t('postRemoved'));
        setPosts(posts.filter(p => p.id !== postId));
      }
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const response = await api.post(`/api/posts/${postId}/share`);
      Alert.alert(t('success'), 'Post shared to your timeline!');
      // Refresh posts to show the shared post
      loadPosts();
    } catch (error: any) {
      if (error.response?.status === 400) {
        Alert.alert(t('error'), "Can't share your own post");
      } else {
        Alert.alert(t('error'), 'Failed to share post');
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    const message = user?.is_admin 
      ? t('deletePostAdminMessage')
      : t('deletePostMessage');
    
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        try {
          await api.delete(`/api/posts/${postId}`);
          setPosts(posts.filter(p => p.id !== postId));
          alert(t('postDeleted'));
        } catch (error) {
          console.error('Delete error:', error);
          alert(t('failedDeletePost'));
        }
      }
    } else {
      Alert.alert(
        t('deletePostTitle'),
        message,
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('delete'),
            style: 'destructive',
            onPress: async () => {
              try {
                await api.delete(`/api/posts/${postId}`);
                setPosts(posts.filter(p => p.id !== postId));
                Alert.alert(t('success'), t('postDeleted'));
              } catch (error) {
                console.error('Delete error:', error);
                Alert.alert(t('error'), t('failedDeletePost'));
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
      Alert.alert(t('success'), t('postUpdated'));
    } catch (error) {
      console.error('Edit error:', error);
      Alert.alert(t('error'), t('failedUpdatePost'));
    }
  };

  const handleSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get(`/api/posts/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleReaction = async (postId: string, emoji: string) => {
    try {
      const response = await api.post(`/api/posts/${postId}/react`, { emoji });
      setPosts(posts.map(post => post.id === postId ? response.data : post));
    } catch (error: any) {
      if (error.response?.status === 404) {
        Alert.alert(t('success'), t('postRemoved'));
        setPosts(posts.filter(p => p.id !== postId));
      }
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
            <View style={styles.userTextContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.fullName}>{item.full_name || item.username}</Text>
                {!isOwnPost && (
                  followingIds.includes(item.user_id) ? (
                    <TouchableOpacity 
                      style={styles.followingBadge}
                      onPress={() => handleUnfollow(item.user_id)}
                    >
                      <Text style={styles.followingBadgeText}>Following</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={styles.followBadge}
                      onPress={() => handleFollow(item.user_id)}
                    >
                      <Ionicons name="add" size={14} color="#fff" />
                      <Text style={styles.followBadgeText}>Follow</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
              <Text style={styles.timestamp}>
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: getDateLocale() })}
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

          <TouchableOpacity 
            style={[styles.actionButton, isOwnPost && styles.actionButtonDisabled]}
            onPress={() => !isOwnPost && handleShare(item.id)}
            disabled={isOwnPost}
          >
            <Ionicons name="share-outline" size={22} color={isOwnPost ? "#ccc" : "#666"} />
            <Text style={[styles.actionText, isOwnPost && styles.disabledText]}>
              {item.share_count || 0}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Emoji Reactions */}
        {item.reactions && Object.keys(item.reactions).length > 0 && (
          <View style={styles.reactionsBar}>
            {Object.entries(item.reactions).map(([emoji, userIds]) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.reactionBubble,
                  userIds.includes(user?.id || '') && styles.reactionBubbleActive
                ]}
                onPress={() => !isOwnPost && handleReaction(item.id, emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                <Text style={styles.reactionCount}>{userIds.length}</Text>
              </TouchableOpacity>
            ))}
            {!isOwnPost && (
              <TouchableOpacity 
                style={styles.addReactionButton}
                onPress={() => {
                  setEditingPost(item);
                  setShowEmojiPicker(true);
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>
        )}
        {!isOwnPost && (!item.reactions || Object.keys(item.reactions).length === 0) && (
          <TouchableOpacity 
            style={styles.firstReactionButton}
            onPress={() => {
              setEditingPost(item);
              setShowEmojiPicker(true);
            }}
          >
            <Ionicons name="happy-outline" size={18} color="#007AFF" />
            <Text style={styles.firstReactionText}>Add Reaction</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏢 Topicx {sectorName}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => setSearchModalVisible(true)}
          >
            <Ionicons name="search" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setCreateModalVisible(true)}
          >
            <Ionicons name="add" size={28} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'forYou' && styles.activeTab]}
          onPress={() => setActiveTab('forYou')}
        >
          <Text style={[styles.tabText, activeTab === 'forYou' && styles.activeTabText]}>
            For You
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
            Following
          </Text>
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
            <Text style={styles.emptyText}>{t('noPostsYet')}</Text>
            <Text style={styles.emptySubtext}>{t('beFirstToPost')}</Text>
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
              <Text style={styles.cancelButton}>{t('cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('newPost')}</Text>
            <TouchableOpacity 
              onPress={createPost}
              disabled={posting}
            >
              <Text style={[styles.postButton, posting && styles.postButtonDisabled]}>
                {posting ? t('publishing') : t('post')}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.textInput}
              placeholder={t('whatsOnYourMind')}
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

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                <Ionicons name="image-outline" size={24} color="#007AFF" />
                <Text style={styles.addImageText}>{t('addPhoto')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.emojiButton} 
                onPress={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Ionicons name="happy-outline" size={24} color="#007AFF" />
                <Text style={styles.emojiButtonText}>Emoji</Text>
              </TouchableOpacity>
            </View>

            {showEmojiPicker && (
              <View style={styles.emojiPickerContainer}>
                <EmojiSelector
                  onEmojiSelected={(emoji) => {
                    setNewPostContent(newPostContent + emoji);
                    setShowEmojiPicker(false);
                  }}
                  showSearchBar={false}
                  showTabs={true}
                  showHistory={false}
                  category={undefined}
                />
              </View>
            )}

            {/* Privacy Options */}
            <View style={styles.privacySection}>
              <Text style={styles.privacyTitle}>{t('whoCanSee')}</Text>
              
              <TouchableOpacity 
                style={[styles.privacyOption, privacyLevel === 'public' && styles.privacyOptionSelected]}
                onPress={() => setPrivacyLevel('public')}
              >
                <Ionicons name="globe-outline" size={20} color={privacyLevel === 'public' ? '#007AFF' : '#666'} />
                <Text style={[styles.privacyText, privacyLevel === 'public' && styles.privacyTextSelected]}>{t('publicEveryone')}</Text>
                {privacyLevel === 'public' && <Ionicons name="checkmark-circle" size={20} color="#007AFF" />}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.privacyOption, privacyLevel === 'friends' && styles.privacyOptionSelected]}
                onPress={() => setPrivacyLevel('friends')}
              >
                <Ionicons name="people-outline" size={20} color={privacyLevel === 'friends' ? '#007AFF' : '#666'} />
                <Text style={[styles.privacyText, privacyLevel === 'friends' && styles.privacyTextSelected]}>{t('friendsOnly')}</Text>
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
                  {t('specificFriends')} {selectedFriends.length > 0 && `(${selectedFriends.length})`}
                </Text>
                {privacyLevel === 'specific' && <Ionicons name="checkmark-circle" size={20} color="#007AFF" />}
              </TouchableOpacity>

              {/* Friend Selector */}
              {showFriendSelector && privacyLevel === 'specific' && (
                <View style={styles.friendSelector}>
                  {friends.length === 0 ? (
                    <Text style={styles.noFriendsText}>{t('noFriendsYet')}</Text>
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
              <Text style={styles.cancelButton}>{t('cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('editPost')}</Text>
            <TouchableOpacity 
              onPress={() => handleSaveEdit(editContent)}
              disabled={!editContent.trim()}
            >
              <Text style={[styles.postButton, !editContent.trim() && styles.postButtonDisabled]}>
                {t('save')}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.textInput}
              placeholder={t('whatsOnYourMind')}
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

      {/* Search Modal */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
              <Text style={styles.cancelButton}>{t('cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('search')}</Text>
            <View style={{ width: 60 }} />
          </View>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchPosts')}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                handleSearch(text);
              }}
              autoFocus
              placeholderTextColor="#999"
            />
          </View>

          <FlatList
            data={searchResults}
            renderItem={renderPost}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.searchResults}
            ListEmptyComponent={
              searchQuery.length >= 2 && !searching ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>{t('noResultsFound')}</Text>
                </View>
              ) : searchQuery.length < 2 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>{t('typeToSearch')}</Text>
                </View>
              ) : null
            }
            ListHeaderComponent={
              searching ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>{t('searching')}</Text>
                </View>
              ) : null
            }
          />
        </KeyboardAvoidingView>
      </Modal>

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        animationType="slide"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <LocationPicker
          onLocationSelected={(location) => {
            setNewPostLocation(location);
            setShowLocationPicker(false);
            Alert.alert('Location Added', `${location.description} has been added to your post`);
          }}
          onCancel={() => setShowLocationPicker(false)}
        />
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '700',
  },
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
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
  userTextContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  followBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 2,
  },
  followBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  followingBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  followingBadgeText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '600',
  },
  fullName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  usernameGray: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
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
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 16,
    flex: 1,
    marginRight: 8,
  },
  addImageText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  addLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    flex: 1,
  },
  addLocationText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 16,
  },
  locationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  locationText: {
    flex: 1,
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '500',
  },
  emojiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    flex: 1,
  },
  emojiButtonText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 16,
  },
  emojiPickerContainer: {
    height: 300,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
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
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    fontSize: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    color: '#000',
  },
  searchResults: {
    flexGrow: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});
