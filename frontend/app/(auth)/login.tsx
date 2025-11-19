import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../store/languageStore';
import { useSectorStore } from '../../store/sectorStore';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const { clearSector, currentSector } = useSectorStore();
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBackToSectors = async () => {
    await clearSector();
    router.replace('/sector-selection');
  };

  // Get current sector info
  const sectorInfo = {
    drivers: { icon: '🚗', name: t('sectorDrivers') },
    sports: { icon: '⚽', name: t('sectorSports') },
    science: { icon: '🔬', name: t('sectorScience') },
    construction: { icon: '🏗️', name: t('sectorConstruction') },
    finance: { icon: '💰', name: t('sectorFinance') },
    tourism: { icon: '🎭', name: t('sectorTourism') },
    food: { icon: '🍔', name: t('sectorFood') },
    health: { icon: '💊', name: t('sectorHealth') },
    music: { icon: '🎵', name: t('sectorMusic') },
    gaming: { icon: '🎮', name: t('sectorGaming') },
  };

  const currentSectorInfo = sectorInfo[currentSector || 'drivers'];

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      await login(username, password, currentSector || 'drivers');
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert(t('error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back to Sectors Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackToSectors}
        >
          <Ionicons name="arrow-back" size={20} color="#007AFF" />
          <Text style={styles.backButtonText}>{t('changeSector')}</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.platformLogo}>🏢 Topicx</Text>
          <View style={styles.sectorBadge}>
            <Text style={styles.sectorIcon}>{currentSectorInfo.icon}</Text>
            <Text style={styles.sectorName}>{currentSectorInfo.name}</Text>
          </View>
          <Text style={styles.subtitle}>{t('login')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('username')}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '...' : t('login')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.forgotButton}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={styles.forgotText}>{t('forgotPassword')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.linkText}>{t('dontHaveAccount')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.linkButton, { marginTop: 8 }]}
            onPress={() => router.push('/about')}
          >
            <Text style={[styles.linkText, { color: '#666' }]}>{t('aboutApp')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  platformLogo: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  sectorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectorIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  sectorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#000',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  forgotButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotText: {
    color: '#666',
    fontSize: 14,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  languageFlag: {
    fontSize: 18,
    marginRight: 6,
  },
  languageName: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
});
