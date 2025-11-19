import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useSectorStore } from '../store/sectorStore';
import { useRouter } from 'expo-router';
import api from '../utils/api';

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

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { currentSector } = useSectorStore();
  
  const [selectedUserTypes, setSelectedUserTypes] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.sector_info?.[currentSector]?.user_types) {
      setSelectedUserTypes(user.sector_info[currentSector].user_types);
    }
    if (user?.sector_info?.[currentSector]?.phone_number) {
      setPhoneNumber(user.sector_info[currentSector].phone_number);
    }
  }, [user, currentSector]);

  const toggleUserType = (typeId: string) => {
    if (selectedUserTypes.includes(typeId)) {
      // Remove
      setSelectedUserTypes(selectedUserTypes.filter(id => id !== typeId));
    } else {
      // Add (max 5)
      if (selectedUserTypes.length >= 5) {
        Alert.alert('Limit Reached', 'You can select maximum 5 user types');
        return;
      }
      setSelectedUserTypes([...selectedUserTypes, typeId]);
    }
  };

  const handleSave = async () => {
    if (selectedUserTypes.length === 0) {
      Alert.alert('Error', 'Please select at least one user type');
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/api/auth/me', {
        sector_info: {
          ...user?.sector_info,
          [currentSector]: {
            user_types: selectedUserTypes,
            phone_number: phoneNumber.trim() || undefined,
          }
        }
      });
      
      setUser(response.data);
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile Info</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Sector Badge */}
        <View style={styles.sectorBadge}>
          <Ionicons name="business" size={20} color="#007AFF" />
          <Text style={styles.sectorText}>
            {currentSector === 'drivers' ? 'Drivers' : 
             currentSector === 'sports' ? 'Sports' : currentSector} Sector
          </Text>
        </View>

        {/* User Types Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            What do you do? (Select up to 5)
          </Text>
          <Text style={styles.sectionSubtitle}>
            {selectedUserTypes.length}/5 selected
          </Text>

          {DRIVER_USER_TYPES.map((type) => {
            const isSelected = selectedUserTypes.includes(type.id);
            return (
              <TouchableOpacity
                key={type.id}
                style={[styles.userTypeItem, isSelected && styles.userTypeItemSelected]}
                onPress={() => toggleUserType(type.id)}
              >
                <View style={styles.userTypeLeft}>
                  <Ionicons 
                    name={type.icon as any} 
                    size={24} 
                    color={isSelected ? '#007AFF' : '#666'} 
                  />
                  <Text style={[styles.userTypeLabel, isSelected && styles.userTypeLabelSelected]}>
                    {type.label}
                  </Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Phone Number Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phone Number (Optional)</Text>
          <Text style={styles.sectionSubtitle}>
            Add your phone number for better communication
          </Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="+90 5XX XXX XX XX"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>

        {/* Info Note */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <Text style={styles.infoText}>
            Your profile information helps other members in the {currentSector} sector connect with you better.
          </Text>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  sectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  userTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  userTypeItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  userTypeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userTypeLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  userTypeLabelSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0277BD',
    marginLeft: 12,
    lineHeight: 20,
  },
});
