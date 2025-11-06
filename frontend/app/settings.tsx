import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Switch, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import { useNotificationStore } from '../store/notificationStore';
import { useTranslation } from '../store/languageStore';
import api from '../utils/api';
import { updateNotificationPreferences } from '../utils/notifications';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const { preferences, setPreferences, loadPreferences, expoPushToken } = useNotificationStore();
  const { t } = useTranslation();
  
  // Profile Edit Modal
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [email, setEmail] = useState(user?.email || '');
  const [updating, setUpdating] = useState(false);

  // Password Change Modal
  const [passwordModal, setPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Language Modal
  const [languageModal, setLanguageModal] = useState(false);

  // Notification Settings - synced with store
  const [friendRequestNotif, setFriendRequestNotif] = useState(preferences.friend_requests);
  const [messageNotif, setMessageNotif] = useState(preferences.messages);
  const [likeNotif, setLikeNotif] = useState(preferences.likes);
  const [commentNotif, setCommentNotif] = useState(preferences.comments);

  // Delete Account Modal
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Load notification preferences on mount
  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  // Sync local state with store
  useEffect(() => {
    setFriendRequestNotif(preferences.friend_requests);
    setMessageNotif(preferences.messages);
    setLikeNotif(preferences.likes);
    setCommentNotif(preferences.comments);
  }, [preferences]);

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert(t('error'), t('settingsNameCannotEmpty'));
      return;
    }

    setUpdating(true);
    try {
      const response = await api.put('/api/auth/me', {
        full_name: fullName,
        bio: bio,
      });
      
      setUser(response.data);
      Alert.alert(t('success'), t('settingsProfileUpdated'));
      setEditProfileModal(false);
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert(t('error'), t('settingsFailedUpdateProfile'));
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      
      Alert.alert('Success', 'Password changed successfully!');
      setPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password change error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    try {
      await api.delete('/api/auth/me');
      Alert.alert('Account Deleted', 'Your account has been permanently deleted');
      await logout();
      router.replace('/');
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ];

  const getLanguageName = () => {
    const lang = languages.find(l => l.code === language);
    return lang ? lang.name : 'English';
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setEditProfileModal(true)}
          >
            <Ionicons name="person-outline" size={22} color="#007AFF" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Edit Profile</Text>
              <Text style={styles.settingSubtext}>Name, Bio</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setPasswordModal(true)}
          >
            <Ionicons name="lock-closed-outline" size={22} color="#007AFF" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Change Password</Text>
              <Text style={styles.settingSubtext}>Update your password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <Ionicons name="people-outline" size={22} color="#007AFF" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Friend Requests</Text>
              <Text style={styles.settingSubtext}>Get notified of new requests</Text>
            </View>
            <Switch
              value={friendRequestNotif}
              onValueChange={setFriendRequestNotif}
              trackColor={{ false: '#ccc', true: '#007AFF' }}
            />
          </View>

          <View style={styles.settingItem}>
            <Ionicons name="chatbubble-outline" size={22} color="#007AFF" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Messages</Text>
              <Text style={styles.settingSubtext}>Get notified of new messages</Text>
            </View>
            <Switch
              value={messageNotif}
              onValueChange={setMessageNotif}
              trackColor={{ false: '#ccc', true: '#007AFF' }}
            />
          </View>

          <View style={styles.settingItem}>
            <Ionicons name="thumbs-up-outline" size={22} color="#007AFF" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Likes</Text>
              <Text style={styles.settingSubtext}>Get notified when someone likes your post</Text>
            </View>
            <Switch
              value={likeNotif}
              onValueChange={setLikeNotif}
              trackColor={{ false: '#ccc', true: '#007AFF' }}
            />
          </View>
        </View>

        {/* General Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setLanguageModal(true)}
          >
            <Ionicons name="language-outline" size={22} color="#007AFF" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Language</Text>
              <Text style={styles.settingSubtext}>{getLanguageName()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <Ionicons name="moon-outline" size={22} color="#999" />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingText, styles.disabledText]}>Dark Mode</Text>
              <Text style={styles.settingSubtext}>Coming soon</Text>
            </View>
            <Switch
              value={false}
              disabled={true}
              trackColor={{ false: '#ccc', true: '#007AFF' }}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, styles.dangerItem]}
            onPress={() => setDeleteModal(true)}
          >
            <Ionicons name="trash-outline" size={22} color="#FF3B30" />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingText, styles.dangerText]}>Delete Account</Text>
              <Text style={styles.settingSubtext}>Permanently delete your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Drivers Chat v1.0</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editProfileModal}
        animationType="slide"
        onRequestClose={() => setEditProfileModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditProfileModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleUpdateProfile} disabled={updating}>
              <Text style={[styles.saveButton, updating && styles.disabledButton]}>
                {updating ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your name"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Email (Read-only)</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={email}
              editable={false}
              placeholderTextColor="#999"
            />
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </ScrollView>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModal}
        animationType="slide"
        onRequestClose={() => setPasswordModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPasswordModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={handleChangePassword} disabled={changingPassword}>
              <Text style={[styles.saveButton, changingPassword && styles.disabledButton]}>
                {changingPassword ? 'Changing...' : 'Change'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor="#999"
              secureTextEntry
            />

            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor="#999"
              secureTextEntry
            />

            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              placeholderTextColor="#999"
              secureTextEntry
            />

            <Text style={styles.helperText}>Password must be at least 6 characters</Text>
          </ScrollView>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal
        visible={languageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLanguageModal(false)}
      >
        <View style={styles.centeredModal}>
          <View style={styles.languageModal}>
            <Text style={styles.languageModalTitle}>Select Language</Text>
            
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={styles.languageItem}
                onPress={async () => {
                  await setLanguage(lang.code as 'en' | 'tr' | 'es');
                  setLanguageModal(false);
                  Alert.alert('Language Changed', `Language set to ${lang.name}`);
                }}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text style={styles.languageName}>{lang.name}</Text>
                {language === lang.code && (
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.languageCancelButton}
              onPress={() => setLanguageModal(false)}
            >
              <Text style={styles.languageCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteModal(false)}
      >
        <View style={styles.centeredModal}>
          <View style={styles.deleteModal}>
            <View style={styles.deleteIconContainer}>
              <Ionicons name="warning" size={48} color="#FF3B30" />
            </View>

            <Text style={styles.deleteTitle}>Delete Account?</Text>
            <Text style={styles.deleteMessage}>
              This action cannot be undone. All your posts, messages, and data will be permanently deleted.
            </Text>

            <Text style={styles.deleteInstructions}>
              Type <Text style={styles.deleteBold}>DELETE</Text> to confirm:
            </Text>

            <TextInput
              style={styles.deleteInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="Type DELETE here"
              placeholderTextColor="#999"
              autoCapitalize="characters"
            />

            <View style={styles.deleteButtons}>
              <TouchableOpacity
                style={styles.deleteCancelButton}
                onPress={() => {
                  setDeleteModal(false);
                  setDeleteConfirmText('');
                }}
              >
                <Text style={styles.deleteCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteConfirmButton,
                  deleteConfirmText !== 'DELETE' && styles.deleteConfirmButtonDisabled
                ]}
                onPress={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== 'DELETE'}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.deleteConfirmText}>Delete Forever</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 2,
  },
  settingSubtext: {
    fontSize: 13,
    color: '#999',
  },
  disabledText: {
    color: '#999',
  },
  dangerSection: {
    borderWidth: 1,
    borderColor: '#FFE5E5',
    marginHorizontal: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  dangerTitle: {
    color: '#FF3B30',
  },
  dangerItem: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: '#f9f9f9',
    color: '#999',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  centeredModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  languageModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    padding: 16,
  },
  languageModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageFlag: {
    fontSize: 32,
    marginRight: 12,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  languageCancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  languageCancelText: {
    fontSize: 16,
    color: '#666',
  },
  deleteModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '85%',
    padding: 24,
  },
  deleteIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  deleteMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  deleteInstructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  deleteBold: {
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  deleteInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 20,
  },
  deleteButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    alignItems: 'center',
  },
  deleteCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  deleteConfirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    marginLeft: 8,
    alignItems: 'center',
  },
  deleteConfirmButtonDisabled: {
    opacity: 0.5,
  },
  deleteConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
