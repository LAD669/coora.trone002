import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { Calendar, MessageSquare, Users, AlertCircle } from 'lucide-react-native';
import { getClubPosts } from '@/lib/supabase';

interface ClubPost {
  id: string;
  title: string;
  content: string;
  post_type: 'organization' | 'announcement' | 'policy';
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
  team_id: string | null;
  team_name: string | null;
}

export default function ManagerInfoHubScreen() {
  const { t } = useTranslation('manager');
  const { user } = useAuth();
  const [posts, setPosts] = useState<ClubPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.clubId) {
      loadClubPosts();
    }
  }, [user?.clubId]);

  const loadClubPosts = async () => {
    if (!user?.clubId) return;

    try {
      setIsLoading(true);
      const clubPosts = await getClubPosts(user.clubId, {
        categories: ['announcement', 'policy', 'organization'],
        limit: 50,
      });
      setPosts(clubPosts);
    } catch (error) {
      console.error('Error loading club posts:', error);
      Alert.alert(t('error'), t('postsLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClubPosts();
    setRefreshing(false);
  };

  const getPostIcon = (postType: string) => {
    switch (postType) {
      case 'announcement':
        return <AlertCircle size={20} color="#FF9500" />;
      case 'policy':
        return <MessageSquare size={20} color="#007AFF" />;
      case 'organization':
        return <Users size={20} color="#34C759" />;
      default:
        return <MessageSquare size={20} color="#8E8E93" />;
    }
  };

  const getPostTypeLabel = (postType: string) => {
    switch (postType) {
      case 'announcement':
        return t('postTypes.announcement');
      case 'policy':
        return t('postTypes.policy');
      case 'organization':
        return t('postTypes.organization');
      default:
        return t('postTypes.general');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('infoHub')}</Text>
        <Text style={styles.subtitle}>{t('organizationalContent')}</Text>
      </View>

      {posts.length === 0 ? (
        <View style={styles.emptyState}>
          <MessageSquare size={48} color="#8E8E93" />
          <Text style={styles.emptyTitle}>{t('noPosts')}</Text>
          <Text style={styles.emptySubtitle}>{t('noPostsDescription')}</Text>
        </View>
      ) : (
        <View style={styles.postsList}>
          {posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.postTypeContainer}>
                  {getPostIcon(post.post_type)}
                  <Text style={styles.postTypeLabel}>
                    {getPostTypeLabel(post.post_type)}
                  </Text>
                </View>
                <Text style={styles.postDate}>{formatDate(post.created_at)}</Text>
              </View>

              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postContent} numberOfLines={3}>
                {post.content}
              </Text>

              <View style={styles.postFooter}>
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>{post.author_name}</Text>
                  {post.team_name && (
                    <Text style={styles.teamName}>• {post.team_name}</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  postsList: {
    paddingHorizontal: 20,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    fontFamily: 'Urbanist-SemiBold',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  postDate: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 8,
    lineHeight: 24,
  },
  postContent: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
    lineHeight: 24,
    marginBottom: 16,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
  },
  teamName: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginLeft: 4,
  },
});
