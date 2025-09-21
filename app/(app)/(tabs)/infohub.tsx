import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import Modal from 'react-native-modal';
import { TextInput, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Building2, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { getTeamPosts, getClubPosts, createPost } from '@/lib/supabase';
import InfoHubView from '@/screens/shared/InfoHubView';

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
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    imageUrl: '',
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

  const handleCreatePost = async () => {
    if (!canCreatePost || !postableTab) {
      Alert.alert(commonT('error'), commonT('noPermission'));
      return;
    }

    if (!user?.teamId || !user?.id) {
      Alert.alert(commonT('error'), commonT('authError'));
      return;
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      Alert.alert(commonT('error'), commonT('fillAllFields'));
      return;
    }

    console.log('Creating post with user data:', {
      userId: user.id,
      teamId: user.teamId,
      userRole: user.role,
      postData: newPost,
      activeTab
    });
    try {

      const postData = {
        title: newPost.title,
        content: newPost.content,
        imageUrl: newPost.imageUrl,
        postType: (postableTab === 'teams' ? 'coach' : postableTab) as 'organization' | 'coach', // Map 'teams' to 'coach' for backend compatibility
        teamId: user.teamId!,
        authorId: user.id,
      };
      
      console.log('Calling createPost with:', postData);
      const result = await createPost(postData);
      console.log('Post created successfully:', result);
      
      setNewPost({ title: '', content: '', imageUrl: '' });
      setModalVisible(false);
      Alert.alert(commonT('success'), commonT('postCreated'));
      loadPosts(); // Reload posts
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Full error details:', error);
      Alert.alert(commonT('error'), commonT('postCreateError'));
    }
  };

  const openCreatePostModal = () => {
    if (postableTab) {
      setActiveTab(postableTab);
      setModalVisible(true);
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
        isVisible={isModalVisible}
        onBackdropPress={() => {
          setModalVisible(false);
          setNewPost({ title: '', content: '', imageUrl: '' });
        }}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{commonT('createUpdate')}</Text>
            <TouchableOpacity onPress={() => {
              setModalVisible(false);
              setNewPost({ title: '', content: '', imageUrl: '' });
            }}>
              <Text style={styles.cancelText}>{commonT('cancel')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalToggle}>
            <Text style={styles.modalToggleLabel}>{commonT('postTo')}</Text>
            <View style={styles.selectedPostType}>
              {postableTab === 'organization' ? (
                <View style={styles.postTypeDisplay}>
                  <Building2 size={16} color="#1A1A1A" strokeWidth={1.5} />
                  <Text style={styles.postTypeText}>{commonT('organization')}</Text>
                </View>
              ) : (
                <View style={styles.postTypeDisplay}>
                  <Users size={16} color="#1A1A1A" strokeWidth={1.5} />
                  <Text style={styles.postTypeText}>{commonT('teams')}</Text>
                </View>
              )}
            </View>
          </View>

          <TextInput
            style={styles.titleInput}
            placeholder={commonT('updateTitle')}
            value={newPost.title}
            onChangeText={(text) => setNewPost({ ...newPost, title: text })}
            placeholderTextColor="#8E8E93"
          />

          <TextInput
            style={styles.contentInput}
            placeholder={
              activeTab === 'organization' 
                ? "Was gibt es Neues in der Organisation?"
                : "Was passiert mit dem Team?"
            }
            value={newPost.content}
            onChangeText={(text) => setNewPost({ ...newPost, content: text })}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            placeholderTextColor="#8E8E93"
          />

          <TouchableOpacity
            style={styles.publishButton}
            onPress={handleCreatePost}
          >
            <Text style={styles.publishButtonText}>{commonT('publishUpdate')}</Text>
          </TouchableOpacity>
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
  modalToggle: {
    marginBottom: 24,
  },
  modalToggleLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    fontFamily: 'Urbanist-Regular',
  },
  selectedPostType: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  postTypeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  postTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
  },
  titleInput: {
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 16,
    fontFamily: 'Urbanist-Regular',
  },
  contentInput: {
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 16,
    height: 120,
    marginBottom: 24,
    fontFamily: 'Urbanist-Regular',
  },
  publishButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  publishButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
});