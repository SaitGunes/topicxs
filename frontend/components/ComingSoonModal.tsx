import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../store/languageStore';

interface ComingSoonModalProps {
  visible: boolean;
  sectorName: string;
  sectorIcon: string;
  onClose: () => void;
}

export default function ComingSoonModal({
  visible,
  sectorName,
  sectorIcon,
  onClose,
}: ComingSoonModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{t('comingSoonTitle')}</Text>

          {/* Sector Info */}
          <View style={styles.sectorInfo}>
            <Text style={styles.sectorIcon}>{sectorIcon}</Text>
            <Text style={styles.sectorName}>{sectorName}</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>{t('comingSoonDescription')}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.notifyButton}>
              <Ionicons name="notifications-outline" size={20} color="#fff" />
              <Text style={styles.notifyButtonText}>{t('comingSoonNotify')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>{t('comingSoonMaybeLater')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: width - 60,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  sectorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  sectorIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  sectorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
  },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  notifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  notifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});