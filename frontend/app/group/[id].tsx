import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, TextInput, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../store/languageStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Group {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  member_ids: string[];
  requires_approval: boolean;
  created_at: string;
}

interface Post {
  id: string;
  user_id: string;
  username: string;
  user_profile_picture?: string;
  content: string;
  image?: string;
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

type TabType = 'posts' | 'members' | 'requests';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
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
  const [posting, setPosting] = useState(false);

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

  const handleCreatePost = async () => {
    if (!postContent.trim() || posting) return;

    setPosting(true);
    try {
      await axios.post(
        `${API_URL}/api/posts/enhanced`,
        {
          content: postContent.trim(),
          image: null,
          privacy: { level: 'public', specific_user_ids: [] },
          group_id: id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPostContent('');
      setCreatePostModal(false);
      Alert.alert(t('success'), 'Post shared to group');
      loadPosts();
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || error.message);
    } finally {
      setPosting(false);
    }
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

  const handleLikePost = async (postId: string, currentlyLiked: boolean) => {
    try {
      await axios.post(
        `${API_URL}/api/posts/${postId}/vote`,
        { vote_type: currentlyLiked ? 'remove' : 'like' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadPosts();
    } catch (error: any) {
      console.error('Like error:', error);
    }
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

  const renderPosts = () => {
    if (posts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>{t('noPostsInGroup')}</Text>
        </View>
      );
    }

    return posts.map((post) => {
      const isLiked = post.likes.includes(user?.id || '');
      
      return (
        <View key={post.id} style={styles.postCard}>
          <View style={styles.postHeader}>
            <Text style={styles.postUsername}>@{post.username}</Text>
            <Text style={styles.postDate}>{new Date(post.created_at).toLocaleDateString()}</Text>
          </View>
          
          <Text style={styles.postContent}>{post.content}</Text>
          
          {post.image && <Image source={{ uri: post.image }} style={styles.postImage} />}
          
          <View style={styles.postActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLikePost(post.id, isLiked)}
            >
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={20} color={isLiked ? '#F44336' : '#666'} />
              <Text style={styles.actionText}>{post.likes.length}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={20} color="#666" />
              <Text style={styles.actionText}>{post.comments_count}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    });
  };

  const renderMembers = () => {
    if (group.member_ids.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>{t('noUsers')}</Text>
        </View>
      );
    }

    return (
      <View style={styles.membersList}>
        <Text style={styles.membersCount}>
          {group.member_ids.length} {t('members')}
        </Text>
        {group.member_ids.map((memberId, index) => (
          <View key={memberId} style={styles.memberItem}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>👤</Text>
            </View>
            <Text style={styles.memberText}>
              {memberId === group.creator_id ? `${t('creator')}` : `Member ${index + 1}`}
            </Text>
            {memberId === group.creator_id && (
              <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderJoinRequests = () => {
    if (!isCreator) return null;

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
            <Text style={styles.requestDate}>{new Date(request.created_at).toLocaleDateString()}</Text>
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

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'posts' && (
          <>
            {isMember && (
              <TouchableOpacity style={styles.createPostButton} onPress={() => setCreatePostModal(true)}>
                <Ionicons name="add-circle" size={24} color="#007AFF" />
                <Text style={styles.createPostText}>{t('postToGroup')}</Text>
              </TouchableOpacity>
            )}
            {renderPosts()}
          </>
        )}
        
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

      <Modal visible={createPostModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('postToGroup')}</Text>
              <TouchableOpacity onPress={() => setCreatePostModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.postInput}
              placeholder={t('typeMessage')}
              value={postContent}
              onChangeText={setPostContent}
              multiline
              numberOfLines={5}
            />

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
      </Modal>
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
  content: { flex: 1 },
  createPostButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 16, marginTop: 8, marginHorizontal: 16, borderRadius: 8, gap: 8, borderWidth: 1, borderColor: '#007AFF', borderStyle: 'dashed' },
  createPostText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  postCard: { backgroundColor: '#fff', padding: 16, marginTop: 8, marginHorizontal: 16, borderRadius: 8 },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  postUsername: { fontSize: 14, fontWeight: '600', color: '#333' },
  postDate: { fontSize: 12, color: '#666' },
  postContent: { fontSize: 14, color: '#333', marginBottom: 8 },
  postImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 8 },
  postActions: { flexDirection: 'row', gap: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, color: '#666' },
  membersList: { backgroundColor: '#fff', padding: 16, marginTop: 8, marginHorizontal: 16, borderRadius: 8 },
  membersCount: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  memberItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  memberAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  memberAvatarText: { fontSize: 16 },
  memberText: { flex: 1, fontSize: 14, color: '#333' },
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
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  postInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, height: 120, textAlignVertical: 'top', marginBottom: 16 },
  postButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 8, alignItems: 'center' },
  postButtonDisabled: { backgroundColor: '#ccc' },
  postButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
