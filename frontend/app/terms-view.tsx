import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from '../store/languageStore';

export default function TermsViewScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'terms' | 'guidelines' | 'privacy'>('terms');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('aboutLegalGuidelines')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
          onPress={() => setActiveTab('terms')}
        >
          <Text style={[styles.tabText, activeTab === 'terms' && styles.activeTabText]}>
            Terms
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'privacy' && styles.activeTab]}
          onPress={() => setActiveTab('privacy')}
        >
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.activeTabText]}>
            Privacy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'guidelines' && styles.activeTab]}
          onPress={() => setActiveTab('guidelines')}
        >
          <Text style={[styles.tabText, activeTab === 'guidelines' && styles.activeTabText]}>
            Guidelines
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

            <Text style={styles.sectionTitle}>Topicx Community Platform Terms of Service</Text>
            <Text style={styles.effectiveDate}>Effective Date: November 2025</Text>

            <Text style={styles.intro}>
              Welcome to Topicx - Your Multi-Sector Community Platform! Please read these terms carefully.
            </Text>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>1. About Topicx Platform</Text>
              <Text style={styles.text}>
                • Topicx is a FREE multi-sector community platform{'\n'}
                • Connect with professionals across Drivers, Sports, Science, Finance, and more{'\n'}
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

            <View style={[styles.subsection, styles.highlightedSection]}>
              <Text style={styles.subtitle}>⚠️ 5. Age Requirement (18+)</Text>
              <Text style={[styles.text, styles.importantText]}>
                • You MUST be at least 18 years old to create an account and use Topicx{'\n'}
                • By registering, you confirm that you are 18 years or older{'\n'}
                • We reserve the right to request age verification{'\n'}
                • Accounts found to belong to users under 18 will be immediately terminated
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
                isyerimiz@gmail.com
              </Text>
            </View>
          </View>
        ) : activeTab === 'privacy' ? (
          // PRIVACY POLICY
          <View style={styles.section}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={48} color="#007AFF" />
            </View>

            <Text style={styles.sectionTitle}>Topicx Privacy Policy</Text>
            <Text style={styles.effectiveDate}>Effective Date: November 2025</Text>

            <Text style={styles.intro}>
              At Topicx, we are committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights.
            </Text>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>1. Information We Collect</Text>
              <Text style={styles.text}>
                <Text style={{fontWeight: 'bold'}}>Account Information:{'\n'}</Text>
                • Email address (for account creation and recovery){'\n'}
                • Username and display name{'\n'}
                • Profile picture (optional){'\n'}
                • Phone number (optional, sector-specific){'\n'}
                {'\n'}
                <Text style={{fontWeight: 'bold'}}>Content You Create:{'\n'}</Text>
                • Posts, comments, messages{'\n'}
                • Voice messages{'\n'}
                • Location data (only when you share in group posts){'\n'}
                {'\n'}
                <Text style={{fontWeight: 'bold'}}>Usage Information:{'\n'}</Text>
                • Device information (OS, app version){'\n'}
                • Log data (IP address, timestamps){'\n'}
                • Crash reports and diagnostics
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>2. How We Use Your Information</Text>
              <Text style={styles.text}>
                • <Text style={{fontWeight: 'bold'}}>To provide the service:</Text> Enable you to create an account, post content, and interact with other users{'\n'}
                • <Text style={{fontWeight: 'bold'}}>To communicate:</Text> Send email verification and account-related notifications{'\n'}
                • <Text style={{fontWeight: 'bold'}}>To improve:</Text> Analyze usage patterns to enhance app performance and features{'\n'}
                • <Text style={{fontWeight: 'bold'}}>To ensure safety:</Text> Detect and prevent spam, abuse, and violations of community guidelines{'\n'}
                {'\n'}
                ✅ <Text style={{fontWeight: 'bold'}}>We DO NOT:</Text>{'\n'}
                • Sell or share your personal information with third parties{'\n'}
                • Use your data for targeted advertising{'\n'}
                • Track your location without your explicit permission
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>3. Data Sharing & Public Content</Text>
              <Text style={styles.text}>
                <Text style={{fontWeight: 'bold'}}>Public Posts:{'\n'}</Text>
                • Posts you create are visible to all users in your selected sector{'\n'}
                • Other users can screenshot, share, or download your public content{'\n'}
                • Be mindful of what you share publicly{'\n'}
                {'\n'}
                <Text style={{fontWeight: 'bold'}}>Private Messages:{'\n'}</Text>
                • Direct messages are encrypted in transit{'\n'}
                • Only visible to sender and recipient{'\n'}
                • Not used for advertising or analytics{'\n'}
                {'\n'}
                <Text style={{fontWeight: 'bold'}}>Third-Party Sharing:{'\n'}</Text>
                • We do NOT sell your data to advertisers or data brokers{'\n'}
                • We may share data with service providers (hosting, analytics) under strict confidentiality agreements{'\n'}
                • We may disclose data if required by law (court orders, legal compliance)
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>4. Data Retention & Deletion</Text>
              <Text style={styles.text}>
                <Text style={{fontWeight: 'bold'}}>Account Data:{'\n'}</Text>
                • We retain your account data as long as your account is active{'\n'}
                • You can permanently delete your account at any time from Settings{'\n'}
                {'\n'}
                <Text style={{fontWeight: 'bold'}}>Deleted Accounts:{'\n'}</Text>
                • When you delete your account, all your posts, messages, and personal data are permanently removed{'\n'}
                • Deletion is immediate and cannot be undone{'\n'}
                • Some data may be retained in backups for up to 30 days{'\n'}
                {'\n'}
                <Text style={{fontWeight: 'bold'}}>Content Retention:{'\n'}</Text>
                • Messages and posts are stored indefinitely unless deleted by you{'\n'}
                • Crash logs and diagnostics are retained for 90 days
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>5. Security Measures</Text>
              <Text style={styles.text}>
                We implement industry-standard security measures:{'\n'}
                • Encrypted data transmission (HTTPS/TLS){'\n'}
                • Secure password hashing (bcrypt){'\n'}
                • Regular security audits{'\n'}
                • Rate limiting to prevent abuse{'\n'}
                {'\n'}
                However, no system is 100% secure. You are responsible for:{'\n'}
                • Keeping your password confidential{'\n'}
                • Not sharing your login credentials{'\n'}
                • Reporting suspicious activity immediately
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>6. Children's Privacy (Under 18)</Text>
              <Text style={styles.text}>
                • Topicx is NOT intended for users under 18 years old{'\n'}
                • We do not knowingly collect data from minors{'\n'}
                • If we discover that a user is under 18, we will immediately delete their account{'\n'}
                • Parents who believe their child has created an account should contact us immediately
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>7. Your Privacy Rights</Text>
              <Text style={styles.text}>
                You have the right to:{'\n'}
                • <Text style={{fontWeight: 'bold'}}>Access:</Text> Request a copy of your personal data{'\n'}
                • <Text style={{fontWeight: 'bold'}}>Correction:</Text> Update or correct your information{'\n'}
                • <Text style={{fontWeight: 'bold'}}>Deletion:</Text> Permanently delete your account and data{'\n'}
                • <Text style={{fontWeight: 'bold'}}>Portability:</Text> Export your data in a machine-readable format{'\n'}
                • <Text style={{fontWeight: 'bold'}}>Objection:</Text> Object to processing of your data{'\n'}
                {'\n'}
                To exercise these rights, contact us at: isyerimiz@gmail.com
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>8. Cookies & Tracking</Text>
              <Text style={styles.text}>
                • We use essential cookies for authentication and session management{'\n'}
                • We do NOT use third-party advertising or tracking cookies{'\n'}
                • We do NOT sell your browsing data{'\n'}
                • Analytics are anonymized and used only to improve the app
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>9. International Data Transfers</Text>
              <Text style={styles.text}>
                • Your data may be stored on servers located outside your country{'\n'}
                • We ensure appropriate safeguards are in place for international transfers{'\n'}
                • By using Topicx, you consent to such transfers
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>10. Changes to This Policy</Text>
              <Text style={styles.text}>
                • We may update this Privacy Policy from time to time{'\n'}
                • Changes will be posted in-app with a new "Effective Date"{'\n'}
                • Continued use after changes means you accept the updated policy{'\n'}
                • Material changes will be communicated via email
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>11. Contact Us</Text>
              <Text style={styles.text}>
                If you have questions, concerns, or requests regarding your privacy:{'\n'}
                {'\n'}
                📧 Email: isyerimiz@gmail.com{'\n'}
                🌐 App: Settings → About → Legal & Guidelines{'\n'}
                {'\n'}
                We will respond within 30 days.
              </Text>
            </View>
          </View>
        ) : (
          // COMMUNITY GUIDELINES
          <View style={styles.section}>
            <View style={styles.iconContainer}>
              <Ionicons name="people" size={48} color="#007AFF" />
            </View>

            <Text style={styles.sectionTitle}>Topicx Community Guidelines</Text>
            <Text style={styles.effectiveDate}>Keep Topicx Safe, Respectful & Professional</Text>

            <Text style={styles.intro}>
              These guidelines ensure a positive experience for all members across all sectors. Violations will result in account suspension or permanent ban.
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
                • Professional tips and experiences in your sector{'\n'}
                • Industry news and insights{'\n'}
                • Sector-specific advice and best practices{'\n'}
                • Questions about your profession or sector{'\n'}
                • Friendly conversations and networking{'\n'}
                • Memes and humor (appropriate only){'\n'}
                • Personal stories (within guidelines){'\n'}
                • Cross-sector collaboration opportunities
              </Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subtitle}>📢 Report Violations</Text>
              <Text style={styles.text}>
                If you see content that violates these guidelines, please report it immediately. Help us keep Topicx safe and professional for everyone across all sectors.
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
  highlightedSection: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  importantText: {
    fontWeight: '500',
    color: '#000',
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
