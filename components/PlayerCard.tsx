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
        <View style={styles.profileImage}>
          <Text style={styles.profileInitials}>
            {getInitials(name)}
          </Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{name}</Text>
          {position && <Text style={styles.position}>{position}</Text>}
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
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    padding: 16,
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
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#495057',
    fontFamily: 'Urbanist-Bold',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212529',
    fontFamily: 'Urbanist-Bold',
    marginBottom: 2,
  },
  position: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C757D',
    fontFamily: 'Urbanist-Medium',
  },
  numberPill: {
    backgroundColor: '#212529',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  numberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-Bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212529',
    fontFamily: 'Urbanist-Bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6C757D',
    fontFamily: 'Urbanist-Medium',
  },
});

export default PlayerCard; 