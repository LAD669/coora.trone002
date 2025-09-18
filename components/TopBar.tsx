import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell, Settings } from 'lucide-react-native';
import { router } from 'expo-router';

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  const handleNotificationsPress = () => {
    router.push('/(app)/notifications');
  };

  const handleSettingsPress = () => {
    router.push('/(app)/settings');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleNotificationsPress}
          activeOpacity={0.7}
        >
          <Bell size={24} color="#1A1A1A" strokeWidth={1.5} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleSettingsPress}
          activeOpacity={0.7}
        >
          <Settings size={24} color="#1A1A1A" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Urbanist-SemiBold',
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
