import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  username: string;
  user_profile_picture: string | null;
  content: string;
  created_at: string;
}

interface Post {
  id: string;
  user_id: string;
  username: string;
  user_profile_picture: string | null;
  content: string;
  image: string | null;
  likes: string[];
  dislikes: string[];
  comments_count: number;
  created_at: string;
}

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [id]);

  const loadPost = async () => {
    try {
      const response = await api.get('/api/posts/enhanced');
      const foundPost = response.data.find((p: Post) => p.id === id);
      setPost(foundPost);
    } catch (error) {
      console.error('Load post error:', error);
    }
  };

  const loadComments = async () => {
    try {
      const response = await api.get(`/api/posts/${id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Load comments error:', error);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    try {
      const response = await api.post(`/api/posts/${post.id}/vote`, {
        vote_type: 'like',
      });
      setPost(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        Alert.alert('Notice', 'This post was removed due to community feedback');
        router.back();
      } else if (error.response?.status === 400) {
        Alert.alert('Notice', 'Cannot vote on your own post');
      }
      console.error('Like error:', error);
    }
  };

  const handleDislike = async () => {
    if (!post) return;
    try {
      const response = await api.post(`/api/posts/${post.id}/vote`, {
        vote_type: 'dislike',
      });
      setPost(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        Alert.alert('Notice', 'This post was removed due to community feedback');
        router.back();
      } else if (error.response?.status === 400) {
        Alert.alert('Notice', 'Cannot vote on your own post');
      }
      console.error('Dislike error:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const response = await api.post(`/api/posts/${id}/comments`, {
        content: newComment,
      });
      setComments([...comments, response.data]);
      setNewComment('');
      if (post) {
        setPost({ ...post, comments_count: post.comments_count + 1 });
      }
    } catch (error) {
      console.error('Comment error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <TouchableOpacity onPress={() => router.push(`/profile/${item.user_id}`)}>
        {item.user_profile_picture ? (
          <Image source={{ uri: item.user_profile_picture }} style={styles.commentAvatar} />
        ) : (
          <View style={[styles.commentAvatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={16} color="#999" />
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUsername}>{item.username}</Text>
          <Text style={styles.commentTime}>
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: tr })}
          </Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </View>
  );

  if (!post) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text>Yüklen iyor...</Text>
        </View>
      </View>
    );
  }

  const isLiked = post.likes.includes(user?.id || '');

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <TouchableOpacity 
              style={styles.userInfo}
              onPress={() => router.push(`/profile/${post.user_id}`)}
            >
              {post.user_profile_picture ? (
                <Image source={{ uri: post.user_profile_picture }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={24} color="#999" />
                </View>
              )}
              <View>
                <Text style={styles.username}>{post.username}</Text>
                <Text style={styles.timestamp}>
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: tr })}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.postContent}>{post.content}</Text>

          {post.image && (
            <Image source={{ uri: post.image }} style={styles.postImage} />
          )}

          <View style={styles.postActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={isLiked ? "#FF3B30" : "#666"} 
              />
              <Text style={[styles.actionText, isLiked && styles.likedText]}>
                {post.likes.length}
              </Text>
            </TouchableOpacity>

            <View style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={22} color="#666" />
              <Text style={styles.actionText}>{post.comments_count}</Text>
            </View>
          </View>
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments</Text>
          {comments.length === 0 ? (
            <Text style={styles.noComments}>No comments yet. Be the first to comment!</Text>
          ) : (
            comments.map((comment) => (
              <View key={comment.id}>
                {renderComment({ item: comment })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Write a comment..."
          value={newComment}
          onChangeText={setNewComment}
          placeholderTextColor="#999"
        />
        <TouchableOpacity 
          style={styles.sendButton}
          onPress={handleSubmitComment}
          disabled={loading || !newComment.trim()}
        >
          <Ionicons 
            name="send" 
            size={24} 
            color={!newComment.trim() ? "#ccc" : "#007AFF"} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
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
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  postCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  likedText: {
    color: '#FF3B30',
  },
  commentsSection: {
    backgroundColor: '#fff',
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  noComments: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 24,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#000',
  },
  sendButton: {
    marginLeft: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
