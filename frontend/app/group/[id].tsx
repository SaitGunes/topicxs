import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, TextInput, Modal, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import EmojiSelector from 'react-native-emoji-selector';
import { formatDistanceToNow } from 'date-fns';
import { tr, es } from 'date-fns/locale';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../store/languageStore';
import FullScreenImage from '../../components/FullScreenImage';
import EditPostModal from '../../components/EditPostModal';
import GroupChat from '../../components/GroupChat';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Group {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  member_ids: string[];
  members?: Member[];  // Full member details from backend
  requires_approval: boolean;
  created_at: string;
}

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
  user_profile_picture?: string;
  content: string;
  image?: string;
  location?: LocationInfo;
  likes: string[];
  dislikes: string[];
  reactions: { [key: string]: string[] };
  comments_count: number;
  created_at: string;
}

interface JoinRequest {
  id: string;
  user_id: string;
  username: string;
  created_at: string;
}

interface Member {
  id: string;
  username: string;
  full_name: string;
  profile_picture?: string;
}

type TabType = 'posts' | 'members' | 'requests' | 'chat';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams();
  const { t, language } = useTranslation();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  
  const [group, setGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  
  const [createPostModal, setCreatePostModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  
  const [selectedPostForReaction, setSelectedPostForReaction] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadGroup();
  }, [id]);

  useEffect(() => {
    if (group) {
      if (activeTab === 'posts') {
        loadPosts();
      } else if (activeTab === 'requests' && group.creator_id === user?.id) {
        loadJoinRequests();
      }
    }
  }, [activeTab, group]);

  const loadGroup = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/groups/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroup(response.data);
      setLoading(false);
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || error.message);
      setLoading(false);
      router.back();
    }
  };

  const loadPosts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/groups/${id}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(response.data);
    } catch (error: any) {
      console.error('Load posts error:', error);
    }
  };

  const loadJoinRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/groups/${id}/join-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJoinRequests(response.data);
    } catch (error: any) {
      console.error('Load join requests error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroup();
    if (activeTab === 'posts') await loadPosts();
    if (activeTab === 'requests') await loadJoinRequests();
    setRefreshing(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPostImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setPostContent(postContent + emoji);
    setShowEmojiPicker(false);
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() || posting) return;

    setPosting(true);
    try {
      await axios.post(
        `${API_URL}/api/posts/enhanced`,
        {
          content: postContent.trim(),
          image: postImage,
          privacy: { level: 'public', specific_user_ids: [] },
          group_id: id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPostContent('');
      setPostImage(null);
      setCreatePostModal(false);
      Alert.alert(t('success'), 'Post shared to group');
      loadPosts();
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || error.message);
    } finally {
      setPosting(false);
    }
  };

  const handleVote = async (postId: string, voteType: 'like' | 'dislike' | 'remove') => {
    try {
      await axios.post(
        `${API_URL}/api/posts/${postId}/vote`,
        { vote_type: voteType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadPosts();
    } catch (error: any) {
      console.error('Vote error:', error);
    }
  };

  const handleReaction = async (postId: string, emoji: string) => {
    try {
      await axios.post(
        `${API_URL}/api/posts/${postId}/react`,
        { emoji },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowReactionPicker(false);
      setSelectedPostForReaction(null);
      loadPosts();
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || error.message);
    }
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert(t('delete'), t('confirmDelete'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/api/posts/${postId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert(t('success'), t('postDeleted'));
            loadPosts();
          } catch (error: any) {
            Alert.alert(t('error'), error.response?.data?.detail || error.message);
          }
        },
      },
    ]);
  };

  const handleJoinRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await axios.put(
        `${API_URL}/api/groups/${id}/join-requests/${requestId}`,
        null,
        {
          params: { action },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Alert.alert(t('success'), action === 'approve' ? t('requestApproved') : t('requestRejected'));
      loadJoinRequests();
      loadGroup();
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || error.message);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(t('leaveGroup'), t('confirmLeaveGroup'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('leaveGroup'),
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/api/groups/${id}/leave`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert(t('success'), t('leftGroup'));
            router.back();
          } catch (error: any) {
            Alert.alert(t('error'), error.response?.data?.detail || error.message);
          }
        },
      },
    ]);
  };

  const handleDeleteGroup = () => {
    Alert.alert(t('deleteGroup'), t('confirmDeleteGroup'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deleteGroup'),
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/api/groups/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert(t('success'), t('groupDeleted'));
            router.back();
          } catch (error: any) {
            Alert.alert(t('error'), error.response?.data?.detail || error.message);
          }
        },
      },
    ]);
  };

  const handleJoinGroup = async () => {
    if (joining) return;
    
    setJoining(true);
    try {
      await axios.post(
        `${API_URL}/api/groups/${id}/join`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert(t('success'), 'Join request sent successfully');
      await loadGroup();
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || error.message);
    } finally {
      setJoining(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const locale = language === 'tr' ? tr : language === 'es' ? es : undefined;
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale });
  };

  const renderPost = ({ item: post }: { item: Post }) => {
    const isLiked = post.likes?.includes(user?.id || '');
    const isDisliked = post.dislikes?.includes(user?.id || '');
    const isOwnPost = post.user_id === user?.id;
    const totalVotes = (post.likes?.length || 0) + (post.dislikes?.length || 0);
    const dislikeRatio = totalVotes > 0 ? (post.dislikes?.length || 0) / totalVotes : 0;
    const showAutoDeleteWarning = totalVotes >= 10 && dislikeRatio > 0.5;

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.postHeaderLeft}>
            <Text style={styles.postUsername}>{post.full_name || post.username}</Text>
            <Text style={styles.postTime}>{getTimeAgo(post.created_at)}</Text>
          </View>
          
          {isOwnPost && (
            <View style={styles.postHeaderRight}>
              <TouchableOpacity
                onPress={() => {
                  setEditingPost(post);
                  setEditModalVisible(true);
                }}
                style={styles.iconButton}
              >
                <Ionicons name="create-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeletePost(post.id)} style={styles.iconButton}>
                <Ionicons name="trash-outline" size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.postContent}>{post.content}</Text>

        {post.image && (
          <TouchableOpacity onPress={() => setFullScreenImage(post.image || null)}>
            <Image source={{ uri: post.image }} style={styles.postImage} />
          </TouchableOpacity>
        )}

        {showAutoDeleteWarning && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={16} color="#FF9800" />
            <Text style={styles.warningText}>{t('autoDeleteWarning')}</Text>
          </View>
        )}

        <View style={styles.postActions}>
          <TouchableOpacity
            style={[styles.actionButton, isLiked && styles.likedButton]}
            onPress={() => handleVote(post.id, isLiked ? 'remove' : 'like')}
          >
            <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={20} color={isLiked ? '#F44336' : '#666'} />
            <Text style={[styles.actionText, isLiked && styles.likedText]}>{post.likes?.length || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, isDisliked && styles.dislikedButton]}
            onPress={() => handleVote(post.id, isDisliked ? 'remove' : 'dislike')}
          >
            <Ionicons name={isDisliked ? 'thumbs-down' : 'thumbs-down-outline'} size={20} color={isDisliked ? '#F44336' : '#666'} />
            <Text style={[styles.actionText, isDisliked && styles.dislikedText]}>{post.dislikes?.length || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedPostForReaction(post.id);
              setShowReactionPicker(true);
            }}
          >
            <Ionicons name="happy-outline" size={20} color="#666" />
            <Text style={styles.actionText}>
              {Object.values(post.reactions || {}).reduce((sum, arr) => sum + arr.length, 0)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/post/${post.id}`)}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#666" />
            <Text style={styles.actionText}>{post.comments_count || 0}</Text>
          </TouchableOpacity>
        </View>

        {post.reactions && Object.keys(post.reactions).length > 0 && (
          <View style={styles.reactionsBar}>
            {Object.entries(post.reactions).map(([emoji, userIds]) => (
              <View key={emoji} style={styles.reactionItem}>
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                <Text style={styles.reactionCount}>{userIds.length}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderMembers = () => {
    if (!group || group.member_ids.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>{t('noUsers')}</Text>
        </View>
      );
    }

    const members = group.members || [];

    return (
      <View style={styles.membersList}>
        <Text style={styles.membersCount}>
          {group.member_ids.length} {t('members')}
        </Text>
        {members.map((member) => (
          <TouchableOpacity 
            key={member.id} 
            style={styles.memberItem}
            onPress={() => router.push(`/profile/${member.id}`)}
          >
            {member.profile_picture ? (
              <Image source={{ uri: member.profile_picture }} style={styles.memberAvatar} />
            ) : (
              <View style={[styles.memberAvatar, styles.memberAvatarPlaceholder]}>
                <Text style={styles.memberAvatarText}>
                  {member.full_name?.charAt(0).toUpperCase() || member.username.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.full_name || member.username}</Text>
              <Text style={styles.memberUsername}>@{member.username}</Text>
            </View>
            {member.id === group.creator_id && (
              <View style={styles.creatorBadge}>
                <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                <Text style={styles.creatorText}>{t('creator')}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderJoinRequests = () => {
    if (!group || group.creator_id !== user?.id) return null;

    if (joinRequests.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="mail-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No pending requests</Text>
        </View>
      );
    }

    return joinRequests.map((request) => (
      <View key={request.id} style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.requestAvatar}>
            <Text style={styles.requestAvatarText}>{request.username.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.requestInfo}>
            <Text style={styles.requestUsername}>@{request.username}</Text>
            <Text style={styles.requestDate}>{getTimeAgo(request.created_at)}</Text>
          </View>
        </View>
        
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.requestButton, styles.approveButton]}
            onPress={() => handleJoinRequest(request.id, 'approve')}
          >
            <Text style={styles.requestButtonText}>{t('approve')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.requestButton, styles.rejectButton]}
            onPress={() => handleJoinRequest(request.id, 'reject')}
          >
            <Text style={styles.requestButtonText}>{t('reject')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    ));
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

  if (!group) return null;

  const isCreator = group.creator_id === user?.id;
  const isMember = group.member_ids.includes(user?.id || '');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{group.name}</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.groupInfo}>
        <View style={styles.groupIcon}>
          <Ionicons name="people" size={40} color="#007AFF" />
        </View>
        
        <View style={styles.groupDetails}>
          <Text style={styles.groupName}>{group.name}</Text>
          {group.description && (
            <Text style={styles.groupDescription} numberOfLines={2}>{group.description}</Text>
          )}
          
          <View style={styles.groupMeta}>
            <Text style={styles.metaText}>{group.member_ids.length} {t('members')}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Ionicons name={group.requires_approval ? 'lock-closed' : 'lock-open'} size={12} color="#666" />
            <Text style={styles.metaText}>
              {group.requires_approval ? t('privateGroup').split(' - ')[0] : t('publicGroup').split(' - ')[0]}
            </Text>
          </View>
        </View>
        
        {isCreator && (
          <View style={styles.creatorBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#fff" />
          </View>
        )}
      </View>

      {/* Private grup + üye değilse tabs gösterme */}
      {group.requires_approval && !isMember ? null : (
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>{t('groupPosts')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'members' && styles.activeTab]}
            onPress={() => setActiveTab('members')}
          >
            <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>{t('members')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
            onPress={() => setActiveTab('chat')}
          >
            <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>💬 Chat</Text>
          </TouchableOpacity>
          
          {isCreator && group.requires_approval && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
              onPress={() => setActiveTab('requests')}
            >
              <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                {t('joinRequests')} {joinRequests.length > 0 && `(${joinRequests.length})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Private grup + üye değilse içeriği gösterme */}
      {group.requires_approval && !isMember ? (
        <View style={styles.privateGroupContainer}>
          <Ionicons name="lock-closed" size={80} color="#ccc" />
          <Text style={styles.privateGroupTitle}>Private Group</Text>
          <Text style={styles.privateGroupText}>
            This is a private group. You need to join to see posts, members and chat.
          </Text>
          <TouchableOpacity 
            style={styles.joinGroupButton}
            onPress={handleJoinGroup}
            disabled={joining}
          >
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.joinGroupButtonText}>
              {joining ? 'Sending Request...' : 'Request to Join'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <React.Fragment>
          {activeTab === 'posts' && isMember && (
            <TouchableOpacity style={styles.createPostButton} onPress={() => setCreatePostModal(true)}>
              <Ionicons name="add-circle" size={24} color="#007AFF" />
              <Text style={styles.createPostText}>{t('postToGroup')}</Text>
            </TouchableOpacity>
          )}

          {activeTab === 'posts' ? (
            <FlatList
              data={posts}
              renderItem={renderPost}
              keyExtractor={(item) => item.id}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-text-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>{t('noPostsInGroup')}</Text>
                </View>
              }
              contentContainerStyle={styles.postsList}
            />
          ) : activeTab === 'chat' ? (
            isMember ? (
              <GroupChat groupId={id as string} />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="lock-closed-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Join the group to access chat</Text>
              </View>
            )
          ) : (
            <ScrollView
              style={styles.content}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
              {activeTab === 'members' && renderMembers()}
              {activeTab === 'requests' && renderJoinRequests()}

              <View style={styles.actions}>
                {isMember && !isCreator && (
                  <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveGroup}>
                    <Ionicons name="exit-outline" size={20} color="#fff" />
                    <Text style={styles.leaveButtonText}>{t('leaveGroup')}</Text>
                  </TouchableOpacity>
                )}

                {isCreator && (
                  <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteGroup}>
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                    <Text style={styles.deleteButtonText}>{t('deleteGroup')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}
        </React.Fragment>
      )}

      <Modal visible={createPostModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('postToGroup')}</Text>
              <TouchableOpacity onPress={() => {
                setCreatePostModal(false);
                setPostContent('');
                setPostImage(null);
                setShowEmojiPicker(false);
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <TextInput
                style={styles.postInput}
                placeholder={t('typeMessage')}
                value={postContent}
                onChangeText={setPostContent}
                multiline
                numberOfLines={5}
              />

              {postImage && (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: postImage }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setPostImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#F44336" />
                  </TouchableOpacity>
                </View>
              )}

              {showEmojiPicker && (
                <View style={styles.emojiPickerContainer}>
                  <EmojiSelector onEmojiSelected={handleEmojiSelect} columns={8} />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
                <Ionicons name="image-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Ionicons name="happy-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.postButton, (!postContent.trim() || posting) && styles.postButtonDisabled]}
                onPress={handleCreatePost}
                disabled={!postContent.trim() || posting}
              >
                {posting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.postButtonText}>{t('post')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showReactionPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.reactionModalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowReactionPicker(false);
            setSelectedPostForReaction(null);
          }}
        >
          <View style={styles.reactionPickerContainer}>
            {['❤️', '😂', '👍', '😮', '😢', '😡', '🔥', '✨'].map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionButton}
                onPress={() => selectedPostForReaction && handleReaction(selectedPostForReaction, emoji)}
              >
                <Text style={styles.reactionButtonEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <FullScreenImage
        visible={!!fullScreenImage}
        imageUri={fullScreenImage}
        onClose={() => setFullScreenImage(null)}
      />

      {editingPost && (
        <EditPostModal
          visible={editModalVisible}
          post={editingPost}
          onClose={() => {
            setEditModalVisible(false);
            setEditingPost(null);
          }}
          onUpdate={() => {
            setEditModalVisible(false);
            setEditingPost(null);
            loadPosts();
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  backButton: { padding: 4 },
  title: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center', marginHorizontal: 16 },
  headerRight: { width: 32 },
  groupInfo: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', alignItems: 'center' },
  groupIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  groupDetails: { flex: 1 },
  groupName: { fontSize: 18, fontWeight: '600', color: '#333' },
  groupDescription: { fontSize: 12, color: '#666', marginTop: 2 },
  groupMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  metaText: { fontSize: 12, color: '#666' },
  metaDot: { fontSize: 12, color: '#666' },
  creatorBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  tabText: { fontSize: 14, color: '#666' },
  activeTabText: { color: '#007AFF', fontWeight: '600' },
  createPostButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 12, marginTop: 8, marginHorizontal: 16, borderRadius: 8, gap: 8, borderWidth: 1, borderColor: '#007AFF', borderStyle: 'dashed' },
  createPostText: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
  postsList: { paddingBottom: 16 },
  postCard: { backgroundColor: '#fff', padding: 16, marginTop: 8, marginHorizontal: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  postHeaderLeft: { flex: 1 },
  postHeaderRight: { flexDirection: 'row', gap: 8 },
  postUsername: { fontSize: 14, fontWeight: '600', color: '#333' },
  postTime: { fontSize: 12, color: '#666', marginTop: 2 },
  postContent: { fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 12 },
  postImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12 },
  warningBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3CD', padding: 8, borderRadius: 8, marginBottom: 12, gap: 8 },
  warningText: { fontSize: 12, color: '#856404', flex: 1 },
  postActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12, gap: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likedButton: {},
  dislikedButton: {},
  actionText: { fontSize: 12, color: '#666' },
  likedText: { color: '#F44336', fontWeight: '600' },
  dislikedText: { color: '#F44336', fontWeight: '600' },
  reactionsBar: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  reactionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 10, color: '#666', fontWeight: '600' },
  iconButton: { padding: 4 },
  content: { flex: 1 },
  membersList: { backgroundColor: '#fff', padding: 16, marginTop: 8, marginHorizontal: 16, borderRadius: 8 },
  membersCount: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  memberItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  memberAvatar: { width: 48, height: 48, borderRadius: 24 },
  memberAvatarPlaceholder: { backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
  memberAvatarText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 16, fontWeight: '600', color: '#000' },
  memberUsername: { fontSize: 14, color: '#666', marginTop: 2 },
  memberText: { flex: 1, fontSize: 14, color: '#333' },
  creatorBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  creatorText: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  requestCard: { backgroundColor: '#fff', padding: 16, marginTop: 8, marginHorizontal: 16, borderRadius: 8 },
  requestHeader: { flexDirection: 'row', marginBottom: 12 },
  requestAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  requestAvatarText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  requestInfo: { flex: 1 },
  requestUsername: { fontSize: 14, fontWeight: '600', color: '#333' },
  requestDate: { fontSize: 12, color: '#666', marginTop: 2 },
  requestActions: { flexDirection: 'row', gap: 8 },
  requestButton: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  approveButton: { backgroundColor: '#4CAF50' },
  rejectButton: { backgroundColor: '#F44336' },
  requestButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 12 },
  actions: { padding: 16, gap: 12, marginTop: 16, marginBottom: 32 },
  leaveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF9800', padding: 16, borderRadius: 8, gap: 8 },
  leaveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F44336', padding: 16, borderRadius: 8, gap: 8 },
  deleteButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalScroll: { maxHeight: 400 },
  postInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, minHeight: 100, textAlignVertical: 'top', margin: 16 },
  imagePreviewContainer: { marginHorizontal: 16, marginBottom: 16, position: 'relative' },
  imagePreview: { width: '100%', height: 200, borderRadius: 8 },
  removeImageButton: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12 },
  emojiPickerContainer: { height: 250, marginHorizontal: 16, marginBottom: 16 },
  modalActions: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: '#e0e0e0', gap: 16 },
  postButton: { flex: 1, backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  postButtonDisabled: { backgroundColor: '#ccc' },
  postButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  reactionModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  reactionPickerContainer: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12, maxWidth: 300 },
  reactionButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  reactionButtonEmoji: { fontSize: 24 },
  privateGroupContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#f5f5f5' },
  privateGroupTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 16, marginBottom: 8 },
  privateGroupText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  joinGroupButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, gap: 8 },
  joinGroupButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
