import React, { useState, useEffect } from 'react';
import { Alert, TouchableOpacity, Text, View, StyleSheet, Modal, TextInput, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { getTeamPosts, createPost, createClubPost } from '@/lib/supabase';
import { getClubPosts } from '@/lib/api/club';
import InfoHubView from '@/screens/shared/InfoHubView';
import { Building2, Users } from 'lucide-react-native';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType<{ error: Error; retry: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('InfoHub Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      return (
        <FallbackComponent 
          error={this.state.error!} 
          retry={() => this.setState({ hasError: false, error: null })} 
        />
      );
    }

    return this.props.children;
  }
}

// Error Fallback Component
function ErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={retry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

function InfohubScreenContent() {
  const { t: commonT } = useTranslation('common');
  const { user, isManager } = useAuth();
  
  // Early return if user is not available
  if (!user) {
    return null;
  }
  
  const [activeTab, setActiveTab] = useState<'organization' | 'teams'>('organization');
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
  });

  // Load posts from Supabase
  useEffect(() => {
    if (user?.teamId && user?.id) {
      console.log('Loading posts for user:', user.id, 'team:', user.teamId, 'tab:', activeTab);
      loadPosts();
    } else {
      console.log('User not ready for loading posts:', { userId: user?.id, teamId: user?.teamId });
      setIsLoading(false);
    }
  }, [activeTab, user]);

  const loadPosts = async () => {
    if (!user?.id) {
      console.log('Cannot load posts - missing user data:', { userId: user?.id });
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      let data;
      if (isManager && user.clubId) {
        // Manager: load organization posts from entire club
        console.log('Fetching club posts for manager:', user.clubId);
        data = await getClubPosts(user.clubId, 'organization');
      } else if (user.teamId) {
        // Regular user: load team posts
        console.log('Fetching posts for team:', user.teamId, 'type:', activeTab);
        // Map 'teams' to 'coach' for backend compatibility
        const postType = activeTab === 'teams' ? 'coach' : activeTab;
        data = await getTeamPosts(user.teamId, postType);
      } else {
        console.log('No teamId or clubId available');
        data = [];
      }
      
      console.log('Received posts data:', data);
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
      // Don't show alert for loading errors, just log them
      console.error('Failed to load posts:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const canCreatePost = user?.role === 'trainer' || user?.role === 'admin';

  // Determine which tab the user can post to based on their role
  const getPostableTab = () => {
    if (user?.role === 'admin') return 'organization';
    if (user?.role === 'trainer') return 'teams';
    return null;
  };

  const postableTab = getPostableTab();


  const openCreatePostModal = () => {
    if (postableTab) {
      setActiveTab(postableTab);
      setIsCreateOpen(true);
    }
  };

  const closeCreatePostModal = () => {
    setIsCreateOpen(false);
    setFormData({ title: '', body: '' });
  };

  const handlePublish = async () => {
    if (!formData.title.trim() || !formData.body.trim()) {
      Alert.alert(commonT('error'), commonT('fillAllFields'));
      return;
    }

    if (!user?.id) {
      Alert.alert(commonT('error'), 'User data missing');
      return;
    }

    try {
      let result;
      
      if (isManager && user.clubId) {
        // Manager creating club post
        const postData = {
          title: formData.title,
          content: formData.body,
          imageUrl: '', // No image support yet
          postType: 'organization' as 'organization' | 'announcement',
          clubId: user.clubId,
          authorId: user.id,
        };
        result = await createClubPost(postData);
      } else if (user.teamId) {
        // Regular user creating team post
        const postData = {
          title: formData.title,
          content: formData.body,
          imageUrl: '', // No image support yet
          postType: (postableTab === 'teams' ? 'coach' : 'organization') as 'organization' | 'coach',
          teamId: user.teamId,
          authorId: user.id,
        };
        result = await createPost(postData);
      } else {
        Alert.alert(commonT('error'), 'Missing team or club information');
        return;
      }

      console.log('Post created successfully:', result);
      Alert.alert(commonT('success'), 'Post created successfully!');
      closeCreatePostModal();
      
      // Reload posts to show the new post
      loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert(commonT('error'), 'Failed to create post. Please try again.');
    }
  };

  return (
    <>
      <InfoHubView
        posts={posts}
        isLoading={isLoading}
        onRefresh={loadPosts}
        onCreatePost={canCreatePost ? openCreatePostModal : undefined}
        canCreatePost={canCreatePost}
        showToggle={!isManager} // Only show toggle for non-managers
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Create Post Modal */}
      <Modal
        visible={isCreateOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeCreatePostModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{commonT('createUpdate')}</Text>
            <TouchableOpacity onPress={closeCreatePostModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Post Type Display */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{commonT('postTo')}</Text>
              <View style={styles.postTypeDisplay}>
                {postableTab === 'organization' ? (
                  <>
                    <Building2 size={16} color="#1A1A1A" strokeWidth={1.5} />
                    <Text style={styles.postTypeText}>{commonT('organization')}</Text>
                  </>
                ) : (
                  <>
                    <Users size={16} color="#1A1A1A" strokeWidth={1.5} />
                    <Text style={styles.postTypeText}>{commonT('teams')}</Text>
                  </>
                )}
              </View>
            </View>

            {/* Title Input */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{commonT('updateTitle')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter update title..."
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholderTextColor="#8E8E93"
              />
            </View>

            {/* Body Input */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Content</Text>
              <TextInput
                style={[styles.textInput, styles.bodyInput]}
                placeholder="What's happening in your team?"
                value={formData.body}
                onChangeText={(text) => setFormData({ ...formData, body: text })}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholderTextColor="#8E8E93"
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={closeCreatePostModal}>
              <Text style={styles.cancelButtonText}>{commonT('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.publishButton} onPress={handlePublish}>
              <Text style={styles.publishButtonText}>{commonT('publishUpdate')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function InfohubScreen() {
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <InfohubScreenContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 12,
    fontFamily: 'Urbanist-Medium',
  },
  postTypeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    gap: 8,
  },
  postTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  bodyInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
  },
  publishButton: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-Medium',
  },
});