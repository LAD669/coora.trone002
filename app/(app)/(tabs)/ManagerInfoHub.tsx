import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { getClubPosts } from '@/lib/supabase';
import { 
  MessageSquare, 
  Building2, 
  FileText,
  AlertCircle,
  Calendar
} from 'lucide-react-native';

export default function ManagerInfoHubScreen() {
  const { t } = useTranslation('manager');
  const { clubId } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clubId) {
      loadPosts();
    }
  }, [clubId]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await getClubPosts(clubId!, {
        categories: ['announcement', 'policy', 'organization'],
        limit: 20
      });
      setPosts(data);
    } catch (error) {
      console.error('Error loading club posts:', error);
      Alert.alert(t('error'), t('postsLoadError'));
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'announcement':
        return <AlertCircle size={20} color="#007AFF" />;
      case 'policy':
        return <FileText size={20} color="#FF9500" />;
      case 'organization':
        return <Building2 size={20} color="#34C759" />;
      default:
        return <MessageSquare size={20} color="#8E8E93" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    return t(`postTypes.${category}`) || category;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <MessageSquare size={48} color="#8E8E93" />
          <Text style={styles.emptyTitle}>{t('noPosts')}</Text>
          <Text style={styles.emptyDescription}>{t('noPostsDescription')}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('infoHub')}</Text>
        <Text style={styles.subtitle}>{t('organizationalContent')}</Text>
      </View>

      {posts.map((post) => (
        <View key={post.id} style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.categoryContainer}>
              {getCategoryIcon(post.category)}
              <Text style={styles.categoryLabel}>
                {getCategoryLabel(post.category)}
              </Text>
            </View>
            <Text style={styles.postDate}>
              {new Date(post.created_at).toLocaleDateString()}
            </Text>
          </View>
          
          <Text style={styles.postContent}>{post.content}</Text>
          
          <View style={styles.postFooter}>
            <Text style={styles.postAuthor}>
              {post.users?.name || post.users?.first_name || 'Unknown'}
            </Text>
            <Text style={styles.postTeam}>
              {post.team_id ? 'Team Post' : 'Club Post'}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginTop: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 50,
    fontFamily: 'Urbanist-Regular',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
    marginTop: 8,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  postDate: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  postContent: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postAuthor: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  postTeam: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
});
