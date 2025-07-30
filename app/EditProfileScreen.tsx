import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { X, Save } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { updateUserProfile, checkUserProfile, createUserProfile } from '@/lib/supabase';

export default function EditProfileScreen() {
  const { language, t } = useLanguage();
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    role: 'player' as 'player' | 'trainer' | 'admin' | 'parent',
    team_id: undefined as string | undefined,
    club_id: undefined as string | undefined,
  });

  // Load or create user profile when component mounts
  useEffect(() => {
    if (user?.id) {
      loadOrCreateProfile();
    }
  }, [user?.id]);

  const loadOrCreateProfile = async () => {
    if (!user?.id || !user?.email) return;

    try {
      setIsLoading(true);
      
      // Check if profile exists
      const existingProfile = await checkUserProfile(user.id);
      
      if (existingProfile) {
        console.log('Found existing profile:', existingProfile);
        setProfile({
          first_name: existingProfile.first_name || '',
          last_name: existingProfile.last_name || '',
          email: existingProfile.email || user.email,
          phone_number: existingProfile.phone_number || '',
          role: existingProfile.role || 'player',
          team_id: existingProfile.team_id,
          club_id: existingProfile.club_id,
        });
      } else {
        console.log('Creating new profile for user:', user.id);
        // Create new profile with default values
        const newProfile = await createUserProfile({
          id: user.id,
          email: user.email,
          role: 'player',
          first_name: '',
          last_name: '',
          team_id: user.teamId,
          club_id: user.clubId,
        });

        setProfile({
          first_name: newProfile.first_name || '',
          last_name: newProfile.last_name || '',
          email: newProfile.email,
          phone_number: newProfile.phone_number || '',
          role: newProfile.role || 'player',
          team_id: newProfile.team_id,
          club_id: newProfile.club_id,
        });
      }
    } catch (error) {
      console.error('Error loading/creating profile:', error);
      Alert.alert(t.error, t.somethingWentWrong);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    // Validate required fields
    if (!profile.first_name.trim() || !profile.last_name.trim()) {
      Alert.alert(t.error, t.fillAllFields);
      return;
    }

    try {
      setIsLoading(true);

      // Update profile in Supabase
      const updatedProfile = await updateUserProfile(user.id, {
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim(),
        name: `${profile.first_name.trim()} ${profile.last_name.trim()}`,
        phone_number: profile.phone_number.trim() || undefined,
      });

      // Update local user state
      setUser({
        ...user,
        name: updatedProfile.name,
      });

      Alert.alert(t.success, t.profileUpdated);
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : t.somethingWentWrong;
      Alert.alert(t.error, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A1A1A" />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t.error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X size={24} color="#1A1A1A" strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.editProfile}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Form Section */}
        <View style={styles.formSection}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t.firstName} *</Text>
            <TextInput
              style={styles.formInput}
              value={profile.first_name}
              onChangeText={(text) => setProfile(prev => ({ ...prev, first_name: text }))}
              placeholder={t.firstName}
              placeholderTextColor="#8E8E93"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t.lastName} *</Text>
            <TextInput
              style={styles.formInput}
              value={profile.last_name}
              onChangeText={(text) => setProfile(prev => ({ ...prev, last_name: text }))}
              placeholder={t.lastName}
              placeholderTextColor="#8E8E93"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t.phoneNumber}</Text>
            <TextInput
              style={styles.formInput}
              value={profile.phone_number}
              onChangeText={(text) => setProfile(prev => ({ ...prev, phone_number: text }))}
              placeholder={t.phoneNumber}
              placeholderTextColor="#8E8E93"
              keyboardType="phone-pad"
            />
          </View>

          {/* Read-only fields */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t.email}</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>{profile.email}</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t.role}</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>{profile.role.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={isLoading}
        >
          <Save size={16} color="#FFFFFF" strokeWidth={1.5} />
          <Text style={styles.saveButtonText}>
            {isLoading ? t.loading : t.saveChanges}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 20,
    gap: 20,
    marginTop: 16,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
    backgroundColor: '#FFFFFF',
  },
  readOnlyField: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    gap: 8,
    marginTop: 24,
    marginBottom: 32,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Urbanist-Medium',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
}); 