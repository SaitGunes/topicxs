import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_BACKEND_URL || 'http://localhost:8001';

interface Stats {
  total_users: number;
  total_posts: number;
  total_comments: number;
  total_reports: number;
  pending_reports: number;
  recent_users_7d: number;
  recent_posts_7d: number;
}

interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
  profile_picture?: string;
}

interface UserDetails {
  user: User;
  statistics: {
    posts_count: number;
    comments_count: number;
    friends_count: number;
    groups_created: number;
    referrals_count: number;
    followers_count: number;
    following_count: number;
  };
}

interface Post {
  id: string;
  content: string;
  user_id: string;
  username: string;
  full_name: string;
  created_at: string;
}

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'posts'>('stats');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [postSearch, setPostSearch] = useState('');
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('token').then((t) => {
      setToken(t);
      if (t) {
        loadStats(t);
        loadUsers(t);
        loadPosts(t);
      }
    });
  }, []);

  useEffect(() => {
    if (userSearch.trim()) {
      const filtered = users.filter(
        (u) =>
          u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(userSearch.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [userSearch, users]);

  useEffect(() => {
    if (postSearch.trim()) {
      const filtered = posts.filter(
        (p) =>
          p.content.toLowerCase().includes(postSearch.toLowerCase()) ||
          p.username.toLowerCase().includes(postSearch.toLowerCase()) ||
          p.full_name.toLowerCase().includes(postSearch.toLowerCase())
      );
      setFilteredPosts(filtered);
    } else {
      setFilteredPosts(posts);
    }
  }, [postSearch, posts]);

  const loadStats = async (t: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadUsers = async (t: string) => {
    try {
      console.log('Loading users with token:', t ? 'exists' : 'missing');
      console.log('API URL:', API_URL);
      const response = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      console.log('Users loaded:', response.data.length);
      setUsers(response.data);
    } catch (error: any) {
      console.error('Failed to load users:', error.response?.status, error.response?.data);
    }
  };

  const loadPosts = async (t: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/posts`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      setPosts(response.data);
    } catch (error: any) {
      console.error('Failed to load posts:', error);
    }
  };

  const loadUserDetails = async (userId: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/users/${userId}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedUser(response.data);
      setShowUserModal(true);
    } catch (error: any) {
      Alert.alert('Hata', 'Kullanıcı detayları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCredentials = async () => {
    if (!token || !selectedUser) return;
    
    if (!editEmail && !editPassword) {
      Alert.alert('Hata', 'En az bir alan doldurulmalı');
      return;
    }

    setLoading(true);
    try {
      await axios.put(
        `${API_URL}/api/admin/users/${selectedUser.user.id}/update-credentials`,
        {
          email: editEmail || undefined,
          password: editPassword || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Alert.alert('Başarılı', 'Kullanıcı bilgileri güncellendi');
      setShowEditModal(false);
      setEditEmail('');
      setEditPassword('');
      loadUsers(token);
      loadUserDetails(selectedUser.user.id);
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.detail || 'Güncelleme başarısız');
    } finally {
      setLoading(false);
    }
  };

  const toggleBan = async (userId: string, currentBan: boolean) => {
    if (!token) return;
    try {
      await axios.post(
        `${API_URL}/api/admin/users/${userId}/ban`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Başarılı', currentBan ? 'Kullanıcı banı kaldırıldı' : 'Kullanıcı banlandı');
      loadUsers(token);
      if (selectedUser?.user.id === userId) {
        loadUserDetails(userId);
      }
    } catch (error: any) {
      Alert.alert('Hata', 'İşlem başarısız');
    }
  };

  const toggleAdmin = async (userId: string, currentAdmin: boolean) => {
    if (!token) return;
    try {
      await axios.post(
        `${API_URL}/api/admin/users/${userId}/toggle-admin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Başarılı', currentAdmin ? 'Admin yetkisi kaldırıldı' : 'Admin yetkisi verildi');
      loadUsers(token);
      if (selectedUser?.user.id === userId) {
        loadUserDetails(userId);
      }
    } catch (error: any) {
      Alert.alert('Hata', 'İşlem başarısız');
    }
  };

  const deletePost = async (postId: string) => {
    if (!token) return;
    Alert.alert('Emin misiniz?', 'Bu gönderi silinecek', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/api/admin/posts/${postId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert('Başarılı', 'Gönderi silindi');
            loadPosts(token);
          } catch (error: any) {
            Alert.alert('Hata', 'Silme başarısız');
          }
        },
      },
    ]);
  };

  const onRefresh = () => {
    if (!token) return;
    setRefreshing(true);
    Promise.all([loadStats(token), loadUsers(token), loadPosts(token)]).finally(() =>
      setRefreshing(false)
    );
  };

  const renderStats = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
          <Ionicons name="people" size={32} color="#fff" />
          <Text style={styles.statValue}>{stats?.total_users || 0}</Text>
          <Text style={styles.statLabel}>Toplam Kullanıcı</Text>
          <Text style={styles.statSubtext}>+{stats?.recent_users_7d || 0} (7 gün)</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#2196F3' }]}>
          <Ionicons name="document-text" size={32} color="#fff" />
          <Text style={styles.statValue}>{stats?.total_posts || 0}</Text>
          <Text style={styles.statLabel}>Toplam Gönderi</Text>
          <Text style={styles.statSubtext}>+{stats?.recent_posts_7d || 0} (7 gün)</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#FF9800' }]}>
          <Ionicons name="chatbubble" size={32} color="#fff" />
          <Text style={styles.statValue}>{stats?.total_comments || 0}</Text>
          <Text style={styles.statLabel}>Toplam Yorum</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#F44336' }]}>
          <Ionicons name="flag" size={32} color="#fff" />
          <Text style={styles.statValue}>{stats?.pending_reports || 0}</Text>
          <Text style={styles.statLabel}>Bekleyen Şikayetler</Text>
          <Text style={styles.statSubtext}>{stats?.total_reports || 0} toplam</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderUsers = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Kullanıcı ara (isim, email, kullanıcı adı)"
          value={userSearch}
          onChangeText={setUserSearch}
        />
        {userSearch.length > 0 && (
          <TouchableOpacity onPress={() => setUserSearch('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredUsers.map((user) => (
          <TouchableOpacity
            key={user.id}
            style={styles.userCard}
            onPress={() => loadUserDetails(user.id)}
          >
            <View style={styles.userCardLeft}>
              <View style={[styles.avatar, user.is_banned && styles.bannedAvatar]}>
                <Text style={styles.avatarText}>
                  {user.full_name ? user.full_name[0].toUpperCase() : user.username[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <View style={styles.userNameRow}>
                  <Text style={styles.userName}>{user.full_name || user.username}</Text>
                  {user.is_admin && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>ADMIN</Text>
                    </View>
                  )}
                  {user.is_banned && (
                    <View style={styles.bannedBadge}>
                      <Text style={styles.bannedBadgeText}>BANLI</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.userEmail}>@{user.username}</Text>
                <Text style={styles.userSubtext}>{user.email}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPosts = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Gönderi ara (içerik, kullanıcı)"
          value={postSearch}
          onChangeText={setPostSearch}
        />
        {postSearch.length > 0 && (
          <TouchableOpacity onPress={() => setPostSearch('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredPosts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <View>
                <Text style={styles.postAuthor}>{post.full_name || post.username}</Text>
                <Text style={styles.postDate}>
                  {new Date(post.created_at).toLocaleDateString('tr-TR')}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deletePost(post.id)}
              >
                <Ionicons name="trash" size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
            <Text style={styles.postContent} numberOfLines={3}>
              {post.content}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderUserModal = () => {
    if (!selectedUser) return null;

    return (
      <Modal visible={showUserModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kullanıcı Detayları</Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.userDetailSection}>
                <View style={styles.userDetailAvatar}>
                  <Text style={styles.userDetailAvatarText}>
                    {selectedUser.user.full_name?.[0]?.toUpperCase() ||
                      selectedUser.user.username[0].toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.userDetailName}>
                  {selectedUser.user.full_name || selectedUser.user.username}
                </Text>
                <Text style={styles.userDetailUsername}>@{selectedUser.user.username}</Text>
                <Text style={styles.userDetailEmail}>{selectedUser.user.email}</Text>
              </View>

              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>İstatistikler</Text>
                <View style={styles.miniStatsGrid}>
                  <View style={styles.miniStatCard}>
                    <Ionicons name="document-text" size={24} color="#2196F3" />
                    <Text style={styles.miniStatValue}>{selectedUser.statistics.posts_count}</Text>
                    <Text style={styles.miniStatLabel}>Gönderi</Text>
                  </View>
                  <View style={styles.miniStatCard}>
                    <Ionicons name="chatbubble" size={24} color="#4CAF50" />
                    <Text style={styles.miniStatValue}>{selectedUser.statistics.comments_count}</Text>
                    <Text style={styles.miniStatLabel}>Yorum</Text>
                  </View>
                  <View style={styles.miniStatCard}>
                    <Ionicons name="people" size={24} color="#FF9800" />
                    <Text style={styles.miniStatValue}>{selectedUser.statistics.friends_count}</Text>
                    <Text style={styles.miniStatLabel}>Arkadaş</Text>
                  </View>
                  <View style={styles.miniStatCard}>
                    <Ionicons name="business" size={24} color="#9C27B0" />
                    <Text style={styles.miniStatValue}>{selectedUser.statistics.groups_created}</Text>
                    <Text style={styles.miniStatLabel}>Grup</Text>
                  </View>
                  <View style={styles.miniStatCard}>
                    <Ionicons name="person-add" size={24} color="#00BCD4" />
                    <Text style={styles.miniStatValue}>{selectedUser.statistics.referrals_count}</Text>
                    <Text style={styles.miniStatLabel}>Referans</Text>
                  </View>
                  <View style={styles.miniStatCard}>
                    <Ionicons name="heart" size={24} color="#E91E63" />
                    <Text style={styles.miniStatValue}>{selectedUser.statistics.followers_count}</Text>
                    <Text style={styles.miniStatLabel}>Takipçi</Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionsSection}>
                <Text style={styles.sectionTitle}>İşlemler</Text>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setEditEmail(selectedUser.user.email);
                    setEditPassword('');
                    setShowEditModal(true);
                  }}
                >
                  <Ionicons name="create" size={20} color="#2196F3" />
                  <Text style={styles.actionButtonText}>Email/Şifre Değiştir</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, selectedUser.user.is_admin && styles.actionButtonWarning]}
                  onPress={() => toggleAdmin(selectedUser.user.id, selectedUser.user.is_admin)}
                >
                  <Ionicons
                    name={selectedUser.user.is_admin ? 'remove-circle' : 'shield-checkmark'}
                    size={20}
                    color={selectedUser.user.is_admin ? '#FF9800' : '#4CAF50'}
                  />
                  <Text style={styles.actionButtonText}>
                    {selectedUser.user.is_admin ? 'Admin Yetkisini Kaldır' : 'Admin Yap'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonDanger]}
                  onPress={() => toggleBan(selectedUser.user.id, selectedUser.user.is_banned)}
                >
                  <Ionicons
                    name={selectedUser.user.is_banned ? 'checkmark-circle' : 'ban'}
                    size={20}
                    color="#F44336"
                  />
                  <Text style={styles.actionButtonText}>
                    {selectedUser.user.is_banned ? 'Banı Kaldır' : 'Kullanıcıyı Banla'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderEditModal = () => (
    <Modal visible={showEditModal} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.editModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Bilgileri Güncelle</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.editModalBody}>
            <Text style={styles.inputLabel}>Yeni Email</Text>
            <TextInput
              style={styles.input}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Email adresi"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Yeni Şifre</Text>
            <TextInput
              style={styles.input}
              value={editPassword}
              onChangeText={setEditPassword}
              placeholder="Yeni şifre (değiştirmek için)"
              secureTextEntry
            />

            <Text style={styles.inputHint}>
              * En az bir alan doldurulmalıdır
            </Text>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateCredentials}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Güncelle</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Ionicons
            name="stats-chart"
            size={20}
            color={activeTab === 'stats' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
            İstatistikler
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Ionicons name="people" size={20} color={activeTab === 'users' ? '#2196F3' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Kullanıcılar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Ionicons
            name="document-text"
            size={20}
            color={activeTab === 'posts' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            Gönderiler
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'stats' && renderStats()}
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'posts' && renderPosts()}

      {renderUserModal()}
      {renderEditModal()}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#2196F3' },
  tabText: { fontSize: 14, color: '#666', fontWeight: '500' },
  activeTabText: { color: '#2196F3', fontWeight: '600' },
  tabContent: { flex: 1 },
  statsGrid: { padding: 16, gap: 16 },
  statCard: { padding: 20, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  statLabel: { fontSize: 14, color: '#fff', marginTop: 4 },
  statSubtext: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },
  listContainer: { flex: 1, paddingHorizontal: 16 },
  userCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12 },
  userCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#2196F3', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  bannedAvatar: { backgroundColor: '#999' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  userInfo: { flex: 1 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  userName: { fontSize: 16, fontWeight: '600', color: '#333' },
  adminBadge: { backgroundColor: '#4CAF50', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  adminBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  bannedBadge: { backgroundColor: '#F44336', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  bannedBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  userEmail: { fontSize: 13, color: '#666', marginBottom: 2 },
  userSubtext: { fontSize: 12, color: '#999' },
  postCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12 },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  postAuthor: { fontSize: 14, fontWeight: '600', color: '#333' },
  postDate: { fontSize: 12, color: '#999', marginTop: 2 },
  deleteButton: { padding: 8 },
  postContent: { fontSize: 14, color: '#666' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalBody: { padding: 16 },
  userDetailSection: { alignItems: 'center', marginBottom: 24 },
  userDetailAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2196F3', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  userDetailAvatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  userDetailName: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  userDetailUsername: { fontSize: 14, color: '#666', marginBottom: 4 },
  userDetailEmail: { fontSize: 14, color: '#999' },
  statsSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  miniStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  miniStatCard: { width: '30%', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, alignItems: 'center' },
  miniStatValue: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 8 },
  miniStatLabel: { fontSize: 11, color: '#666', marginTop: 4, textAlign: 'center' },
  actionsSection: { marginBottom: 24 },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 14, borderRadius: 8, marginBottom: 12, gap: 12 },
  actionButtonWarning: { backgroundColor: '#FFF3E0' },
  actionButtonDanger: { backgroundColor: '#FFEBEE' },
  actionButtonText: { fontSize: 14, fontWeight: '500', color: '#333' },
  editModalContent: { backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 20, maxHeight: '70%' },
  editModalBody: { padding: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, fontSize: 14, borderWidth: 1, borderColor: '#e0e0e0' },
  inputHint: { fontSize: 12, color: '#999', marginTop: 8, fontStyle: 'italic' },
  saveButton: { backgroundColor: '#2196F3', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
});
