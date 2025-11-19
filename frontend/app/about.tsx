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
            <Ionicons name="business" size={48} color="#007AFF" />
          </View>
          <Text style={styles.appName}>Topicx</Text>
          <Text style={styles.version}>Version 2.0.0</Text>
          <Text style={styles.tagline}>Multi-Sector Community Platform</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Topicx</Text>
          <Text style={styles.text}>
            Topicx is a revolutionary multi-sector community platform that brings together professionals and enthusiasts from various industries. Connect, share knowledge, and grow your network across Drivers, Sports, Science, Finance, and many more sectors - all in one place.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.text}>
            To create a unified platform where professionals from all sectors can connect, collaborate, and share their expertise. We believe in breaking down barriers between industries and fostering cross-sector communication and learning.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Sectors</Text>
          <View style={styles.featureItem}>
            <Text style={styles.sectorIcon}>🚗</Text>
            <Text style={styles.featureText}>Drivers - Professional & Regular Drivers</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.sectorIcon}>⚽</Text>
            <Text style={styles.featureText}>Sports & Fitness Community</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.sectorIcon}>🔬</Text>
            <Text style={styles.featureText}>Science & Research (Coming Soon)</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.sectorIcon}>🏗️</Text>
            <Text style={styles.featureText}>Construction & Engineering (Coming Soon)</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.sectorIcon}>💰</Text>
            <Text style={styles.featureText}>Finance & Investment (Coming Soon)</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.sectorIcon}>🎭</Text>
            <Text style={styles.featureText}>Tourism & Hospitality (Coming Soon)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featureItem}>
            <Ionicons name="people" size={20} color="#007AFF" />
            <Text style={styles.featureText}>Multi-sector communities in one app</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="chatbubbles" size={20} color="#007AFF" />
            <Text style={styles.featureText}>Sector-specific chat rooms and groups</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="newspaper" size={20} color="#007AFF" />
            <Text style={styles.featureText}>Share posts and updates</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="globe" size={20} color="#007AFF" />
            <Text style={styles.featureText}>Cross-sector networking</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={20} color="#007AFF" />
            <Text style={styles.featureText}>Safe and moderated communities</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>100% Free Platform</Text>
          <Text style={styles.text}>
            Topicx is completely FREE with no hidden costs, premium features, or subscriptions. We believe in providing equal access to all community members regardless of their financial situation.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Guidelines</Text>
          <Text style={styles.text}>
            All Topicx communities follow strict guidelines to ensure a safe, respectful, and professional environment. We maintain zero tolerance for harassment, spam, and inappropriate content.
          </Text>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => router.push('/terms-view')}
          >
            <Text style={styles.linkText}>Read Full Terms & Guidelines</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact & Support</Text>
          <Text style={styles.text}>
            Have questions or need help? We're here for you!{'\n\n'}
            Email us at: isyerimiz@gmail.com
          </Text>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => router.push('/help')}
          >
            <Text style={styles.linkText}>Visit Help Center</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity 
            style={styles.legalItem}
            onPress={() => router.push('/terms-view')}
          >
            <Text style={styles.legalText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.legalItem}
            onPress={() => router.push('/terms-view')}
          >
            <Text style={styles.legalText}>Community Guidelines</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.legalItem}
            onPress={() => router.push('/terms-view')}
          >
            <Text style={styles.legalText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for professionals worldwide
          </Text>
          <Text style={styles.footerText}>
            © 2025 Topicx Community Platform
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
    flex: 1,
  },
  sectorIcon: {
    fontSize: 24,
    marginRight: 4,
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
