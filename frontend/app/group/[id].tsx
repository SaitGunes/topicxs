import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
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

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGroup();
  }, [id]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroup();
    setRefreshing(false);
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

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.groupInfo}>
          <View style={styles.groupIcon}>
            <Ionicons name="people" size={48} color="#007AFF" />
          </View>
          
          <Text style={styles.groupName}>{group.name}</Text>
          
          {group.description && (
            <Text style={styles.groupDescription}>{group.description}</Text>
          )}

          <View style={styles.groupMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={20} color="#666" />
              <Text style={styles.metaText}>
                {group.member_ids.length} {t('members')}
              </Text>
            </View>
            
            <View style={styles.metaItem}>
              <Ionicons 
                name={group.requires_approval ? 'lock-closed' : 'lock-open'} 
                size={20} 
                color="#666" 
              />
              <Text style={styles.metaText}>
                {group.requires_approval ? t('privateGroup').split(' - ')[0] : t('publicGroup').split(' - ')[0]}
              </Text>
            </View>
          </View>

          {isCreator && (
            <View style={styles.creatorBadge}>
              <Ionicons name="shield-checkmark" size={16} color="#fff" />
              <Text style={styles.creatorBadgeText}>{t('creator')}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('groupPosts')}</Text>
          <View style={styles.comingSoon}>
            <Ionicons name="document-text-outline" size={48} color="#ccc" />
            <Text style={styles.comingSoonText}>Coming soon: Group posts will appear here</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('members')} ({group.member_ids.length})</Text>
          <View style={styles.comingSoon}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.comingSoonText}>Coming soon: Member list will appear here</Text>
          </View>
        </View>

        {isCreator && group.requires_approval && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('joinRequests')}</Text>
            <View style={styles.comingSoon}>
              <Ionicons name="mail-outline" size={48} color="#ccc" />
              <Text style={styles.comingSoonText}>Coming soon: Join requests will appear here</Text>
            </View>
          </View>
        )}

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  backButton: { padding: 4 },
  title: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginHorizontal: 16 },
  headerRight: { width: 32 },
  content: { flex: 1 },
  groupInfo: { backgroundColor: '#fff', padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  groupIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  groupName: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 8 },
  groupDescription: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16 },
  groupMeta: { flexDirection: 'row', gap: 24 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14, color: '#666' },
  creatorBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginTop: 16, gap: 4 },
  creatorBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  section: { backgroundColor: '#fff', padding: 16, marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 },
  comingSoon: { alignItems: 'center', paddingVertical: 32 },
  comingSoonText: { fontSize: 14, color: '#999', marginTop: 12, textAlign: 'center' },
  actions: { padding: 16, gap: 12, marginBottom: 32 },
  leaveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF9800', padding: 16, borderRadius: 8, gap: 8 },
  leaveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F44336', padding: 16, borderRadius: 8, gap: 8 },
  deleteButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
