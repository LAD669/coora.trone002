import React, { useState, useEffect } from 'react';
import { Alert, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { getTeamPosts } from '@/lib/supabase';
import { getClubPosts } from '@/lib/api/club';
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
  const [isLoading, setIsLoading] = useState(true);

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
      Alert.alert(
        'Create Post',
        'Post creation functionality will be implemented here',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'OK', onPress: () => console.log('Create post pressed') }
        ]
      );
    }
  };

  return (
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
});