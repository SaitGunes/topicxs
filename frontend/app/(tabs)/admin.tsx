import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../store/languageStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type TabType = 'statistics' | 'reports' | 'users' | 'posts';

interface Stats {
  total_users: number;
  total_posts: number;
  total_comments: number;
  total_reports: number;
  pending_reports: number;
  recent_users_7d: number;
  recent_posts_7d: number;
}

interface Report {
  id: string;
  reporter_username: string;
  reported_username: string;
  reported_content_type: string;
  reason: string;
  description?: string;
  status: string;
  created_at: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  is_banned?: boolean;
  created_at: string;
  profile_picture?: string;
}

interface Post {
  id: string;
  user_id: string;
  username: string;
  content: string;
  image?: string;
  likes: string[];
  dislikes: string[];
  comments_count: number;
  created_at: string;
}

export default function AdminPanel() {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const [activeTab, setActiveTab] = useState<TabType>('statistics');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'statistics') {
        await loadStats();
      } else if (activeTab === 'reports') {
        await loadReports();
      } else if (activeTab === 'users') {
        await loadUsers();
      } else if (activeTab === 'posts') {
        await loadPosts();
      }
    } catch (error: any) {
      Alert.alert(t('adminError'), error.response?.data?.detail || error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadStats = async () => {
    const response = await axios.get(`${API_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setStats(response.data);
  };

  const loadReports = async () => {
    const response = await axios.get(`${API_URL}/api/admin/reports`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setReports(response.data);
  };

  const loadUsers = async () => {
    const response = await axios.get(`${API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(response.data);
  };

  const loadPosts = async () => {
    const response = await axios.get(`${API_URL}/api/admin/posts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setPosts(response.data);
  };

  const handleReportAction = async (reportId: string, status: string) => {
    try {
      await axios.put(
        `${API_URL}/api/admin/reports/${reportId}/resolve`,
        null,
        {
          params: { status },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Alert.alert(t('adminSuccess'), `Report ${status}`);
      loadReports();
    } catch (error: any) {
      Alert.alert(t('adminError'), error.response?.data?.detail || error.message);
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    Alert.alert(
      t('adminSuccess'),
      currentStatus ? t('adminConfirmRemoveAdmin') : t('adminConfirmMakeAdmin'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('success'),
          onPress: async () => {
            try {
              await axios.put(
                `${API_URL}/api/admin/users/${userId}/toggle-admin`,
                null,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert(t('adminSuccess'), 'Admin status updated');
              loadUsers();
            } catch (error: any) {
              Alert.alert(t('adminError'), error.response?.data?.detail || error.message);
            }
          },
        },
      ]
    );
  };

  const handleBanUser = async (userId: string, currentBanStatus: boolean) => {
    Alert.alert(
      t('adminSuccess'),
      currentBanStatus ? t('adminConfirmUnban') : t('adminConfirmBan'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('success'),
          onPress: async () => {
            try {
              await axios.put(
                `${API_URL}/api/admin/users/${userId}/ban`,
                null,
                {
                  params: { ban: !currentBanStatus },
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              Alert.alert(t('adminSuccess'), 'User ban status updated');
              loadUsers();
            } catch (error: any) {
              Alert.alert(t('adminError'), error.response?.data?.detail || error.message);
            }
          },
        },
      ]
    );
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert(t('adminSuccess'), t('adminConfirmDelete'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/api/admin/posts/${postId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert(t('adminSuccess'), 'Post deleted');
            loadPosts();
          } catch (error: any) {
            Alert.alert(t('adminError'), error.response?.data?.detail || error.message);
          }
        },
      },
    ]);
  };

  const getReasonLabel = (reason: string) => {
    const reasonMap: { [key: string]: string } = {
      spam: t('adminSpam'),
      harassment: t('adminHarassment'),
      inappropriate: t('adminInappropriate'),
      hate_speech: t('adminHateSpeech'),
      violence: t('adminViolence'),
      other: t('adminOther'),
    };
    return reasonMap[reason] || reason;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'reviewed':
        return '#007AFF';
      case 'resolved':
        return '#4CAF50';
      case 'dismissed':
        return '#999';
      default:
        return '#666';
    }
  };

  const renderStatistics = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={32} color="#007AFF" />
            <Text style={styles.statNumber}>{stats.total_users}</Text>
            <Text style={styles.statLabel}>{t('adminTotalUsers')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="document-text" size={32} color="#4CAF50" />
            <Text style={styles.statNumber}>{stats.total_posts}</Text>
            <Text style={styles.statLabel}>{t('adminTotalPosts')}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="chatbox" size={32} color="#FF9800" />
            <Text style={styles.statNumber}>{stats.total_comments}</Text>
            <Text style={styles.statLabel}>{t('adminTotalComments')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="warning" size={32} color="#F44336" />
            <Text style={styles.statNumber}>{stats.total_reports}</Text>
            <Text style={styles.statLabel}>{t('adminTotalReports')}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="alert-circle" size={32} color="#FFA500" />
            <Text style={styles.statNumber}>{stats.pending_reports}</Text>
            <Text style={styles.statLabel}>{t('adminPendingReports')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="person-add" size={32} color="#9C27B0" />
            <Text style={styles.statNumber}>{stats.recent_users_7d}</Text>
            <Text style={styles.statLabel}>{t('adminRecentUsers')}</Text>
          </View>
        </View>

        <View style={styles.statCardFull}>
          <Ionicons name="trending-up" size={32} color="#00BCD4" />
          <Text style={styles.statNumber}>{stats.recent_posts_7d}</Text>
          <Text style={styles.statLabel}>{t('adminRecentPosts')}</Text>
        </View>
      </View>
    );
  };

  const renderReports = () => {
    if (reports.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#ccc" />
          <Text style={styles.emptyText}>{t('adminNoReports')}</Text>
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        {reports.map((report) => (
          <View key={report.id} style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <View style={styles.reportInfo}>
                <Text style={styles.reportUsername}>@{report.reported_username}</Text>
                <Text style={styles.reportMeta}>
                  {t('adminReportedBy')}: @{report.reporter_username}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(report.status) },
                ]}
              >
                <Text style={styles.statusText}>{report.status}</Text>
              </View>
            </View>

            <View style={styles.reportDetails}>
              <Text style={styles.reportLabel}>{t('adminReason')}:</Text>
              <Text style={styles.reportValue}>{getReasonLabel(report.reason)}</Text>
            </View>

            {report.description && (
              <View style={styles.reportDetails}>
                <Text style={styles.reportLabel}>{t('adminDescription')}:</Text>
                <Text style={styles.reportValue}>{report.description}</Text>
              </View>
            )}

            <View style={styles.reportDetails}>
              <Text style={styles.reportMeta}>
                Type: {report.reported_content_type} • {new Date(report.created_at).toLocaleDateString()}
              </Text>
            </View>

            {report.status === 'pending' && (
              <View style={styles.reportActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.reviewedButton]}
                  onPress={() => handleReportAction(report.id, 'reviewed')}
                >
                  <Text style={styles.actionButtonText}>{t('adminMarkReviewed')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.resolvedButton]}
                  onPress={() => handleReportAction(report.id, 'resolved')}
                >
                  <Text style={styles.actionButtonText}>{t('adminMarkResolved')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.dismissButton]}
                  onPress={() => handleReportAction(report.id, 'dismissed')}
                >
                  <Text style={styles.actionButtonText}>{t('adminDismiss')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderUsers = () => {
    if (users.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people" size={64} color="#ccc" />
          <Text style={styles.emptyText}>{t('adminNoUsers')}</Text>
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        {users.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userHeader}>
              {user.profile_picture ? (
                <Image source={{ uri: user.profile_picture }} style={styles.userAvatar} />
              ) : (
                <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
                  <Text style={styles.userAvatarText}>
                    {user.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.full_name}</Text>
                <Text style={styles.userUsername}>@{user.username}</Text>
                <Text style={styles.userMeta}>
                  {t('adminJoined')}: {new Date(user.created_at).toLocaleDateString()}
                </Text>
              </View>
              {user.is_admin && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>{t('adminIsAdmin')}</Text>
                </View>
              )}
            </View>

            <View style={styles.userActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.adminButton]}
                onPress={() => handleToggleAdmin(user.id, user.is_admin)}
              >
                <Text style={styles.actionButtonText}>
                  {user.is_admin ? t('adminRemoveAdmin') : t('adminMakeAdmin')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  user.is_banned ? styles.unbanButton : styles.banButton,
                ]}
                onPress={() => handleBanUser(user.id, user.is_banned || false)}
              >
                <Text style={styles.actionButtonText}>
                  {user.is_banned ? t('adminUnbanUser') : t('adminBanUser')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderPosts = () => {
    if (posts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text" size={64} color="#ccc" />
          <Text style={styles.emptyText}>{t('adminNoPosts')}</Text>
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsHeaderText}>Total Posts: {posts.length}</Text>
        </View>
        {posts.map((post) => {
          const likesCount = post.likes?.length || 0;
          const dislikesCount = post.dislikes?.length || 0;
          const commentsCount = post.comments_count || 0;
          
          return (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View>
                  <Text style={styles.postUsername}>@{post.username}</Text>
                  <Text style={styles.postDate}>
                    {new Date(post.created_at).toLocaleDateString()} {new Date(post.created_at).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.postId}>ID: {post.id.slice(-6)}</Text>
              </View>

              <Text style={styles.postContent} numberOfLines={3}>{post.content}</Text>

              {post.image && (
                <Image source={{ uri: post.image }} style={styles.postImage} />
              )}

              <View style={styles.postStats}>
                <View style={styles.statItem}>
                  <Ionicons name="thumbs-up" size={16} color="#4CAF50" />
                  <Text style={styles.postStatValue}>{likesCount}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="thumbs-down" size={16} color="#F44336" />
                  <Text style={styles.postStatValue}>{dislikesCount}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="chatbox" size={16} color="#007AFF" />
                  <Text style={styles.postStatValue}>{commentsCount}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.postStatLabel}>
                    Total: {likesCount + dislikesCount + commentsCount}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeletePost(post.id)}
              >
                <Ionicons name="trash" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>{t('adminDeletePost')}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('adminPanel')}</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'statistics' && styles.activeTab]}
          onPress={() => setActiveTab('statistics')}
        >
          <Ionicons
            name="stats-chart"
            size={20}
            color={activeTab === 'statistics' ? '#007AFF' : '#666'}
          />
          <Text
            style={[styles.tabText, activeTab === 'statistics' && styles.activeTabText]}
          >
            {t('adminStatistics')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
          onPress={() => setActiveTab('reports')}
        >
          <Ionicons
            name="warning"
            size={20}
            color={activeTab === 'reports' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>
            {t('adminReports')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Ionicons
            name="people"
            size={20}
            color={activeTab === 'users' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            {t('adminUsers')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Ionicons
            name="document-text"
            size={20}
            color={activeTab === 'posts' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            {t('adminPosts')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <>
            {activeTab === 'statistics' && renderStatistics()}
            {activeTab === 'reports' && renderReports()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'posts' && renderPosts()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  // Statistics
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardFull: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  // Lists
  listContainer: {
    padding: 16,
  },
  // Reports
  reportCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reportMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  reportDetails: {
    marginBottom: 8,
  },
  reportLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  reportValue: {
    fontSize: 14,
    color: '#333',
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  // Users
  userCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userAvatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  adminBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  // Posts
  postCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  postDate: {
    fontSize: 12,
    color: '#666',
  },
  postContent: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  postStat: {
    fontSize: 12,
    color: '#666',
  },
  // Action Buttons
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  reviewedButton: {
    backgroundColor: '#007AFF',
  },
  resolvedButton: {
    backgroundColor: '#4CAF50',
  },
  dismissButton: {
    backgroundColor: '#999',
  },
  adminButton: {
    backgroundColor: '#9C27B0',
  },
  banButton: {
    backgroundColor: '#F44336',
  },
  unbanButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
});
