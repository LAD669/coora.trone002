import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSession, useAuth } from '@/contexts/AuthProvider';

export default function ExampleSessionUsage() {
  const { session, loading, userId } = useSession();
  const { user } = useAuth();

  // Show loading state while session is being loaded
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading session...</Text>
      </View>
    );
  }

  // Show loading state while still initializing
  if (session === undefined) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Initializing session...</Text>
      </View>
    );
  }

  // Safe session access - check if session and user exist
  if (session === null || !session?.user || !userId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No valid session found</Text>
      </View>
    );
  }

  // Now we can safely access session.user properties
  const sessionUser = session.user;
  const userName = (sessionUser as any).name || 'Unknown User';
  const userEmail = sessionUser.email || 'No email';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session Information</Text>
      <Text style={styles.text}>User ID: {userId}</Text>
      <Text style={styles.text}>Name: {userName}</Text>
      <Text style={styles.text}>Email: {userEmail}</Text>
      
      {/* Safe access to user profile data */}
      {user && (
        <View style={styles.profileSection}>
          <Text style={styles.subtitle}>Profile Information</Text>
          <Text style={styles.text}>Role: {user.role}</Text>
          {user.teamId && <Text style={styles.text}>Team ID: {user.teamId}</Text>}
          {user.clubId && <Text style={styles.text}>Club ID: {user.clubId}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  profileSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
}); 