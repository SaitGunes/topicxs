import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from '../store/languageStore';

export default function AboutScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('about')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="car" size={48} color="#007AFF" />
          </View>
          <Text style={styles.appName}>Drivers Chat</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.tagline}>{t('aboutWherDriversConnect')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('aboutTheApp')}</Text>
          <Text style={styles.text}>
            {t('aboutAppDescription')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('aboutOurMission')}</Text>
          <Text style={styles.text}>
            {t('aboutMissionDescription')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('aboutKeyFeatures')}</Text>
          <View style={styles.featureItem}>
            <Ionicons name="people" size={20} color="#007AFF" />
            <Text style={styles.featureText}>{t('aboutFeature1')}</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="chatbubbles" size={20} color="#007AFF" />
            <Text style={styles.featureText}>{t('aboutFeature2')}</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="newspaper" size={20} color="#007AFF" />
            <Text style={styles.featureText}>{t('aboutFeature3')}</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="heart" size={20} color="#007AFF" />
            <Text style={styles.featureText}>{t('aboutFeature4')}</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="gift" size={20} color="#007AFF" />
            <Text style={styles.featureText}>{t('aboutFeature5')}</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={20} color="#007AFF" />
            <Text style={styles.featureText}>{t('aboutFeature6')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('aboutFree')}</Text>
          <Text style={styles.text}>
            {t('aboutFreeDescription')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('aboutCommunityGuidelines')}</Text>
          <Text style={styles.text}>
            {t('aboutGuidelinesDescription')}
          </Text>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => router.push('/terms-view')}
          >
            <Text style={styles.linkText}>{t('aboutReadFullTerms')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('aboutContactSupport')}</Text>
          <Text style={styles.text}>
            {t('aboutContactDescription')}{'\n'}
            {t('aboutEmailUs')} {t('termsSupportEmail')}
          </Text>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => router.push('/help')}
          >
            <Text style={styles.linkText}>{t('aboutVisitHelp')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('aboutLegal')}</Text>
          <TouchableOpacity 
            style={styles.legalItem}
            onPress={() => router.push('/terms-view')}
          >
            <Text style={styles.legalText}>{t('aboutTermsService')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.legalItem}
            onPress={() => router.push('/terms-view')}
          >
            <Text style={styles.legalText}>{t('aboutCommunityGuidelines')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.legalItem}
            onPress={() => router.push('/terms-view')}
          >
            <Text style={styles.legalText}>{t('aboutPrivacyPolicy')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('aboutMadeWith')}
          </Text>
          <Text style={styles.footerText}>
            {t('aboutCopyright')}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  logoSection: {
    backgroundColor: '#fff',
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
  },
  linkButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#E3F2FF',
    borderRadius: 8,
  },
  linkText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  legalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  legalText: {
    fontSize: 16,
    color: '#000',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
});
