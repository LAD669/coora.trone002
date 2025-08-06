import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSession, useAuth } from '@/contexts/AuthProvider';

export default function SessionDebugger() {
  const { session, loading, userId } = useSession();
  const { user } = useAuth();

  const getSessionStatus = () => {
    if (session === undefined) return 'initializing';
    if (session === null) return 'null (no session)';
    return 'exists (valid session)';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session Debug Info</Text>
      <Text style={styles.text}>Loading: {loading ? 'true' : 'false'}</Text>
      <Text style={styles.text}>Session status: {getSessionStatus()}</Text>
      <Text style={styles.text}>Session user exists: {session?.user ? 'true' : 'false'}</Text>
      <Text style={styles.text}>User ID: {userId || 'null'}</Text>
      <Text style={styles.text}>User profile exists: {user ? 'true' : 'false'}</Text>
      {user && (
        <Text style={styles.text}>User name: {user.name}</Text>
      )}
      {session?.user && (
        <Text style={styles.text}>Session user email: {session.user.email}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  text: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
}); 