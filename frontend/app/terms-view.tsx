import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function TermsViewScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'terms' | 'guidelines'>('terms');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal & Guidelines</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
          onPress={() => setActiveTab('terms')}
        >
          <Text style={[styles.tabText, activeTab === 'terms' && styles.activeTabText]}>
            Terms of Service
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'guidelines' && styles.activeTab]}
          onPress={() => setActiveTab('guidelines')}
        >
          <Text style={[styles.tabText, activeTab === 'guidelines' && styles.activeTabText]}>
            Community Guidelines
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'terms' ? (
          // TERMS OF SERVICE
          <View style={styles.section}>
            <View style={styles.iconContainer}>
              <Ionicons name="document-text" size={48} color="#007AFF" />
            </View>

            <Text style={styles.sectionTitle}>Drivers Chat Terms of Service</Text>
            <Text style={styles.effectiveDate}>Effective Date: January 2025</Text>

            <Text style={styles.intro}>
              Welcome to Drivers Chat! Please read these terms carefully.
            </Text>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>1. Non-Commercial Application</Text>
              <Text style={styles.text}>
                • Drivers Chat is a FREE community platform{'\n'}
                • There are NO paid memberships or premium features{'\n'}
                • This application is operated on a non-commercial basis{'\n'}
                • We do not sell any products or services
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>2. Limitation of Liability</Text>
              <Text style={styles.text}>
                • We provide this platform "AS IS" without warranties{'\n'}
                • We are NOT responsible for any financial, emotional, or material losses{'\n'}
                • Use of this application is at your own risk{'\n'}
                • We are not liable for user-generated content or interactions{'\n'}
                • We do not guarantee uninterrupted or error-free service
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>3. Your Rights & Account Control</Text>
              <Text style={styles.text}>
                • You can DELETE your account at ANY TIME from Settings{'\n'}
                • Account deletion is permanent and immediate{'\n'}
                • All your posts, messages, and data will be removed{'\n'}
                • No questions asked, no retention period
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>4. Data & Privacy</Text>
              <Text style={styles.text}>
                • We do NOT sell or share your personal information{'\n'}
                • We do NOT use your data for advertising or marketing{'\n'}
                • Your email is used ONLY for account recovery{'\n'}
                • However, content you post is PUBLIC and visible to other users{'\n'}
                • Other users can see, screenshot, or share your public posts{'\n'}
                • Be mindful of what you share publicly
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>5. Age Requirement</Text>
              <Text style={styles.text}>
                • You must be at least 18 years old to use Drivers Chat{'\n'}
                • By using the app, you confirm you meet this age requirement
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>6. Account Security</Text>
              <Text style={styles.text}>
                • You are responsible for keeping your password secure{'\n'}
                • Do not share your login credentials with anyone{'\n'}
                • Report suspicious activity immediately
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>7. Service Changes & Termination</Text>
              <Text style={styles.text}>
                • We may modify or discontinue the service at any time{'\n'}
                • We reserve the right to suspend or terminate accounts that violate our guidelines{'\n'}
                • We may update these terms from time to time
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>8. Contact</Text>
              <Text style={styles.text}>
                For questions or concerns, contact us at:{'\n'}
                support@drvchat.com
              </Text>
            </View>
          </View>
        ) : (
          // COMMUNITY GUIDELINES
          <View style={styles.section}>
            <View style={styles.iconContainer}>
              <Ionicons name="people" size={48} color="#007AFF" />
            </View>

            <Text style={styles.sectionTitle}>Community Guidelines</Text>
            <Text style={styles.effectiveDate}>Keep Drivers Chat Safe & Respectful</Text>

            <Text style={styles.intro}>
              These guidelines ensure a positive experience for all members. Violations will result in account suspension or permanent ban.
            </Text>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>🚫 Strictly Prohibited Content</Text>
            </View>

            <View style={styles.prohibitedItem}>
              <Ionicons name="cash-outline" size={24} color="#FF3B30" />
              <View style={styles.prohibitedText}>
                <Text style={styles.prohibitedTitle}>Commercial Activities</Text>
                <Text style={styles.text}>
                  No selling products, advertising, MLM schemes, or fundraising
                </Text>
              </View>
            </View>

            <View style={styles.prohibitedItem}>
              <Ionicons name="megaphone-outline" size={24} color="#FF3B30" />
              <View style={styles.prohibitedText}>
                <Text style={styles.prohibitedTitle}>Political Content</Text>
                <Text style={styles.text}>
                  No political campaigns, propaganda, or partisan debates
                </Text>
              </View>
            </View>

            <View style={styles.prohibitedItem}>
              <Ionicons name="dice-outline" size={24} color="#FF3B30" />
              <View style={styles.prohibitedText}>
                <Text style={styles.prohibitedTitle}>Gambling & Betting</Text>
                <Text style={styles.text}>
                  No gambling sites, betting tips, casino or poker promotions
                </Text>
              </View>
            </View>

            <View style={styles.prohibitedItem}>
              <Ionicons name="warning-outline" size={24} color="#FF3B30" />
              <View style={styles.prohibitedText}>
                <Text style={styles.prohibitedTitle}>Adult Content</Text>
                <Text style={styles.text}>
                  No pornography, nudity, sexual imagery, or inappropriate photos
                </Text>
              </View>
            </View>

            <View style={styles.prohibitedItem}>
              <Ionicons name="sad-outline" size={24} color="#FF3B30" />
              <View style={styles.prohibitedText}>
                <Text style={styles.prohibitedTitle}>Hate Speech & Harassment</Text>
                <Text style={styles.text}>
                  No discrimination, bullying, threats, or personal attacks
                </Text>
              </View>
            </View>

            <View style={styles.prohibitedItem}>
              <Ionicons name="skull-outline" size={24} color="#FF3B30" />
              <View style={styles.prohibitedText}>
                <Text style={styles.prohibitedTitle}>Illegal Activities</Text>
                <Text style={styles.text}>
                  No drug sales, weapons, hacking, fraud, or illegal content
                </Text>
              </View>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>⚖️ Consequences</Text>
              <Text style={styles.text}>
                • <Text style={styles.bold}>First Violation:</Text> Warning + content removal{'\n'}
                • <Text style={styles.bold}>Second Violation:</Text> 7-day account suspension{'\n'}
                • <Text style={styles.bold}>Third Violation:</Text> Permanent account ban{'\n'}
                • <Text style={styles.bold}>Severe Violations:</Text> Immediate permanent ban
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>✅ What You CAN Share</Text>
              <Text style={styles.text}>
                • Driving tips and experiences{'\n'}
                • Safety advice and road conditions{'\n'}
                • Questions about rideshare platforms{'\n'}
                • Friendly conversations and support{'\n'}
                • Memes and humor (appropriate only){'\n'}
                • Personal stories (within guidelines)
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>📢 Report Violations</Text>
              <Text style={styles.text}>
                If you see content that violates these guidelines, please report it immediately. Help us keep Drivers Chat safe for everyone.
              </Text>
            </View>
          </View>
        )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  effectiveDate: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  intro: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  subsection: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  bold: {
    fontWeight: '600',
    color: '#000',
  },
  prohibitedItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  prohibitedText: {
    flex: 1,
    marginLeft: 12,
  },
  prohibitedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 8,
  },
});
