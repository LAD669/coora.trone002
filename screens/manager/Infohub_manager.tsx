import React, { useState, useEffect } from 'react';
import { Alert, Modal, TextInput, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { getClubPosts } from '@/lib/api/club';
import { createPost } from '@/lib/supabase';
import { Building2 } from 'lucide-react-native';
import InfoHubView from '@/screens/shared/InfoHubView';
import { useLocalSearchParams } from 'expo-router';

export default function InfohubManager() {
  const { t: commonT } = useTranslation('common');
  const { user } = useAuth();
  const params = useLocalSearchParams();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    imageUrl: '',
  });

  // Debug: Log initial state and params
  console.log('InfohubManager render - isModalVisible:', isModalVisible);
  console.log('InfohubManager render - params:', params);

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
    if (!canCreatePost) {
      Alert.alert(commonT('error'), commonT('noPermission'));
      return;
    }

    if (!user?.clubId || !user?.id) {
      Alert.alert(commonT('error'), commonT('authError'));
      return;
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      Alert.alert(commonT('error'), commonT('fillAllFields'));
      return;
    }

    console.log('Creating club post with user data:', {
      userId: user.id,
      clubId: user.clubId,
      userRole: user.role,
      postData: newPost
    });

    try {
      const postData = {
        title: newPost.title,
        content: newPost.content,
        imageUrl: newPost.imageUrl,
        postType: 'organization' as 'organization' | 'coach',
        teamId: user.clubId!, // Use clubId as teamId for club-wide posts
        authorId: user.id,
      };
      
      console.log('Calling createPost with:', postData);
      const result = await createPost(postData);
      console.log('Club post created successfully:', result);
      
      setNewPost({ title: '', content: '', imageUrl: '' });
      setModalVisible(false);
      Alert.alert(commonT('success'), commonT('postCreated'));
      loadPosts(); // Reload posts
    } catch (error) {
      console.error('Error creating club post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Full error details:', error);
      Alert.alert(commonT('error'), commonT('postCreateError'));
    }
  };

  const openCreatePostModal = () => {
    console.log('Opening create post modal');
    setModalVisible(true);
  };

  const closeCreatePostModal = () => {
    console.log('Closing create post modal');
    setModalVisible(false);
    setNewPost({ title: '', content: '', imageUrl: '' });
  };

  // Debug: Log modal state before render
  console.log('About to render - isModalVisible:', isModalVisible, 'canCreatePost:', canCreatePost);

  return (
    <>
      <InfoHubView
        posts={posts}
        isLoading={isLoading}
        onRefresh={loadPosts}
        onCreatePost={canCreatePost ? openCreatePostModal : undefined}
        headerSubtitle="Stay updated with club news and announcements"
        canCreatePost={canCreatePost}
        showToggle={false} // Managers don't need toggle since they only see organization posts
        activeTab="organization"
      />

      {/* Create Post Modal */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={closeCreatePostModal}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{commonT('createUpdate')}</Text>
            <TouchableOpacity onPress={closeCreatePostModal}>
              <Text style={styles.cancelText}>{commonT('cancel')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalToggle}>
            <Text style={styles.modalToggleLabel}>{commonT('postTo')}</Text>
            <View style={styles.selectedPostType}>
              <View style={styles.postTypeDisplay}>
                <Building2 size={16} color="#1A1A1A" strokeWidth={1.5} />
                <Text style={styles.postTypeText}>{commonT('organization')}</Text>
              </View>
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
            placeholder="Was gibt es Neues in der Organisation?"
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

const styles = StyleSheet.create({
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