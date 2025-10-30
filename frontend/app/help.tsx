import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: string;
  items: FAQItem[];
}

export default function HelpScreen() {
  const router = useRouter();
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const faqData: FAQCategory[] = [
    {
      title: 'Account & Profile',
      icon: 'person-circle',
      items: [
        {
          question: 'How do I register?',
          answer: 'On the registration screen, enter your username, email, password, and full name. You can also enter a referral code if you have one. Click "Register" to create your account.',
        },
        {
          question: 'How do I change my profile picture?',
          answer: 'Go to the Profile tab, tap on your profile picture, and select a new photo from your gallery. The photo will be cropped to a square and uploaded automatically.',
        },
        {
          question: 'What is a referral code?',
          answer: 'A referral code is your unique code shown on your profile page. Share it with friends so they can enter it when registering. You\'ll see how many people joined using your code.',
        },
        {
          question: 'How do I reset my password?',
          answer: 'On the login screen, click "Forgot Password?", enter your email and username, and follow the instructions to reset your password.',
        },
      ],
    },
    {
      title: 'Friends System',
      icon: 'people',
      items: [
        {
          question: 'How do I add friends?',
          answer: 'Go to the Friends tab, use the search bar to find users by username or name, then tap "Add Friend" to send a friend request. You can also add a personal message.',
        },
        {
          question: 'How do I accept friend requests?',
          answer: 'Go to the Friends tab and check the "Friend Requests" section. You\'ll see a badge on the Friends tab icon if you have pending requests. Tap "Accept" or "Decline" for each request.',
        },
        {
          question: 'Can I remove friends?',
          answer: 'Currently, the friend removal feature is not available. This feature will be added in future updates.',
        },
        {
          question: 'Where can I see my friends list?',
          answer: 'Go to the Friends tab and scroll down to see your complete friends list with their profile pictures and names.',
        },
      ],
    },
    {
      title: 'Posts & Sharing',
      icon: 'newspaper',
      items: [
        {
          question: 'How do I create a post?',
          answer: 'On the Home tab, tap the "+" icon in the top right. Write your content, optionally add a photo, choose privacy settings, and tap "Post".',
        },
        {
          question: 'What are privacy settings?',
          answer: 'When creating a post, you can choose:\n• Public: Everyone can see\n• Friends: Only your friends can see\n• Specific: Choose specific friends who can see the post',
        },
        {
          question: 'How does Like/Dislike work?',
          answer: 'You can like 👍 or dislike 👎 any post except your own. Tap the thumbs up to like, or thumbs down to dislike. You can change your vote anytime.',
        },
        {
          question: 'What happens if a post gets too many dislikes?',
          answer: 'If a post receives more than 10 total votes and more than 50% are dislikes, it will be automatically deleted to maintain content quality.',
        },
        {
          question: 'Can I vote on my own posts?',
          answer: 'No, you cannot like or dislike your own posts. The vote buttons will be disabled (grayed out) on your posts.',
        },
        {
          question: 'How do I view someone\'s profile?',
          answer: 'Tap on any username or profile picture in posts or the friends list to view their profile and see all their posts.',
        },
      ],
    },
    {
      title: 'Messaging',
      icon: 'chatbubbles',
      items: [
        {
          question: 'How do I start a chat?',
          answer: 'Visit a user\'s profile and tap "Send Message", or go to the Messages tab and select an existing conversation.',
        },
        {
          question: 'How do I know if I have new messages?',
          answer: 'You\'ll see a red badge with the number of unread messages on the Messages tab icon at the bottom.',
        },
        {
          question: 'Can I send images in chat?',
          answer: 'Currently, chat only supports text messages. Image sharing in messages will be added in future updates.',
        },
        {
          question: 'Are messages real-time?',
          answer: 'Yes! Messages use Socket.IO technology for real-time delivery. Messages appear instantly when sent.',
        },
      ],
    },
    {
      title: 'Other',
      icon: 'settings',
      items: [
        {
          question: 'How do I sign out?',
          answer: 'Go to the Profile tab, scroll down, and tap "Sign Out". Your session will end immediately and you\'ll be redirected to the login screen.',
        },
        {
          question: 'Can I edit my posts?',
          answer: 'Post editing is not currently available. You can delete and create a new post if needed (delete feature coming soon).',
        },
        {
          question: 'Is my data secure?',
          answer: 'Yes! Your password is encrypted, and all API communications are secured. We never share your personal information with third parties.',
        },
        {
          question: 'Can I use the app offline?',
          answer: 'No, this app requires an internet connection to load posts, send messages, and perform all actions.',
        },
        {
          question: 'Who can see my profile?',
          answer: 'All registered users can view your basic profile (name, username, profile picture, posts). Only friends can see posts marked as "Friends only".',
        },
      ],
    },
  ];

  const toggleCategory = (index: number) => {
    setExpandedCategory(expandedCategory === index ? null : index);
    setExpandedQuestion(null); // Close all questions when switching categories
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & FAQ</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.introSection}>
          <Ionicons name="help-circle" size={64} color="#007AFF" />
          <Text style={styles.introTitle}>How can we help you?</Text>
          <Text style={styles.introText}>
            Find answers to common questions about Drivers Chat
          </Text>
        </View>

        {faqData.map((category, categoryIndex) => (
          <View key={categoryIndex} style={styles.categoryContainer}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCategory(categoryIndex)}
            >
              <View style={styles.categoryTitleContainer}>
                <Ionicons name={category.icon as any} size={24} color="#007AFF" />
                <Text style={styles.categoryTitle}>{category.title}</Text>
              </View>
              <Ionicons
                name={expandedCategory === categoryIndex ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#666"
              />
            </TouchableOpacity>

            {expandedCategory === categoryIndex && (
              <View style={styles.questionsContainer}>
                {category.items.map((item, itemIndex) => {
                  const questionId = `${categoryIndex}-${itemIndex}`;
                  return (
                    <View key={itemIndex} style={styles.questionContainer}>
                      <TouchableOpacity
                        style={styles.questionHeader}
                        onPress={() => toggleQuestion(questionId)}
                      >
                        <Text style={styles.questionText}>{item.question}</Text>
                        <Ionicons
                          name={expandedQuestion === questionId ? 'remove-circle' : 'add-circle'}
                          size={20}
                          color="#007AFF"
                        />
                      </TouchableOpacity>

                      {expandedQuestion === questionId && (
                        <View style={styles.answerContainer}>
                          <Text style={styles.answerText}>{item.answer}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ))}

        <View style={styles.footerSection}>
          <Text style={styles.footerTitle}>Still need help?</Text>
          <Text style={styles.footerText}>
            Contact us at support@driverforum.com
          </Text>
          <Text style={styles.versionText}>Driver Forum v1.0</Text>
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
  introSection: {
    backgroundColor: '#fff',
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  introText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  categoryContainer: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 12,
  },
  questionsContainer: {
    backgroundColor: '#f9f9f9',
  },
  questionContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 52,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginRight: 12,
  },
  answerContainer: {
    padding: 16,
    paddingLeft: 52,
    paddingTop: 0,
    paddingBottom: 20,
  },
  answerText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  footerSection: {
    backgroundColor: '#fff',
    padding: 32,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 24,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
});
