import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../../utils/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const [uploading, setUploading] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      // Force full reload to clear all state
      setTimeout(() => {
        router.replace('/');
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleChangeProfilePicture = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setUploading(true);
        const imageBase64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        const response = await api.put('/api/auth/me', {
          profile_picture: imageBase64,
        });
        
        setUser(response.data);
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

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
        
        {user.referral_code && (
          <View style={styles.referralCard}>
            <Text style={styles.referralLabel}>Your Referral Code</Text>
            <Text style={styles.referralCode}>{user.referral_code}</Text>
            <Text style={styles.referralCount}>
              {user.referral_count || 0} people joined with your code
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push(`/profile/${user.id}`)}
        >
          <Ionicons name="person-outline" size={24} color="#007AFF" />
          <Text style={styles.menuText}>View My Profile</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => Alert.alert('Settings', 'Settings page coming soon!')}
        >
          <Ionicons name="settings-outline" size={24} color="#007AFF" />
          <Text style={styles.menuText}>Settings</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => Alert.alert('Help', 'Help center coming soon!')}
        >
          <Ionicons name="help-circle-outline" size={24} color="#007AFF" />
          <Text style={styles.menuText}>Help</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => Alert.alert('About', 'Driver Forum v1.0\nWhere drivers connect')}
        >
          <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
          <Text style={styles.menuText}>About</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
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
  profileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 32,
    marginBottom: 16,
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
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 32,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
    marginLeft: 8,
  },
  referralCard: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  referralLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  referralCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 8,
  },
  referralCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
});
