import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PlayerCardProps {
  name: string;
  position?: string;
  jerseyNumber?: number;
  profile_picture?: string;
  backgroundColor?: string;
  onPress?: () => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  position,
  jerseyNumber,
  profile_picture,
  backgroundColor = '#FFFFFF',
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
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Goals</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>8</Text>
          <Text style={styles.statLabel}>Assists</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>15</Text>
          <Text style={styles.statLabel}>Matches</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>18</Text>
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
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    padding: 20,
    paddingBottom: 16,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Bold',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Bold',
    marginBottom: 2,
  },
  position: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'Urbanist-Medium',
  },
  numberPill: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  numberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-Bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'Urbanist-Medium',
  },
});

export default PlayerCard; 