import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import { useSectorStore } from '../store/sectorStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TermsModal from '../components/TermsModal';

export default function Index() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const { loadLanguage } = useLanguageStore();
  const { currentSector, loadCurrentSector } = useSectorStore();
  const [showTerms, setShowTerms] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [sectorChecked, setSectorChecked] = useState(false);

  useEffect(() => {
    loadLanguage(); // Load saved language
    loadCurrentSector(); // Load saved sector
    checkTermsAcceptance();
  }, []);

  useEffect(() => {
    // Set sectorChecked to true after currentSector is loaded
    setSectorChecked(true);
  }, [currentSector]);

  const checkTermsAcceptance = async () => {
    try {
      const accepted = await AsyncStorage.getItem('termsAccepted');
      if (accepted === 'true') {
        setTermsChecked(true);
      } else if (!isLoading && user) {
        // User logged in but hasn't accepted terms
        setShowTerms(true);
      }
      setTermsChecked(true);
    } catch (error) {
      console.error('Error checking terms:', error);
      setTermsChecked(true);
    }
  };

  const handleTermsAccept = async () => {
    try {
      await AsyncStorage.setItem('termsAccepted', 'true');
      setShowTerms(false);
      setTermsChecked(true);
    } catch (error) {
      console.error('Error saving terms acceptance:', error);
    }
  };

  useEffect(() => {
    if (!isLoading && termsChecked && sectorChecked) {
      // Check if sector is selected
      if (!currentSector) {
        // No sector selected - show sector selection
        router.replace('/sector-selection');
      } else if (user) {
        // Sector selected and user logged in - go to home
        router.replace('/(tabs)/home');
      } else {
        // Sector selected but not logged in - go to login
        router.replace('/(auth)/login');
      }
    }
  }, [user, isLoading, termsChecked, sectorChecked, currentSector]);

  return (
    <>
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
      <TermsModal visible={showTerms} onAccept={handleTermsAccept} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
