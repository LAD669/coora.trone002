import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSession, useAuth } from '@/contexts/AuthProvider';

export default function SessionStateTester() {
  const { session, loading, userId } = useSession();
  const { user } = useAuth();

  const getSessionState = () => {
    if (session === undefined) return 'UNDEFINED (initializing)';
    if (session === null) return 'NULL (no session)';
    return 'VALID SESSION';
  };

  const getSessionUserState = () => {
    if (session === undefined) return 'Cannot access (initializing)';
    if (session === null) return 'Cannot access (no session)';
    if (!session.user) return 'NULL (no user in session)';
    return `VALID (${session.user.email || 'no email'})`;
  };

  const getUserIdState = () => {
    if (session === undefined) return 'Cannot access (initializing)';
    if (session === null) return 'Cannot access (no session)';
    if (!session.user) return 'Cannot access (no user)';
    return session.user.id || 'NULL (no id)';
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Session State Tester</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session States</Text>
        <Text style={styles.text}>Loading: {loading ? 'true' : 'false'}</Text>
        <Text style={styles.text}>Session: {getSessionState()}</Text>
        <Text style={styles.text}>Session.user: {getSessionUserState()}</Text>
        <Text style={styles.text}>Session.user.id: {getUserIdState()}</Text>
        <Text style={styles.text}>userId (from hook): {userId || 'null'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Profile</Text>
        <Text style={styles.text}>User exists: {user ? 'true' : 'false'}</Text>
        {user && (
          <>
            <Text style={styles.text}>User ID: {user.id}</Text>
            <Text style={styles.text}>User name: {user.name}</Text>
            <Text style={styles.text}>User email: {user.email}</Text>
            <Text style={styles.text}>User role: {user.role}</Text>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safe Access Test</Text>
        <Text style={styles.text}>
          {session === undefined 
            ? '✅ SAFE: Session is undefined (initializing)'
            : session === null
            ? '✅ SAFE: Session is null (no session)'
            : session?.user
            ? '✅ SAFE: Session and user exist'
            : '❌ UNSAFE: Session exists but no user'
          }
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Navigation State</Text>
        <Text style={styles.text}>
          {session === undefined 
            ? '🔄 Should show loading screen'
            : session === null
            ? '🔐 Should redirect to login'
            : session?.user && user?.id
            ? '🏠 Should show main app'
            : '⚠️ Should redirect to login (incomplete session)'
          }
        </Text>
      </View>
    </ScrollView>
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
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  text: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
}); 