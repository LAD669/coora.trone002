import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useNavigationReady } from '@/hooks/useNavigationReady';
import Header from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, Phone, Mail, Hash, Ruler, Weight, Calendar } from 'lucide-react-native';

export default function PlayerDetailScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams();
  const { safeBack } = useNavigationReady();
  const player = params.player ? JSON.parse(params.player as string) : null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  if (!player) {
    return (
      <View style={styles.container}>
        <Header title={t('player.details')} />
        <View style={styles.centerContainer}>
          <User size={48} color="#E5E5E7" strokeWidth={1} />
          <Text style={styles.emptyText}>Player not found</Text>
        </View>
      </View>
    );
  }

  const playerName = `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Unknown Player';

  return (
    <View style={styles.container}>
      <Header title={t('player.details')} showBackButton onBackPress={() => safeBack()} />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Player Basic Info Card */}
        <View style={styles.card}>
          <View style={styles.playerHeader}>
            <View style={styles.playerAvatar}>
              <Text style={styles.playerInitials}>
                {getInitials(playerName)}
              </Text>
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{playerName}</Text>
              <Text style={styles.playerRole}>{player.role}</Text>
              {player.position && (
                <Text style={styles.playerPosition}>{player.position}</Text>
              )}
              {player.jersey_number && (
                <View style={styles.jerseyNumber}>
                  <Text style={styles.jerseyNumberText}>#{player.jersey_number}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Personal Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          <View style={styles.infoList}>
            {player.height_cm && (
              <View style={styles.infoItem}>
                <Ruler size={16} color="#8E8E93" strokeWidth={1.5} />
                <Text style={styles.infoLabel}>Height</Text>
                <Text style={styles.infoValue}>{player.height_cm} cm</Text>
              </View>
            )}
            {player.weight_kg && (
              <View style={styles.infoItem}>
                <Weight size={16} color="#8E8E93" strokeWidth={1.5} />
                <Text style={styles.infoLabel}>Weight</Text>
                <Text style={styles.infoValue}>{player.weight_kg} kg</Text>
              </View>
            )}
            {player.phone_number && (
              <View style={styles.infoItem}>
                <Phone size={16} color="#8E8E93" strokeWidth={1.5} />
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{player.phone_number}</Text>
              </View>
            )}
            {player.email && (
              <View style={styles.infoItem}>
                <Mail size={16} color="#8E8E93" strokeWidth={1.5} />
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{player.email}</Text>
              </View>
            )}
            {player.date_of_birth && (
              <View style={styles.infoItem}>
                <Calendar size={16} color="#8E8E93" strokeWidth={1.5} />
                <Text style={styles.infoLabel}>Date of Birth</Text>
                <Text style={styles.infoValue}>{player.date_of_birth}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Team Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Team Information</Text>
          <View style={styles.infoList}>
            {player.team_id && (
              <View style={styles.infoItem}>
                <Hash size={16} color="#8E8E93" strokeWidth={1.5} />
                <Text style={styles.infoLabel}>Team ID</Text>
                <Text style={styles.infoValue}>{player.team_id}</Text>
              </View>
            )}
            {player.team_member_id && (
              <View style={styles.infoItem}>
                <User size={16} color="#8E8E93" strokeWidth={1.5} />
                <Text style={styles.infoLabel}>Member ID</Text>
                <Text style={styles.infoValue}>{player.team_member_id}</Text>
              </View>
            )}
            {player.joined_at && (
              <View style={styles.infoItem}>
                <Calendar size={16} color="#8E8E93" strokeWidth={1.5} />
                <Text style={styles.infoLabel}>Joined</Text>
                <Text style={styles.infoValue}>{new Date(player.joined_at).toLocaleDateString()}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    fontFamily: 'Urbanist-SemiBold',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  playerInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: '#495057',
    fontFamily: 'Urbanist-Bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    fontFamily: 'Urbanist-Bold',
    marginBottom: 4,
  },
  playerRole: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C757D',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  playerPosition: {
    fontSize: 14,
    color: '#6C757D',
    fontFamily: 'Urbanist-Regular',
    marginBottom: 8,
  },
  jerseyNumber: {
    backgroundColor: '#212529',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  jerseyNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-Bold',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginLeft: 12,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
    fontFamily: 'Urbanist-Medium',
  },
}); 