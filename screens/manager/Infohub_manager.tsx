import React, { useState, useEffect } from 'react';
import { Alert, Modal, TextInput, TouchableOpacity, Text, View, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { createClubPost, getClubPosts } from '@/lib/supabase';
import InfoHubView from '@/screens/shared/InfoHubView';
import { Building2 } from 'lucide-react-native';

export default function InfohubManager() {
  const { t: commonT } = useTranslation('common');
  const { user } = useAuth();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
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
      // Manager: load organization posts from club_posts table
      console.log('Fetching club posts for manager:', user.clubId);
      const data = await getClubPosts(user.clubId!, 'organization');
      
      console.log('Received club posts data:', data);
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading club posts:', error);
      setPosts([]);
      console.error('Failed to load club posts:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const canCreatePost = user?.role === 'manager' || user?.role === 'admin';

  // Determine which tab the user can post to based on their role
  const getPostableTab = () => {
    if (user?.role === 'admin') return 'organization';
    if (user?.role === 'manager') return 'organization';
    return null;
  };

  const postableTab = getPostableTab();

  const openCreatePostModal = () => {
    console.log('=== openCreatePostModal called ===');
    console.log('postableTab:', postableTab);
    console.log('user role:', user?.role);
    
    if (postableTab) {
      console.log('Opening modal because postableTab is valid');
      setIsCreateOpen(true);
    } else {
      console.log('NOT opening modal because postableTab is null/undefined');
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

    if (!user?.clubId || !user?.id) {
      Alert.alert(commonT('error'), 'User data missing');
      return;
    }

    try {
      console.log('Creating club post:', {
        title: formData.title,
        body: formData.body,
        postType: 'organization',
        clubId: user.clubId,
        authorId: user.id,
      });

      const postData = {
        title: formData.title,
        content: formData.body,
        imageUrl: '', // No image support yet
        postType: 'organization' as 'organization' | 'announcement',
        clubId: user.clubId,
        authorId: user.id,
      };

      const result = await createClubPost(postData);
      console.log('Club post created successfully:', result);

      Alert.alert(commonT('success'), 'Post created successfully!');
      closeCreatePostModal();
      
      // Reload posts to show the new post
      loadPosts();
    } catch (error) {
      console.error('Error creating club post:', error);
      Alert.alert(commonT('error'), 'Failed to create post. Please try again.');
    }
  };

  // Debug logging
  console.log('InfohubManager - canCreatePost:', canCreatePost);
  console.log('InfohubManager - user role:', user?.role);
  console.log('InfohubManager - postableTab:', postableTab);
  console.log('InfohubManager - onCreatePost function:', !!openCreatePostModal);

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
                <Building2 size={16} color="#1A1A1A" strokeWidth={1.5} />
                <Text style={styles.postTypeText}>{commonT('organization')}</Text>
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
                placeholder="What's happening in your club?"
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

const styles = StyleSheet.create({
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