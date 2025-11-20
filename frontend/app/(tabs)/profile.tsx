import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Share } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useSectorStore } from '../../store/sectorStore';
import { useTranslation } from '../../store/languageStore';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../../utils/api';

// Drivers sector için user type listesi
const DRIVER_USER_TYPES = [
  { id: 'professional_driver', label: 'Professional Driver', icon: 'briefcase' },
  { id: 'taxi_driver', label: 'Taxi Driver', icon: 'car' },
  { id: 'rideshare_driver', label: 'Uber/Lyft Driver', icon: 'phone-portrait' },
  { id: 'truck_driver', label: 'Truck Driver', icon: 'bus' },
  { id: 'bus_driver', label: 'Bus Driver', icon: 'bus' },
  { id: 'private_chauffeur', label: 'Private Chauffeur', icon: 'car-sport' },
  { id: 'delivery_driver', label: 'Delivery/Courier Driver', icon: 'bicycle' },
  { id: 'ambulance_driver', label: 'Ambulance Driver', icon: 'medkit' },
  { id: 'construction_operator', label: 'Construction Vehicle Operator', icon: 'construct' },
  { id: 'driving_instructor', label: 'Driving Instructor', icon: 'school' },
  { id: 'fleet_manager', label: 'Fleet Manager', icon: 'people' },
  { id: 'mechanic', label: 'Mechanic/Auto Technician', icon: 'build' },
  { id: 'auto_dealer', label: 'Auto Dealer/Salesperson', icon: 'pricetag' },
  { id: 'transportation_coordinator', label: 'Transportation Coordinator', icon: 'map' },
  { id: 'regular_driver', label: 'Regular Driver (Hobby)', icon: 'car' },
  { id: 'none_listed', label: 'None listed here', icon: 'add-circle-outline' },
];

// Sports sector için user type listesi
const SPORTS_USER_TYPES = [
  { id: 'professional_athlete', label: 'Professional Athlete', icon: 'trophy' },
  { id: 'amateur_athlete', label: 'Amateur Athlete', icon: 'person' },
  { id: 'coach', label: 'Coach/Trainer', icon: 'school' },
  { id: 'sports_manager', label: 'Sports Manager', icon: 'briefcase' },
  { id: 'fitness_instructor', label: 'Fitness Instructor', icon: 'fitness' },
  { id: 'personal_trainer', label: 'Personal Trainer', icon: 'barbell' },
  { id: 'sports_journalist', label: 'Sports Journalist', icon: 'newspaper' },
  { id: 'sports_photographer', label: 'Sports Photographer', icon: 'camera' },
  { id: 'referee', label: 'Referee/Umpire', icon: 'flag' },
  { id: 'sports_medicine', label: 'Sports Medicine Professional', icon: 'medical' },
  { id: 'nutritionist', label: 'Nutritionist/Dietitian', icon: 'restaurant' },
  { id: 'physical_therapist', label: 'Physical Therapist', icon: 'bandage' },
  { id: 'sports_psychologist', label: 'Sports Psychologist', icon: 'happy' },
  { id: 'sports_equipment_dealer', label: 'Sports Equipment Dealer', icon: 'basket' },
  { id: 'gym_owner', label: 'Gym/Facility Owner', icon: 'business' },
  { id: 'fitness_enthusiast', label: 'Fitness Enthusiast (Hobby)', icon: 'heart' },
  { id: 'none_listed', label: 'None listed here', icon: 'add-circle-outline' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const { t } = useTranslation();
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
      Alert.alert(t('error'), t('logoutError'));
    }
  };

  const handleChangeProfilePicture = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,  // Keep editing for profile picture (circular display)
        aspect: [1, 1],  // Keep square aspect for profile picture
        quality: 0.7,  // Better quality
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setUploading(true);
        const imageBase64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        const response = await api.put('/api/auth/me', {
          profile_picture: imageBase64,
        });
        
        setUser(response.data);
        Alert.alert(t('success'), t('profilePictureUpdated'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(t('error'), t('failedUpdatePicture'));
    } finally {
      setUploading(false);
    }
  };

  const handleShareReferral = async () => {
    if (!user?.referral_code) return;
    
    const referralLink = `driverschat://register?ref=${user.referral_code}`;
    const message = `Join me on Drivers Chat! Use my referral code: ${user.referral_code}\n\nSign up here: ${referralLink}`;
    
    try {
      await Share.share({
        message: message,
        title: 'Join Drivers Chat',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile')}</Text>
      </View>

      <View style={styles.profileSection}>
        <TouchableOpacity 
          style={styles.profileImageContainer}
          onPress={handleChangeProfilePicture}
          disabled={uploading}
        >
          {user.profile_picture ? (
            <Image source={{ uri: user.profile_picture }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, styles.profilePlaceholder]}>
              <Ionicons name="person" size={48} color="#999" />
            </View>
          )}
          {uploading ? (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : (
            <View style={styles.editIconContainer}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.fullName}>{user.full_name}</Text>
        <View style={styles.usernameRow}>
          <Text style={styles.username}>@{user.username}</Text>
          {user.email_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            </View>
          )}
        </View>
        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        
        {/* Star Rating Badge */}
        {user.star_level && (
          <View style={styles.starBadge}>
            <View style={styles.starRow}>
              {[...Array(5)].map((_, index) => (
                <Text key={index} style={styles.starIcon}>
                  {index < user.star_level.stars ? '⭐' : '☆'}
                </Text>
              ))}
            </View>
            <Text style={styles.levelName}>{user.star_level.level_name}</Text>
            {user.star_level.remaining_referrals > 0 && (
              <Text style={styles.progressText}>
                {t('nextStarIn')} {user.star_level.remaining_referrals} {t('referrals')}
              </Text>
            )}
          </View>
        )}
        
        {user.referral_code && (
          <View style={styles.referralCard}>
            <Text style={styles.referralLabel}>{t('yourReferralCode')}</Text>
            <Text style={styles.referralCode}>{user.referral_code}</Text>
            <Text style={styles.referralCount}>
              {user.referral_count || 0} {t('peopleJoined')}
            </Text>
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={handleShareReferral}
            >
              <Ionicons name="share-social-outline" size={20} color="#fff" />
              <Text style={styles.shareButtonText}>{t('shareReferralCode')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push(`/profile/${user.id}`)}
        >
          <Ionicons name="person-outline" size={24} color="#007AFF" />
          <Text style={styles.menuText}>{t('viewMyProfile')}</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/edit-profile')}
        >
          <Ionicons name="briefcase-outline" size={24} color="#007AFF" />
          <Text style={styles.menuText}>{t('myProfessionsWorkplace')}</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        {user.is_admin && (
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/admin')}
          >
            <Ionicons name="shield-checkmark" size={24} color="#9C27B0" />
            <Text style={styles.menuText}>{t('adminPanel')}</Text>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#007AFF" />
          <Text style={styles.menuText}>{t('settings')}</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/help')}
        >
          <Ionicons name="help-circle-outline" size={24} color="#007AFF" />
          <Text style={styles.menuText}>{t('help')}</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/about')}
        >
          <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
          <Text style={styles.menuText}>{t('about')}</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        <Text style={styles.logoutText}>{t('signOut')}</Text>
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
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  username: {
    fontSize: 16,
    color: '#666',
  },
  verifiedBadge: {
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  userTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    gap: 6,
  },
  userTypeText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  starBadge: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  starRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 4,
  },
  starIcon: {
    fontSize: 28,
  },
  levelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
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
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
