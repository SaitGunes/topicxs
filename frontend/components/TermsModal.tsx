import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../store/languageStore';

interface TermsModalProps {
  visible: boolean;
  onAccept: () => void;
}

export default function TermsModal({ visible, onAccept }: TermsModalProps) {
  const { t } = useTranslation();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1 = Terms, 2 = Guidelines

  const handleContinue = () => {
    if (currentStep === 1 && termsAccepted) {
      setCurrentStep(2);
    } else if (currentStep === 2 && guidelinesAccepted) {
      onAccept();
    }
  };

  const canContinue = currentStep === 1 ? termsAccepted : guidelinesAccepted;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {currentStep === 1 ? t('termsOfService') : t('communityGuidelines')}
          </Text>
          <Text style={styles.stepIndicator}>{t('termsStep')} {currentStep} {t('termsOf')} 2</Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.content}>
          {currentStep === 1 ? (
            // TERMS OF SERVICE
            <View>
              <View style={styles.iconContainer}>
                <Ionicons name="document-text" size={64} color="#007AFF" />
              </View>

              <Text style={styles.sectionTitle}>Drivers Chat Terms of Service</Text>
              <Text style={styles.effectiveDate}>Effective Date: January 2025</Text>

              <Text style={styles.intro}>
                Welcome to Drivers Chat! Please read these terms carefully before using our application.
              </Text>

              <View style={styles.section}>
                <Text style={styles.subtitle}>1. Non-Commercial Application</Text>
                <Text style={styles.text}>
                  • Drivers Chat is a FREE community platform{'\n'}
                  • There are NO paid memberships or premium features{'\n'}
                  • This application is operated on a non-commercial basis{'\n'}
                  • We do not sell any products or services
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.subtitle}>2. Limitation of Liability</Text>
                <Text style={styles.text}>
                  • We provide this platform "AS IS" without warranties{'\n'}
                  • We are NOT responsible for any financial, emotional, or material losses{'\n'}
                  • Use of this application is at your own risk{'\n'}
                  • We are not liable for user-generated content or interactions{'\n'}
                  • We do not guarantee uninterrupted or error-free service
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.subtitle}>3. Your Rights & Account Control</Text>
                <Text style={styles.text}>
                  • You can DELETE your account at ANY TIME from Settings{'\n'}
                  • Account deletion is permanent and immediate{'\n'}
                  • All your posts, messages, and data will be removed{'\n'}
                  • No questions asked, no retention period
                </Text>
              </View>

              <View style={styles.section}>
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

              <View style={styles.section}>
                <Text style={styles.subtitle}>4.1 Location Data</Text>
                <Text style={styles.text}>
                  • You can optionally share your location in group posts{'\n'}
                  • Location sharing is VOLUNTARY and requires your permission{'\n'}
                  • Shared locations are visible to all group members{'\n'}
                  • You can choose road status alerts (traffic, accidents, etc.){'\n'}
                  • We do NOT track your location without your explicit consent
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.subtitle}>4.2 Voice Messages</Text>
                <Text style={styles.text}>
                  • You can send voice messages in chats and groups{'\n'}
                  • Voice messages are stored securely on our servers{'\n'}
                  • Recipients can listen to and download voice messages{'\n'}
                  • Voice messages may be subject to moderation for safety
                </Text>
              </View>

              <View style={[styles.section, styles.highlightedSection]}>
                <Text style={styles.subtitle}>⚠️ 5. Age Requirement (18+)</Text>
                <Text style={[styles.text, styles.importantText]}>
                  • You MUST be at least 18 years old to create an account and use Drivers Chat{'\n'}
                  • By accepting these terms, you confirm that you are 18 years or older{'\n'}
                  • We reserve the right to request age verification{'\n'}
                  • Accounts found to belong to users under 18 will be immediately terminated
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.subtitle}>6. Account Security</Text>
                <Text style={styles.text}>
                  • You are responsible for keeping your password secure{'\n'}
                  • Do not share your login credentials with anyone{'\n'}
                  • Report suspicious activity immediately
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.subtitle}>7. Service Changes & Termination</Text>
                <Text style={styles.text}>
                  • We may modify or discontinue the service at any time{'\n'}
                  • We reserve the right to suspend or terminate accounts that violate our guidelines{'\n'}
                  • We may update these terms from time to time
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.subtitle}>8. Contact</Text>
                <Text style={styles.text}>
                  For questions or concerns, contact us at:{'\n'}
                  support@drvchat.com
                </Text>
              </View>
            </View>
          ) : (
            // COMMUNITY GUIDELINES
            <View>
              <View style={styles.iconContainer}>
                <Ionicons name="people" size={64} color="#007AFF" />
              </View>

              <Text style={styles.sectionTitle}>Community Guidelines</Text>
              <Text style={styles.effectiveDate}>Keep Drivers Chat Safe & Respectful</Text>

              <Text style={styles.intro}>
                These guidelines ensure a positive experience for all members. Violations will result in account suspension or permanent ban.
              </Text>

              <View style={styles.section}>
                <Text style={styles.subtitle}>🚫 Strictly Prohibited Content</Text>
                <Text style={styles.text}>
                  The following content is ABSOLUTELY FORBIDDEN and will result in immediate action:
                </Text>
              </View>

              <View style={styles.prohibitedItem}>
                <Ionicons name="cash-outline" size={24} color="#FF3B30" />
                <View style={styles.prohibitedText}>
                  <Text style={styles.prohibitedTitle}>1. Commercial Activities</Text>
                  <Text style={styles.text}>
                    • No selling products or services{'\n'}
                    • No advertising or promotional posts{'\n'}
                    • No MLM or pyramid schemes{'\n'}
                    • No fundraising or donation requests
                  </Text>
                </View>
              </View>

              <View style={styles.prohibitedItem}>
                <Ionicons name="megaphone-outline" size={24} color="#FF3B30" />
                <View style={styles.prohibitedText}>
                  <Text style={styles.prohibitedTitle}>2. Political Content</Text>
                  <Text style={styles.text}>
                    • No political campaigns or propaganda{'\n'}
                    • No partisan political debates{'\n'}
                    • Keep discussions driving-related
                  </Text>
                </View>
              </View>

              <View style={styles.prohibitedItem}>
                <Ionicons name="dice-outline" size={24} color="#FF3B30" />
                <View style={styles.prohibitedText}>
                  <Text style={styles.prohibitedTitle}>3. Gambling & Betting</Text>
                  <Text style={styles.text}>
                    • No gambling sites or apps{'\n'}
                    • No betting tips or odds{'\n'}
                    • No casino or poker promotions{'\n'}
                    • No sports betting content
                  </Text>
                </View>
              </View>

              <View style={styles.prohibitedItem}>
                <Ionicons name="warning-outline" size={24} color="#FF3B30" />
                <View style={styles.prohibitedText}>
                  <Text style={styles.prohibitedTitle}>4. Adult & Inappropriate Content</Text>
                  <Text style={styles.text}>
                    • No pornography or sexually explicit content{'\n'}
                    • No nudity or sexual imagery{'\n'}
                    • No adult dating or hookup posts{'\n'}
                    • No suggestive or inappropriate photos
                  </Text>
                </View>
              </View>

              <View style={styles.prohibitedItem}>
                <Ionicons name="sad-outline" size={24} color="#FF3B30" />
                <View style={styles.prohibitedText}>
                  <Text style={styles.prohibitedTitle}>5. Hate Speech & Harassment</Text>
                  <Text style={styles.text}>
                    • No discrimination based on race, religion, gender, nationality{'\n'}
                    • No bullying, threats, or harassment{'\n'}
                    • No personal attacks or doxxing{'\n'}
                    • Be respectful to all community members
                  </Text>
                </View>
              </View>

              <View style={styles.prohibitedItem}>
                <Ionicons name="skull-outline" size={24} color="#FF3B30" />
                <View style={styles.prohibitedText}>
                  <Text style={styles.prohibitedTitle}>6. Illegal Activities</Text>
                  <Text style={styles.text}>
                    • No drug sales or promotion{'\n'}
                    • No weapons or illegal items{'\n'}
                    • No hacking or fraud schemes{'\n'}
                    • No content that violates laws
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.subtitle}>⚖️ Consequences</Text>
                <Text style={styles.text}>
                  • <Text style={styles.bold}>First Violation:</Text> Warning + content removal{'\n'}
                  • <Text style={styles.bold}>Second Violation:</Text> 7-day account suspension{'\n'}
                  • <Text style={styles.bold}>Third Violation:</Text> Permanent account ban{'\n'}
                  • <Text style={styles.bold}>Severe Violations:</Text> Immediate permanent ban
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.subtitle}>✅ What You CAN Share</Text>
                <Text style={styles.text}>
                  • Driving tips and experiences{'\n'}
                  • Safety advice and road conditions{'\n'}
                  • Real-time traffic updates and road hazards{'\n'}
                  • Location-based road status alerts (in groups){'\n'}
                  • Voice messages for quick communication{'\n'}
                  • Questions about transportation platforms{'\n'}
                  • Friendly conversations and support{'\n'}
                  • Memes and humor (appropriate only){'\n'}
                  • Personal stories (within guidelines)
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.subtitle}>🎤 Voice Messages & Location Guidelines</Text>
                <Text style={styles.text}>
                  • <Text style={styles.bold}>Voice Messages:</Text> Keep them brief and respectful{'\n'}
                  • <Text style={styles.bold}>Location Sharing:</Text> Only share in relevant group contexts{'\n'}
                  • <Text style={styles.bold}>Road Alerts:</Text> Provide accurate, helpful information{'\n'}
                  • <Text style={styles.bold}>Privacy:</Text> Don't share others' personal locations without consent{'\n'}
                  • <Text style={styles.bold}>Safety First:</Text> Never record or share while actively driving
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.subtitle}>📢 Report Violations</Text>
                <Text style={styles.text}>
                  If you see content that violates these guidelines, please report it immediately. Help us keep Drivers Chat safe for everyone.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer with Checkbox */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => {
              if (currentStep === 1) {
                setTermsAccepted(!termsAccepted);
              } else {
                setGuidelinesAccepted(!guidelinesAccepted);
              }
            }}
          >
            <View style={[styles.checkbox, canContinue && styles.checkboxChecked]}>
              {canContinue && <Ionicons name="checkmark" size={20} color="#fff" />}
            </View>
            <Text style={styles.checkboxText}>
              {currentStep === 1
                ? t('termsAgreeService')
                : t('termsAgreeGuidelines')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!canContinue}
          >
            <Text style={styles.continueButtonText}>
              {currentStep === 1 ? t('termsContinue') : t('termsAcceptStart')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  stepIndicator: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
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
  section: {
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
  footer: {
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
