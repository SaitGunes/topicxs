import React from 'react';
import { View, Text, StyleSheet, Dimensions, Linking, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Conditionally import expo-maps only for native platforms
let ExpoMap: any = null;
let Marker: any = null;

if (Platform.OS !== 'web') {
  const maps = require('expo-maps');
  ExpoMap = maps.ExpoMap;
  Marker = maps.Marker;
}

interface LocationDisplayProps {
  location: {
    latitude: number;
    longitude: number;
    location_type: string;
    description?: string;
  };
}

const { width } = Dimensions.get('window');

const LOCATION_TYPE_CONFIG: { [key: string]: { icon: any; label: string; color: string } } = {
  traffic: { icon: 'car', label: 'Yoğun Trafik', color: '#FF5722' },
  roadwork: { icon: 'construct', label: 'Yol Çalışması', color: '#FF9800' },
  accident: { icon: 'warning', label: 'Kaza', color: '#F44336' },
  closed: { icon: 'ban', label: 'Yol Kapalı', color: '#9C27B0' },
  police: { icon: 'shield-checkmark', label: 'Polis Kontrolü', color: '#2196F3' },
};

export default function LocationDisplay({ location }: LocationDisplayProps) {
  const config = LOCATION_TYPE_CONFIG[location.location_type] || {
    icon: 'location',
    label: 'Konum',
    color: '#007AFF',
  };

  const openInMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon} size={20} color={config.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.typeLabel, { color: config.color }]}>
            {location.description || config.label}
          </Text>
          <Text style={styles.coords}>
            📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <ExpoMap
          style={styles.map}
          initialCameraPosition={{
            target: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
            zoom: 16,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={config.label}
          />
        </ExpoMap>

        <TouchableOpacity style={styles.openMapButton} onPress={openInMaps}>
          <Ionicons name="navigate" size={16} color="#fff" />
          <Text style={styles.openMapText}>Haritada Aç</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  coords: {
    fontSize: 11,
    color: '#666',
  },
  mapContainer: {
    height: 200,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  openMapButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  openMapText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
