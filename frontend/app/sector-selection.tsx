import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation, useLanguageStore, Language } from '../store/languageStore';
import { useSectorStore, sectors, SectorId } from '../store/sectorStore';
import ComingSoonModal from '../components/ComingSoonModal';

export default function SectorSelection() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { setLanguage } = useLanguageStore();
  const { setCurrentSector } = useSectorStore();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedInactiveSector, setSelectedInactiveSector] = useState<{
    name: string;
    icon: string;
  } | null>(null);

  const languages = [
    { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
    { code: 'tr' as Language, name: 'Türkçe', flag: '🇹🇷' },
    { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
  ];

  const currentLanguage = languages.find(l => l.code === language) || languages[0];

  const handleLanguageChange = async (languageCode: Language) => {
    await setLanguage(languageCode);
    setShowLanguageModal(false);
  };

  const handleSectorPress = async (sectorId: SectorId, isActive: boolean, nameKey: string, icon: string) => {
    if (isActive) {
      // Active sector - save and navigate
      await setCurrentSector(sectorId);
      router.replace('/(auth)/login');
    } else {
      // Coming soon - show modal
      setSelectedInactiveSector({ name: t(nameKey as any), icon });
      setShowComingSoon(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Language Button */}
        <TouchableOpacity 
          style={styles.languageButton}
          onPress={() => setShowLanguageModal(true)}
        >
          <Text style={styles.languageFlag}>{currentLanguage.flag}</Text>
          <Text style={styles.languageName}>{currentLanguage.name}</Text>
          <Ionicons name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>

        <Text style={styles.logo}>🏢 Topicx</Text>
        <Text style={styles.title}>{t('chooseYourCommunity')}</Text>
        <Text style={styles.subtitle}>{t('multiSectorPlatform')}</Text>
      </View>

      {/* Sector Grid */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      >
        {sectors.map((sector) => (
          <TouchableOpacity
            key={sector.id}
            style={[
              styles.card,
              sector.isActive && styles.cardActive,
              !sector.isActive && styles.cardInactive,
            ]}
            onPress={() => handleSectorPress(sector.id, sector.isActive, sector.nameKey, sector.icon)}
            activeOpacity={0.7}
          >
            {/* Icon */}
            <Text style={styles.cardIcon}>{sector.icon}</Text>

            {/* Name */}
            <Text style={[
              styles.cardName,
              !sector.isActive && styles.cardNameInactive
            ]}>
              {t(sector.nameKey as any)}
            </Text>

            {/* Status Badge */}
            {sector.isActive ? (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>✓ {t('activeNow')}</Text>
              </View>
            ) : (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>🔒 {t('comingSoon')}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Coming Soon Modal */}
      {selectedInactiveSector && (
        <ComingSoonModal
          visible={showComingSoon}
          sectorName={selectedInactiveSector.name}
          sectorIcon={selectedInactiveSector.icon}
          onClose={() => {
            setShowComingSoon(false);
            setSelectedInactiveSector(null);
          }}
        />
      )}

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={styles.languageModalContainer}>
            <Text style={styles.languageModalTitle}>Select Language</Text>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  language === lang.code && styles.languageOptionActive
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <Text style={styles.languageOptionFlag}>{lang.flag}</Text>
                <Text style={[
                  styles.languageOptionText,
                  language === lang.code && styles.languageOptionTextActive
                ]}>
                  {lang.name}
                </Text>
                {language === lang.code && (
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 2 columns with spacing

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  languageFlag: {
    fontSize: 20,
  },
  languageName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: cardWidth,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardActive: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  cardInactive: {
    opacity: 0.7,
  },
  cardIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
    height: 40, // Fixed height for consistent layout
  },
  cardNameInactive: {
    color: '#999',
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  comingSoonBadge: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
  },
});
