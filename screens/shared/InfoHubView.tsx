import React, { useState } from 'react';
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
import { Plus, Heart, MessageCircle, Building2, Users, Smile } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { addPostReaction, removePostReaction } from '@/lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface InfoHubViewProps {
  posts: any[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreatePost?: () => void;
  headerSubtitle?: string;
  canCreatePost?: boolean;
  showToggle?: boolean;
  activeTab?: 'organization' | 'teams';
  onTabChange?: (tab: 'organization' | 'teams') => void;
}

export default function InfoHubView({
  posts,
  isLoading,
  onRefresh,
  onCreatePost,
  headerSubtitle,
  canCreatePost = false,
  showToggle = false,
  activeTab = 'organization',
  onTabChange,
}: InfoHubViewProps) {
  const { t: commonT } = useTranslation('common');
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [selectedPostForModal, setSelectedPostForModal] = useState<any>(null);
  const [isPostModalVisible, setPostModalVisible] = useState(false);

  const handleReaction = async (postId: string, emoji: string) => {
    if (!user?.id) return;

    try {
      const existingReaction = posts
        .find(p => p.id === postId)
        ?.post_reactions?.find((r: any) => r?.user_id === user.id && r?.emoji === emoji);

      if (existingReaction) {
        await removePostReaction(postId, user.id, emoji);
      } else {
        await addPostReaction(postId, user.id, emoji);
      }
      
      setShowEmojiPicker(null);
      onRefresh(); // Reload posts to get updated reactions
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const getReactionCount = (reactions: any[] = []) => {
    return Array.isArray(reactions) ? reactions.length : 0;
  };

  const getTopReactions = (reactions: any[] = []) => {
    if (!Array.isArray(reactions)) return [];
    
    const emojiCounts = reactions.reduce((acc, reaction) => {
      if (reaction?.emoji) {
        acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      }
      return acc;
    }, {});
    
    return Object.entries(emojiCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3);
  };

  const formatDate = (date: Date) => {
    if (!date || !(date instanceof Date)) return 'Unknown date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const filteredPosts = Array.isArray(posts) ? posts.filter(post => {
    if (activeTab === 'teams') {
      return post?.post_type === 'coach'; // Map 'teams' tab to 'coach' posts for backward compatibility
    }
    return post?.post_type === activeTab;
  }) : [];

  const handlePostClick = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      console.log('Selected post for modal:', post);
      setSelectedPostForModal(post);
      setPostModalVisible(true);
    } else {
      console.log('Post not found for ID:', postId);
      Alert.alert('Error', 'Post not found. Please try again.');
    }
    setShowEmojiPicker(null);
  };

  // Check if user is properly loaded
  if (!user) {
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
      <View style={styles.content}>
        {/* Toggle Section - Only show if showToggle is true */}
        {showToggle && (
          <View style={styles.toggleContainer}>
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  activeTab === 'organization' && styles.toggleButtonActive
                ]}
                onPress={() => onTabChange?.('organization')}
              >
                <Building2 
                  size={18} 
                  color={activeTab === 'organization' ? '#1A1A1A' : '#8E8E93'} 
                  strokeWidth={1.5} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  activeTab === 'teams' && styles.toggleButtonActive
                ]}
                onPress={() => onTabChange?.('teams')}
              >
                <Users 
                  size={18} 
                  color={activeTab === 'teams' ? '#1A1A1A' : '#8E8E93'} 
                  strokeWidth={1.5} 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView 
          style={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContainer, { paddingBottom: 16 + insets.bottom + 49 }]}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{commonT('loading')}</Text>
            </View>
          ) : (
            <View style={styles.postsContainer}>
              {filteredPosts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No posts yet</Text>
                  {canCreatePost && (
                    <Text style={styles.emptyStateSubtext}>
                      {headerSubtitle || 'Create the first post for your team'}
                    </Text>
                  )}
                </View>
              ) : (
                filteredPosts.map((post, index) => (
              <TouchableOpacity 
                key={post.id} 
                style={styles.postCard}
                onPress={() => handlePostClick(post.id)}
                activeOpacity={0.7}
              >
                <View style={styles.postHeader}>
                  <Text style={styles.postDate}>{formatDate(new Date(post.created_at))}</Text>
                </View>

                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={[styles.postContent, styles.postContentTruncated]}>
                  {post.content}
                </Text>
                {post.content && post.content.length > 150 && (
                  <Text style={styles.readMoreText}>{commonT('tapToReadMore')}</Text>
                )}

                {post.image_url && (
                  <Image source={{ uri: post.image_url }} style={styles.postImage} />
                )}

                <View style={styles.postFooter}>
                  <View style={styles.reactions}>
                    {Array.isArray(post.post_reactions) && post.post_reactions.length > 0 ? (
                      <TouchableOpacity style={styles.reactionSummary}>
                        <View style={styles.reactionEmojis}>
                          {getTopReactions(post.post_reactions).map(([emoji]) => (
                            <Text key={emoji} style={styles.reactionEmoji}>{emoji}</Text>
                          ))}
                        </View>
                        <Text style={styles.reactionCount}>
                          <Text>{getReactionCount(post.post_reactions)}</Text>
                          <Text> {getReactionCount(post.post_reactions) === 1 ? commonT('reaction') : commonT('reactions')}</Text>
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View />
                    )}
                  </View>
                  
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => setShowEmojiPicker(showEmojiPicker === post.id ? null : post.id)}
                    >
                      <Smile size={16} color="#8E8E93" strokeWidth={1.5} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.actionButton}>
                      <MessageCircle size={16} color="#8E8E93" strokeWidth={1.5} />
                    </TouchableOpacity>
                  </View>
                </View>

                {showEmojiPicker === post.id && (
                  <View style={styles.emojiPicker}>
                    {['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '💪', '🎯', '⚡'].map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        style={[
                          styles.emojiButton,
                          Array.isArray(post.post_reactions) && post.post_reactions.some((r: any) => r.user_id === user?.id && r.emoji === emoji) && styles.emojiButtonActive
                        ]}
                        onPress={() => handleReaction(post.id, emoji)}
                      >
                        <Text style={styles.emojiButtonText}>{emoji}</Text>
                        {Array.isArray(post.post_reactions) && post.post_reactions.filter((r: any) => r.emoji === emoji).length > 0 && (
                          <Text style={styles.emojiButtonCount}>
                            <Text>{post.post_reactions.filter((r: any) => r.emoji === emoji).length}</Text>
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </ScrollView>

        {/* Floating Action Button */}
        {canCreatePost && onCreatePost && (
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={onCreatePost}
            activeOpacity={0.8}
          >
            <Plus size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Post Detail Modal */}
      <Modal
        isVisible={isPostModalVisible}
        onBackdropPress={() => {
          setPostModalVisible(false);
          setSelectedPostForModal(null);
        }}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{commonT('postDetails')}</Text>
            <TouchableOpacity onPress={() => {
              setPostModalVisible(false);
              setSelectedPostForModal(null);
            }}>
              <Text style={styles.cancelText}>{commonT('close')}</Text>
            </TouchableOpacity>
          </View>

          {selectedPostForModal ? (
            <ScrollView style={styles.postModalContent} showsVerticalScrollIndicator={false}>
              {/* Post Header */}
              <View style={styles.postModalHeader}>
                <Text style={styles.postModalDate}>
                  {selectedPostForModal.created_at ? formatDate(new Date(selectedPostForModal.created_at)) : 'Date not available'}
                </Text>
                <View style={styles.postModalType}>
                  <Text style={styles.postModalTypeText}>
                    {selectedPostForModal.post_type === 'organization' 
                      ? commonT('organization') 
                      : commonT('teams')
                    }
                  </Text>
                </View>
              </View>

              {/* Post Title */}
              <Text style={styles.postModalTitle}>
                {selectedPostForModal.title || 'No title available'}
              </Text>

              {/* Post Content */}
              <Text style={styles.postModalContentText}>
                {selectedPostForModal.content || 'No content available'}
              </Text>

              {/* Post Image */}
              {selectedPostForModal.image_url && (
                <Image 
                  source={{ uri: selectedPostForModal.image_url }} 
                  style={styles.postModalImage}
                  onError={() => console.log('Failed to load image:', selectedPostForModal.image_url)}
                />
              )}

              {/* Post Reactions */}
              <View style={styles.postModalReactions}>
                <Text style={styles.postModalReactionsTitle}>{commonT('reactions')}</Text>
                <View style={styles.postModalReactionsList}>
                  {Array.isArray(selectedPostForModal.post_reactions) && selectedPostForModal.post_reactions.length > 0 ? (
                    getTopReactions(selectedPostForModal.post_reactions).map(([emoji, count]) => (
                      <View key={emoji} style={styles.postModalReactionItem}>
                        <Text style={styles.postModalReactionEmoji}>{emoji}</Text>
                        <Text style={styles.postModalReactionCount}>{count as number}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.postModalNoReactions}>{commonT('noReactionsYet')}</Text>
                  )}
                </View>
              </View>

              {/* Emoji Picker in Modal */}
              {showEmojiPicker === selectedPostForModal.id && (
                <View style={styles.emojiPicker}>
                  {['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '💪', '🎯', '⚡'].map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.emojiButton,
                        Array.isArray(selectedPostForModal.post_reactions) && selectedPostForModal.post_reactions.some((r: any) => r.user_id === user?.id && r.emoji === emoji) && styles.emojiButtonActive
                      ]}
                      onPress={() => {
                        handleReaction(selectedPostForModal.id, emoji);
                        // Update the modal post data
                        const updatedPost = posts.find(p => p.id === selectedPostForModal.id);
                        if (updatedPost) {
                          setSelectedPostForModal(updatedPost);
                        }
                      }}
                    >
                      <Text style={styles.emojiButtonText}>{emoji}</Text>
                      {Array.isArray(selectedPostForModal.post_reactions) && selectedPostForModal.post_reactions.filter((r: any) => r.emoji === emoji).length > 0 && (
                        <Text style={styles.emojiButtonCount}>
                          <Text>{selectedPostForModal.post_reactions.filter((r: any) => r.emoji === emoji).length}</Text>
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          ) : (
            <View style={styles.postModalContent}>
              <View style={styles.postModalError}>
                <Text style={styles.postModalErrorTitle}>{commonT('error')}</Text>
                <Text style={styles.postModalErrorText}>
                  {commonT('somethingWentWrong')}
                </Text>
                <TouchableOpacity 
                  style={styles.postModalErrorButton}
                  onPress={() => setPostModalVisible(false)}
                >
                  <Text style={styles.postModalErrorButtonText}>{commonT('close')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    position: 'relative',
  },
  toggleContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 6,
  },
  toggleButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  postsContainer: {
    gap: 24,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postDate: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    fontFamily: 'Urbanist-SemiBold',
    letterSpacing: -0.3,
  },
  postContent: {
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 22,
    marginBottom: 20,
    fontFamily: 'Urbanist-Regular',
  },
  postContentTruncated: {
    maxHeight: 66, // Approximately 3 lines
    overflow: 'hidden',
  },
  readMoreText: {
    fontSize: 14,
    color: '#007AFF',
    fontFamily: 'Urbanist-Medium',
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reactions: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reactionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  reactionEmojis: {
    flexDirection: 'row',
    gap: 2,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  emojiPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  emojiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  emojiButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  emojiButtonText: {
    fontSize: 18,
  },
  emojiButtonCount: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A1A1A',
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
    maxHeight: '80%',
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
  postModalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  postModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  postModalDate: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  postModalType: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  postModalTypeText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  postModalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 16,
    lineHeight: 32,
  },
  postModalContentText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
    lineHeight: 24,
    marginBottom: 20,
  },
  postModalImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
  },
  postModalReactions: {
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  postModalReactionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 12,
  },
  postModalReactionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  postModalReactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  postModalReactionEmoji: {
    fontSize: 18,
  },
  postModalReactionCount: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  postModalNoReactions: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    fontStyle: 'italic',
  },
  postModalError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  postModalErrorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF3B30',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 12,
    textAlign: 'center',
  },
  postModalErrorText: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  postModalErrorButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  postModalErrorButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
  },
});
