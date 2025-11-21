import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from '../store/languageStore';

export default function HelpScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const faqData = [
    {
      title: t('helpCategoryAccount'),
      icon: 'person-circle',
      items: [
        { question: t('helpQ1'), answer: t('helpA1') },
        { question: t('helpQ2'), answer: t('helpA2') },
        { question: t('helpQ3'), answer: t('helpA3') },
        { question: t('helpQ4'), answer: t('helpA4') },
      ],
    },
    {
      title: t('helpCategoryFriends'),
      icon: 'people',
      items: [
        { question: t('helpQ5'), answer: t('helpA5') },
        { question: t('helpQ6'), answer: t('helpA6') },
        { question: t('helpQ7'), answer: t('helpA7') },
        { question: t('helpQ8'), answer: t('helpA8') },
      ],
    },
    {
      title: t('helpCategoryPosts'),
      icon: 'newspaper',
      items: [
        { question: t('helpQ9'), answer: t('helpA9') },
        { question: t('helpQ10'), answer: t('helpA10') },
        { question: t('helpQ11'), answer: t('helpA11') },
        { question: t('helpQ12'), answer: t('helpA12') },
        { question: t('helpQ13'), answer: t('helpA13') },
        { question: t('helpQ14'), answer: t('helpA14') },
      ],
    },
    {
      title: t('helpCategoryMessages'),
      icon: 'chatbubbles',
      items: [
        { question: t('helpQ15'), answer: t('helpA15') },
        { question: t('helpQ16'), answer: t('helpA16') },
        { question: t('helpQ17'), answer: t('helpA17') },
        { question: t('helpQ18'), answer: t('helpA18') },
      ],
    },
    {
      title: t('helpCategoryOther'),
      icon: 'settings',
      items: [
        { question: t('helpQ19'), answer: t('helpA19') },
        { question: t('helpQ20'), answer: t('helpA20') },
        { question: t('helpQ21'), answer: t('helpA21') },
        { question: t('helpQ22'), answer: t('helpA22') },
        { question: t('helpQ23'), answer: t('helpA23') },
      ],
    },
  ];

  const toggleCategory = (index: number) => {
    setExpandedCategory(expandedCategory === index ? null : index);
    setExpandedQuestion(null);
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
        <Text style={styles.headerTitle}>{t('helpTitle')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.introSection}>
          <Ionicons name="help-circle" size={64} color="#007AFF" />
          <Text style={styles.introTitle}>{t('helpHowCanWeHelp')}</Text>
          <Text style={styles.introText}>{t('helpFindAnswers')}</Text>
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
          <Text style={styles.footerTitle}>{t('helpStillNeed')}</Text>
          <Text style={styles.footerText}>
            {t('helpContactUs')} {t('termsSupportEmail')}
          </Text>
          <Text style={styles.versionText}>Topicx v1.0</Text>
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
