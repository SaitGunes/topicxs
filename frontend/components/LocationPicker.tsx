import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Dimensions, Linking } from 'react-native';
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

const { width, height } = Dimensions.get('window');

export default function LocationPicker({ onLocationSelected, onCancel }: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('İzin Reddedildi', 'Konum paylaşmak için lütfen konum erişimine izin verin.');
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
      Alert.alert('Hata', 'Konum alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectType = (type: string) => {
    if (!currentLocation) {
      Alert.alert('Önce Konum Alın', 'Lütfen önce "Konumumu Al" butonuna basın');
      return;
    }

    setSelectedType(type);
    const locationData: LocationData = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      location_type: type,
      description: LOCATION_TYPES.find(t => t.type === type)?.label,
    };

    onLocationSelected(locationData);
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setCurrentLocation({ latitude, longitude });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Konum & Yol Durumu Paylaş</Text>
        <TouchableOpacity onPress={onCancel}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Konum alınıyor...</Text>
          </View>
        ) : currentLocation ? (
          <>
            <View style={styles.locationCard}>
              <View style={styles.locationCardHeader}>
                <Ionicons name="location" size={32} color="#007AFF" />
                <Text style={styles.locationCardTitle}>Mevcut Konum</Text>
              </View>
              
              <View style={styles.coordinatesBox}>
                <View style={styles.coordRow}>
                  <Text style={styles.coordLabel}>Enlem:</Text>
                  <Text style={styles.coordValue}>{currentLocation.latitude.toFixed(6)}</Text>
                </View>
                <View style={styles.coordRow}>
                  <Text style={styles.coordLabel}>Boylam:</Text>
                  <Text style={styles.coordValue}>{currentLocation.longitude.toFixed(6)}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.viewMapButton}
                onPress={() => {
                  const url = `https://www.google.com/maps/search/?api=1&query=${currentLocation.latitude},${currentLocation.longitude}`;
                  Linking.openURL(url);
                }}
              >
                <Ionicons name="map" size={20} color="#007AFF" />
                <Text style={styles.viewMapText}>Haritada Görüntüle</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.refreshButton}
                onPress={getCurrentLocation}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.refreshButtonText}>Konumu Yenile</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.roadStatusSection}>
              <Text style={styles.sectionTitle}>Yol Durumunu Seçin:</Text>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.typesContainer}
                contentContainerStyle={styles.typesContentContainer}
              >
                {LOCATION_TYPES.map((item) => (
                  <TouchableOpacity
                    key={item.type}
                    style={[
                      styles.typeButton,
                      { borderColor: item.color },
                      selectedType === item.type && { backgroundColor: item.color + '20' }
                    ]}
                    onPress={() => handleSelectType(item.type)}
                  >
                    <Ionicons name={item.icon as any} size={28} color={item.color} />
                    <Text style={[styles.typeLabel, { color: item.color }]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.helpText}>
                👆 Yol durumunu seçmek için yukarıdaki butonlara dokunun
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="location-outline" size={64} color="#ccc" />
            <Text style={styles.errorText}>Konum alınamadı</Text>
            <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
              <Text style={styles.retryText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  locationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  locationCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  coordinatesBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  coordLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  coordValue: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    marginBottom: 12,
  },
  viewMapText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  roadStatusSection: {
    backgroundColor: '#fff',
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  typesContainer: {
    marginBottom: 12,
  },
  typesContentContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  typeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
    minWidth: 110,
    gap: 8,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    lineHeight: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  webMapPlaceholder: {
    height: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    gap: 16,
    padding: 24,
  },
  webMapText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  getLocationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
