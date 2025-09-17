import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Image,
} from 'react-native';
import Header from '@/components/Header';
import { MessageSquare, Search, Filter, ChevronDown, ChevronUp, Heart, ThumbsUp, Smile, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthProvider';
import { getClubOrganizationPosts, getAllClubTeams } from '@/lib/supabase';

interface OrganizationPost {
  id: string;
  title: string;
  content: string;
  image_url: string;
  post_type: 'organization';
  created_at: string;
  users: {
    id: string;
    name: string;
    first_name: string;
    last_name: string;
  };
  teams: {
    id: string;
    name: string;
    sport: string;
    color: string;
  };
  post_reactions: Array<{
    emoji: string;
    user_id: string;
  }>;
}

interface Team {
  id: string;
  name: string;
  sport: string;
  color: string;
}

export default function ManagerInfohub() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [posts, setPosts] = useState<OrganizationPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<OrganizationPost[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadClubData = async () => {
    if (!user?.clubId) {
      console.log('No club ID found for manager');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Load organization posts
      const postsData = await getClubOrganizationPosts(user.clubId);
      setPosts(postsData);
      setFilteredPosts(postsData);

      // Load all teams
      const teamsData = await getAllClubTeams(user.clubId);
      setTeams(teamsData);

    } catch (error) {
      console.error('Error loading club data:', error);
      Alert.alert('Error', 'Failed to load organization posts');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClubData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadClubData();
  }, [user?.clubId]);

  useEffect(() => {
    filterPosts();
  }, [searchQuery, selectedTeam, posts]);

  const filterPosts = () => {
    let filtered = posts;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.users?.name.toLowerCase().includes(query) ||
        post.teams?.name.toLowerCase().includes(query)
      );
    }

    // Filter by team
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(post => post.teams?.id === selectedTeam);
    }

    setFilteredPosts(filtered);
  };

  const togglePostExpansion = (postId: string) => {
    const newExpanded = new Set(expandedPosts);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedPosts(newExpanded);
  };

  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReactionCount = (post: OrganizationPost, emoji: string) => {
    return post.post_reactions?.filter(reaction => reaction.emoji === emoji).length || 0;
  };

  const renderPostCard = (post: OrganizationPost) => {
    const isExpanded = expandedPosts.has(post.id);
    const heartCount = getReactionCount(post, '❤️');
    const thumbsUpCount = getReactionCount(post, '👍');
    const smileCount = getReactionCount(post, '😊');

    return (
      <TouchableOpacity 
        key={post.id} 
        style={styles.postCard}
        onPress={() => togglePostExpansion(post.id)}
      >
        <View style={styles.postHeader}>
          <View style={styles.postHeaderLeft}>
            <View style={[styles.teamColorIndicator, { backgroundColor: post.teams?.color || '#666' }]} />
            <View style={styles.postInfo}>
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postMeta}>
                {post.users?.name} • {post.teams?.name} • {formatPostDate(post.created_at)}
              </Text>
            </View>
          </View>
          <View style={styles.postHeaderRight}>
            <MessageSquare size={20} color="#007AFF" />
            {isExpanded ? <ChevronUp size={20} color="#666" /> : <ChevronDown size={20} color="#666" />}
          </View>
        </View>

        {isExpanded && (
          <View style={styles.postContent}>
            {post.image_url && (
              <Image source={{ uri: post.image_url }} style={styles.postImage} />
            )}
            <Text style={styles.postText}>{post.content}</Text>
            
            <View style={styles.postReactions}>
              <View style={styles.reactionItem}>
                <Heart size={16} color="#FF3B30" />
                <Text style={styles.reactionCount}>{heartCount}</Text>
              </View>
              <View style={styles.reactionItem}>
                <ThumbsUp size={16} color="#007AFF" />
                <Text style={styles.reactionCount}>{thumbsUpCount}</Text>
              </View>
              <View style={styles.reactionItem}>
                <Smile size={16} color="#FF9500" />
                <Text style={styles.reactionCount}>{smileCount}</Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search organization posts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterRow}>
        <View style={styles.filterContainer}>
          <Filter size={16} color="#666" />
          <Text style={styles.filterLabel}>Team:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedTeam === 'all' && styles.filterChipActive
              ]}
              onPress={() => setSelectedTeam('all')}
            >
              <Text style={[
                styles.filterChipText,
                selectedTeam === 'all' && styles.filterChipTextActive
              ]}>
                All Teams
              </Text>
            </TouchableOpacity>
            {teams.map(team => (
              <TouchableOpacity
                key={team.id}
                style={[
                  styles.filterChip,
                  selectedTeam === team.id && styles.filterChipActive
                ]}
                onPress={() => setSelectedTeam(team.id)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedTeam === team.id && styles.filterChipTextActive
                ]}>
                  {team.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Organization Hub" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading organization posts...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Organization Hub" />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderFilters()}

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <MessageSquare size={20} color="#007AFF" />
            <Text style={styles.statText}>{filteredPosts.length} Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Heart size={20} color="#FF3B30" />
            <Text style={styles.statText}>
              {filteredPosts.reduce((sum, post) => sum + getReactionCount(post, '❤️'), 0)} Hearts
            </Text>
          </View>
        </View>

        {filteredPosts.length > 0 ? (
          filteredPosts.map(renderPostCard)
        ) : (
          <View style={styles.emptyContainer}>
            <MessageSquare size={48} color="#ccc" />
            <Text style={styles.emptyText}>No organization posts found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  filtersContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  filterRow: {
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
    marginRight: 8,
  },
  filterChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  postCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  teamColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  postInfo: {
    flex: 1,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  postMeta: {
    fontSize: 14,
    color: '#666',
  },
  postHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postContent: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 8,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 12,
  },
  postReactions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  reactionCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});
