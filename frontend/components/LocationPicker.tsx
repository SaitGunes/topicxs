import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  location_type: string;
  description?: string;
}

interface LocationPickerProps {
  onLocationSelected: (location: LocationData) => void;
  onCancel: () => void;
}

const LOCATION_TYPES = [
  { type: 'traffic', icon: 'car', label: 'Heavy Traffic', color: '#FF5722' },
  { type: 'roadwork', icon: 'construct', label: 'Road Work', color: '#FF9800' },
  { type: 'accident', icon: 'warning', label: 'Accident', color: '#F44336' },
  { type: 'closed', icon: 'ban', label: 'Road Closed', color: '#9C27B0' },
  { type: 'police', icon: 'shield-checkmark', label: 'Police', color: '#2196F3' },
];

export default function LocationPicker({ onLocationSelected, onCancel }: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access to share your location.');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      console.log('Location obtained:', location.coords);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectType = (type: string) => {
    if (!currentLocation) {
      Alert.alert('Get Location First', 'Please tap "Get Current Location" button first');
      return;
    }

    const locationData: LocationData = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      location_type: type,
      description: LOCATION_TYPES.find(t => t.type === type)?.label,
    };

    onLocationSelected(locationData);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Share Location & Road Status</Text>
        <TouchableOpacity onPress={onCancel}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.locationSection}>
          <TouchableOpacity
            style={styles.getLocationButton}
            onPress={getCurrentLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="locate" size={20} color="#fff" />
                <Text style={styles.getLocationText}>Get Current Location</Text>
              </>
            )}
          </TouchableOpacity>

          {currentLocation && (
            <View style={styles.locationInfo}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.locationText}>
                Location obtained: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Select Road Status:</Text>

        <ScrollView style={styles.typesContainer}>
          {LOCATION_TYPES.map((item) => (
            <TouchableOpacity
              key={item.type}
              style={[
                styles.typeButton,
                { borderColor: item.color },
                selectedType === item.type && { backgroundColor: item.color + '20' }
              ]}
              onPress={() => handleSelectType(item.type)}
              disabled={!currentLocation}
            >
              <Ionicons name={item.icon as any} size={32} color={item.color} />
              <Text style={[styles.typeLabel, { color: item.color }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.helpText}>
          📍 First, get your current location, then select the road status to share with others.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  locationSection: {
    marginBottom: 24,
  },
  getLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  getLocationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    gap: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    color: '#2E7D32',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  typesContainer: {
    flex: 1,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
    marginBottom: 12,
    gap: 16,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
