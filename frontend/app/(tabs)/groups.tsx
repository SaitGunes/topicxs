import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

export default function GroupsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  
  const [activeTab, setActiveTab] = useState<'myGroups' | 'discover'>('myGroups');
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [discoverGroups, setDiscoverGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Create group modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(true);

  useEffect(() => {
    loadGroups();
  }, [activeTab]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      if (activeTab === 'myGroups') {
        const response = await axios.get(`${API_URL}/api/groups`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyGroups(response.data);
      } else {
        const response = await axios.get(`${API_URL}/api/groups/discover`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDiscoverGroups(response.data);
      }
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert(t('error'), t('enterGroupName'));
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/groups`,
        {
          name: groupName,
          description: groupDescription || undefined,
          requires_approval: requiresApproval,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Alert.alert(t('success'), t('groupCreated'));
      setCreateModalVisible(false);
      setGroupName('');
      setGroupDescription('');
      setRequiresApproval(true);
      loadGroups();
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || error.message);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/groups/${groupId}/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert(t('success'), response.data.message);
      loadGroups();
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || error.message);
    }
  };

  const renderGroupCard = (group: Group, isMember: boolean) => {
    const isCreator = group.creator_id === user?.id;
    
    return (
      <TouchableOpacity
        key={group.id}
        style={styles.groupCard}
        onPress={() => router.push(`/group/${group.id}`)}
      >
        <View style={styles.groupHeader}>
          <View style={styles.groupIconContainer}>
            <Ionicons name="people" size={32} color="#007AFF" />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{group.name}</Text>
            {group.description && (
              <Text style={styles.groupDescription} numberOfLines={2}>
                {group.description}
              </Text>
            )}
            <View style={styles.groupMeta}>
              <Ionicons name="people-outline" size={14} color="#666" />
              <Text style={styles.groupMetaText}>
                {group.member_ids.length} {t('members')}
              </Text>
              {group.requires_approval && (
                <>
                  <Ionicons name="lock-closed" size={14} color="#666" style={{ marginLeft: 12 }} />
                  <Text style={styles.groupMetaText}>{t('privateGroup').split(' - ')[0]}</Text>
                </>
              )}
            </View>
          </View>
        </View>
        
        {!isMember && (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={(e) => {
              e.stopPropagation();
              handleJoinGroup(group.id);
            }}
          >
            <Text style={styles.joinButtonText}>{t('joinGroup')}</Text>
          </TouchableOpacity>
        )}
        
        {isCreator && (
          <View style={styles.creatorBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#fff" />
            <Text style={styles.creatorBadgeText}>{t('creator')}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('groups')}</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <Ionicons name="add-circle" size={28} color="#007AFF" />
        </Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myGroups' && styles.activeTab]}
          onPress={() => setActiveTab('myGroups')}
        >
          <Text style={[styles.tabText, activeTab === 'myGroups' && styles.activeTabText]}>
            {t('myGroups')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
          onPress={() => setActiveTab('discover')}
        >
          <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
            {t('discoverGroups')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'myGroups' && myGroups.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>{t('noGroupsYet')}</Text>
            <TouchableOpacity
              style={styles.createFirstButton}
              onPress={() => setCreateModalVisible(true)}
            >
              <Text style={styles.createFirstButtonText}>{t('createFirstGroup')}</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {activeTab === 'myGroups' && myGroups.map((group) => renderGroupCard(group, true))}
        {activeTab === 'discover' && discoverGroups.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>{t('noGroups')}</Text>
          </View>
        )}
        {activeTab === 'discover' && discoverGroups.map((group) => renderGroupCard(group, false))}
      </ScrollView>

      {/* Create Group Modal */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('createGroup')}</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder={t('groupName')}
              value={groupName}
              onChangeText={setGroupName}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('groupDescription')}
              value={groupDescription}
              onChangeText={setGroupDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.switchContainer}>
              <View>
                <Text style={styles.switchLabel}>{t('groupPrivacy')}</Text>
                <Text style={styles.switchSubLabel}>
                  {requiresApproval ? t('privateGroup') : t('publicGroup')}
                </Text>
              </View>
              <Switch
                value={requiresApproval}
                onValueChange={setRequiresApproval}
                trackColor={{ false: '#767577', true: '#007AFF' }}
              />
            </View>

            <TouchableOpacity style={styles.createGroupButton} onPress={handleCreateGroup}>
              <Text style={styles.createGroupButtonText}>{t('createGroup')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  createButton: {
    padding: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  groupIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupMetaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  joinButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  creatorBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  creatorBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  switchSubLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  createGroupButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createGroupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
