import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PlayerCardProps {
  name: string;
  position?: string;
  jerseyNumber?: number;
  profile_picture?: string;
  backgroundColor?: string;
  goals?: number;
  assists?: number;
  trainingsAccepted?: number;
  role?: 'trainer' | 'player' | 'admin' | 'parent';
  onPress?: () => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  position,
  jerseyNumber,
  profile_picture,
  backgroundColor = '#F8F9FA',
  goals,
  assists,
  trainingsAccepted,
  role,
  onPress,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const CardContent = () => (
    <View style={[styles.card, { backgroundColor }]}>
      {/* Main content row */}
      <View style={styles.mainRow}>
        <View style={[styles.profileImage, role === 'trainer' && styles.trainerProfileImage]}>
          <Text style={styles.profileInitials}>
            {getInitials(name)}
          </Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.positionRow}>
            {position && <Text style={styles.position}>{position}</Text>}
            {role === 'trainer' && (
              <View style={styles.trainerBadge}>
                <Text style={styles.trainerBadgeText}>Trainer</Text>
              </View>
            )}
          </View>
        </View>
        {jerseyNumber && (
          <View style={styles.numberPill}>
            <Text style={styles.numberText}>#{jerseyNumber}</Text>
          </View>
        )}
      </View>
      
      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{goals || 0}</Text>
          <Text style={styles.statLabel}>Goals</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{assists || 0}</Text>
          <Text style={styles.statLabel}>Assists</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{trainingsAccepted || 0}</Text>
          <Text style={styles.statLabel}>Trainings</Text>
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.touchableContainer}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

const styles = StyleSheet.create({
  touchableContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
    width: 'auto',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInitials: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 4,
  },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  position: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  trainerBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  trainerBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1976D2',
    fontFamily: 'Urbanist-Medium',
  },
  trainerProfileImage: {
    backgroundColor: '#E3F2FD',
  },
  numberPill: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  numberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-SemiBold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
});

export default PlayerCard; 