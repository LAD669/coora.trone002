import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import Modal from 'react-native-modal';
import { Plus, MoveHorizontal as MoreHorizontal, Heart, MessageCircle, Building2, Users, Smile } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { getClubPosts } from '@/lib/api/club';
import { createPost, addPostReaction, removePostReaction } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TopBarManager from '@/components/ui/TopBarManager';

export default function InfohubManager() {
  const { t: commonT } = useTranslation('common');
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Early return if user is not available
  if (!user) {
    return null;
  }
  
  const [posts, setPosts] = useState<any[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPostForModal, setSelectedPostForModal] = useState<any>(null);
  const [isPostModalVisible, setPostModalVisible] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    imageUrl: '',
  });

  // Load posts from Supabase
  useEffect(() => {
    if (user?.clubId && user?.id) {
      console.log('Loading club posts for manager:', user.id, 'club:', user.clubId);
      loadPosts();
    } else {
      console.log('User not ready for loading posts:', { userId: user?.id, clubId: user?.clubId });
      setIsLoading(false);
    }
  }, [user]);

  const loadPosts = async () => {
    if (!user?.id) {
      console.log('Cannot load posts - missing user data:', { userId: user?.id });
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // Manager: load organization posts from entire club
      console.log('Fetching club posts for manager:', user.clubId);
      const data = await getClubPosts(user.clubId!, 'organization');
      
      console.log('Received posts data:', data);
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
      console.error('Failed to load posts:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const canCreatePost = user?.role === 'manager' || user?.role === 'admin';

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      Alert.alert(commonT('error'), commonT('fillAllFields'));
      return;
    }

    if (!user?.clubId || !user?.id) {
      Alert.alert(commonT('error'), commonT('authError'));
      return;
    }

    try {
      await createPost({
        title: newPost.title,
        content: newPost.content,
        imageUrl: newPost.imageUrl || undefined,
        postType: 'organization',
        teamId: user.clubId, // For club posts, we use clubId as teamId
        authorId: user.id,
      });

      setNewPost({ title: '', content: '', imageUrl: '' });
      setModalVisible(false);
      Alert.alert(commonT('success'), commonT('postCreated'));
      loadPosts(); // Reload data
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert(commonT('error'), commonT('somethingWentWrong'));
    }
  };

  const handleReaction = async (postId: string, reaction: string) => {
    if (!user?.id) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const hasReacted = post.reactions && post.reactions[user.id] === reaction;
      
      if (hasReacted) {
        await removePostReaction(postId, user.id);
      } else {
        await addPostReaction(postId, user.id, reaction);
      }
      
      loadPosts(); // Reload to get updated reactions
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getReactionCount = (post: any, reaction: string) => {
    if (!post.reactions) return 0;
    return Object.values(post.reactions).filter((r: any) => r === reaction).length;
  };

  const getUserReaction = (post: any) => {
    if (!post.reactions || !user?.id) return null;
    return post.reactions[user.id] || null;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{commonT('loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBarManager 
        title="Info-Hub" 
        onPressBell={() => router.push("/notifications")} 
        onPressSettings={() => router.push("/settings")} 
      />
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 + insets.bottom + 49 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Club Information</Text>
          <Text style={styles.headerSubtitle}>Stay updated with club news and announcements</Text>
        </View>

        {/* Posts */}
        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Building2 size={48} color="#E5E5E7" strokeWidth={1} />
            <Text style={styles.emptyStateText}>No posts yet</Text>
            <Text style={styles.emptyStateSubtext}>
              {canCreatePost ? 'Be the first to share club news!' : 'Check back later for updates.'}
            </Text>
          </View>
        ) : (
          <View style={styles.postsContainer}>
            {posts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.postAuthor}>
                    <View style={styles.authorAvatar}>
                      <Text style={styles.authorInitials}>
                        {post.author_name ? post.author_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'C'}
                      </Text>
                    </View>
                    <View style={styles.authorInfo}>
                      <Text style={styles.authorName}>{post.author_name || 'Club Admin'}</Text>
                      <Text style={styles.postDate}>{formatDate(post.created_at)}</Text>
                    </View>
                  </View>
                  <View style={styles.postType}>
                    <Building2 size={16} color="#007AFF" strokeWidth={1.5} />
                    <Text style={styles.postTypeText}>Organization</Text>
                  </View>
                </View>

                <Text style={styles.postTitle}>{post.title}</Text>
                
                <Text 
                  style={styles.postContent}
                  numberOfLines={expandedPost === post.id ? undefined : 3}
                >
                  {post.content}
                </Text>
                
                {post.content.length > 150 && (
                  <TouchableOpacity 
                    style={styles.expandButton}
                    onPress={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                  >
                    <Text style={styles.expandButtonText}>
                      {expandedPost === post.id ? 'Show less' : 'Read more'}
                    </Text>
                  </TouchableOpacity>
                )}

                {post.image_url && (
                  <Image source={{ uri: post.image_url }} style={styles.postImage} />
                )}

                <View style={styles.postActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleReaction(post.id, 'like')}
                  >
                    <Heart 
                      size={18} 
                      color={getUserReaction(post) === 'like' ? '#FF3B30' : '#8E8E93'} 
                      strokeWidth={1.5}
                      fill={getUserReaction(post) === 'like' ? '#FF3B30' : 'none'}
                    />
                    <Text style={styles.actionText}>{getReactionCount(post, 'like')}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleReaction(post.id, 'love')}
                  >
                    <Smile 
                      size={18} 
                      color={getUserReaction(post) === 'love' ? '#FF9500' : '#8E8E93'} 
                      strokeWidth={1.5}
                      fill={getUserReaction(post) === 'love' ? '#FF9500' : 'none'}
                    />
                    <Text style={styles.actionText}>{getReactionCount(post, 'love')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {canCreatePost && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      )}

      {/* Create Post Modal */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Club Post</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.input}
              placeholder="Post title"
              value={newPost.title}
              onChangeText={(text) => setNewPost({ ...newPost, title: text })}
              placeholderTextColor="#8E8E93"
            />

            <TextInput
              style={styles.textArea}
              placeholder="What's happening at the club?"
              value={newPost.content}
              onChangeText={(text) => setNewPost({ ...newPost, content: text })}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholderTextColor="#8E8E93"
            />

            <TextInput
              style={styles.input}
              placeholder="Image URL (optional)"
              value={newPost.imageUrl}
              onChangeText={(text) => setNewPost({ ...newPost, imageUrl: text })}
              placeholderTextColor="#8E8E93"
            />

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreatePost}
            >
              <Text style={styles.createButtonText}>Share Post</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  header: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    fontFamily: 'Urbanist-SemiBold',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#C7C7CC',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
  },
  postsContainer: {
    gap: 20,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  postAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 2,
  },
  postDate: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  postType: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  postTypeText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 12,
  },
  postContent: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
    lineHeight: 24,
    marginBottom: 12,
  },
  expandButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  expandButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  cancelText: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  modalForm: {
    flex: 1,
  },
  input: {
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 16,
    fontFamily: 'Urbanist-Regular',
  },
  textArea: {
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 24,
    fontFamily: 'Urbanist-Regular',
    height: 120,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
});
