import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="car" size={48} color="#007AFF" />
          </View>
          <Text style={styles.appName}>Drivers Chat</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.tagline}>Where Drivers Connect</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the App</Text>
          <Text style={styles.text}>
            Drivers Chat is a FREE social platform built exclusively for Uber and Lyft drivers. 
            Connect with fellow drivers, share experiences, get tips, and stay informed about 
            everything related to rideshare driving.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.text}>
            To create a supportive community where rideshare drivers can connect, share knowledge, 
            and help each other navigate the challenges and opportunities of driving for Uber and Lyft.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featureItem}>
            <Ionicons name="people" size={20} color="#007AFF" />
            <Text style={styles.featureText}>Connect with drivers nationwide</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="chatbubbles" size={20} color="#007AFF" />
            <Text style={styles.featureText}>Real-time messaging</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="newspaper" size={20} color="#007AFF" />
            <Text style={styles.featureText}>Share tips and experiences</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="heart" size={20} color="#007AFF" />
            <Text style={styles.featureText}>Community-driven content moderation</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="gift" size={20} color="#007AFF" />
            <Text style={styles.featureText}>Referral rewards system</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={20} color="#007AFF" />
            <Text style={styles.featureText}>Safe and respectful community</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>100% Free</Text>
          <Text style={styles.text}>
            Drivers Chat is completely free with no paid memberships, premium features, or hidden costs. 
            This is a non-commercial platform built by drivers, for drivers.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Guidelines</Text>
          <Text style={styles.text}>
            We maintain a safe and respectful environment by prohibiting commercial activities, 
            political content, gambling, adult content, hate speech, and illegal activities. 
            Users who violate our guidelines face account suspension or permanent bans.
          </Text>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => router.push('/terms-view')}
          >
            <Text style={styles.linkText}>Read Full Terms & Guidelines →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact & Support</Text>
          <Text style={styles.text}>
            Have questions, feedback, or need help?{'\n'}
            Email us at: support@drvchat.com
          </Text>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => router.push('/help')}
          >
            <Text style={styles.linkText}>Visit Help Center →</Text>
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
            Made with ❤️ for rideshare drivers
          </Text>
          <Text style={styles.footerText}>
            © 2025 Drivers Chat. All rights reserved.
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
