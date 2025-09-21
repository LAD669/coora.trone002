import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { getClubPosts } from '@/lib/api/club';
import { createPost } from '@/lib/supabase';
import InfoHubView from '@/screens/shared/InfoHubView';

export default function InfohubManager() {
  const { t: commonT } = useTranslation('common');
  const { user } = useAuth();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    // This would open a modal for creating posts
    // For now, we'll just show an alert
    Alert.alert('Create Post', 'Post creation functionality will be implemented here');
  };

  return (
    <InfoHubView
      posts={posts}
      isLoading={isLoading}
      onRefresh={loadPosts}
      onCreatePost={canCreatePost ? handleCreatePost : undefined}
      headerSubtitle="Stay updated with club news and announcements"
      canCreatePost={canCreatePost}
      showToggle={false} // Managers don't need toggle since they only see organization posts
      activeTab="organization"
    />
  );
}