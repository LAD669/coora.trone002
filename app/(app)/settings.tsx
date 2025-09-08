import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthProvider';
import { X, User, Bell, Shield, Globe, CircleHelp as HelpCircle, LogOut, ChevronRight, Key, Lock, UserPlus, Camera } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useNavigationReady } from '@/hooks/useNavigationReady';
import { storage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import LanguageSelector from '@/components/LanguageSelector';

interface StoredSession {
  id: string;
  user: {
    email: string;
    name: string;
    role: string;
  };
  access_token: string;
  refresh_token: string;
}

interface SettingItemProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightComponent?: React.ReactNode;
}

export default function SettingsScreen() {
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();
  const { safeReplace, safePush } = useNavigationReady();
  
  const { permissions, requestPermission, isLoading: permissionsLoading } = usePermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [storedSessions, setStoredSessions] = useState<StoredSession[]>([]);
  const [currentSession, setCurrentSession] = useState<StoredSession | null>(null);
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);

  useEffect(() => {
    loadStoredSessions();
  }, []);

  // Early return if user is not available
  if (!user) {
    return null;
  }

  const loadStoredSessions = async () => {
    try {
      const sessionsStr = await storage.getItem('stored_sessions');
      if (sessionsStr) {
        const sessions = JSON.parse(sessionsStr);
        setStoredSessions(sessions);
        
        // Set current session
        const currentSessionStr = await storage.getItem('current_session');
        if (currentSessionStr) {
          setCurrentSession(JSON.parse(currentSessionStr));
        }
      }
    } catch (error) {
      console.error('Error loading stored sessions:', error);
    }
  };

  const switchToAccount = async (session: StoredSession) => {
    if (!session || !session.access_token || !session.refresh_token) {
      Alert.alert(t('common.error'), t('common.invalidSessionData'));
      return;
    }

    try {
      setIsLoading(true);
      
      // Set the session in Supabase
      const { error } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      if (error) throw error;

      // Update current session in storage
      await storage.setItem('current_session', JSON.stringify(session));
      setCurrentSession(session);

      // Refresh the page to update the UI
      safeReplace('/(app)/(tabs)');
    } catch (error) {
      Alert.alert(t('common.error'), t('common.switchAccountFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const addNewAccount = () => {
    // Store current session before logging out
    if (user) {
      const currentSession = {
        id: user.id,
        user: {
          email: user.email,
          name: user.name,
          role: user.role,
        },
        access_token: '', // Get from current session
        refresh_token: '', // Get from current session
      };
      
      // Navigate to login screen
      safePush('/(auth)/login');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('auth.signOut'),
      t('common.confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('auth.signOut'), 
          style: 'destructive',
          onPress: performLogout
        }
      ]
    );
  };

  const performLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred during logout';
      Alert.alert(t('common.error'), errorMessage);
    }
  };

  const handleLanguageChange = (newLanguage: 'en' | 'de') => {
    const languageName = newLanguage === 'en' ? 'English' : 'Deutsch';
    setLanguage(newLanguage);
    setLanguageModalVisible(false);
    Alert.alert(
      t('settings.languageChanged'),
      t('settings.languageChangedMessage', { language: languageName })
    );
  };

  const handleRequestNotificationPermissions = async () => {
    const granted = await requestPermission('notifications', false);
    if (granted) {
      Alert.alert('Success', 'Notification permissions granted!');
    }
  };

  const handleRequestCameraPermissions = async () => {
    const granted = await requestPermission('camera', false);
    if (granted) {
      Alert.alert('Success', 'Camera permissions granted!');
    }
  };

  const handleToggle2FA = () => {
    if (!twoFactorAuth) {
      Alert.alert(
        t('settings.enableTwoFactor'),
        t('settings.enableTwoFactorMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { 
            text: t('common.enable'), 
            onPress: () => {
              setTwoFactorAuth(true);
              Alert.alert(
                t('common.success'),
                `${t('settings.twoFactorAuth')} ${t('common.enabled').toLowerCase()}!`
              );
            }
          }
        ]
      );
    } else {
      Alert.alert(
        t('settings.disableTwoFactor'),
        t('settings.disableTwoFactorMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { 
            text: t('common.disable'), 
            style: 'destructive',
            onPress: () => {
              setTwoFactorAuth(false);
              Alert.alert(
                t('settings.disabled'),
                `${t('settings.twoFactorAuth')} ${t('common.disabled').toLowerCase()}.`
              );
            }
          }
        ]
      );
    }
  };

  const ProfileCard = () => {
    if (!user) return null;

    const initials = user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();

    return (
      <TouchableOpacity 
        style={styles.profileCard}
                      onPress={() => safePush('/(app)/EditProfileScreen')}
      >
        <View style={styles.profileAvatarContainer}>
          <View style={styles.profileInitialsContainer}>
            <Text style={styles.profileInitials}>{initials}</Text>
          </View>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
          </View>
        </View>
        <ChevronRight size={20} color="#8E8E93" strokeWidth={1.5} />
      </TouchableOpacity>
    );
  };

  const SettingItem: React.FC<SettingItemProps> = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onPress, 
    showChevron = true,
    rightComponent 
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIconContainer}>
          <Icon size={20} color="#1A1A1A" strokeWidth={1.5} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showChevron && !rightComponent && (
          <ChevronRight size={16} color="#8E8E93" strokeWidth={1.5} />
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A1A1A" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.error')}</Text>
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
                      onPress={() => safePush('/(app)/(tabs)')}
        >
          <X size={24} color="#1A1A1A" strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <ProfileCard />

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon={Key}
              title={t('settings.changePassword')}
              subtitle={t('settings.updatePassword')}
              onPress={() => Alert.alert(t('common.comingSoon'), t('settings.changePasswordComingSoon'))}
            />
            <SettingItem
              icon={Shield}
              title={t('settings.privacySecurity')}
              subtitle={t('settings.privacySettings')}
              onPress={() => Alert.alert(t('common.comingSoon'), t('settings.privacySettingsComingSoon'))}
            />
          </View>
        </View>

        {/* Accounts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.accounts')}</Text>
          <View style={styles.settingsGroup}>
            {storedSessions.map((session) => {
              // Safe session access
              if (!session?.user) return null;
              
              // Store user in variable for safe access
              const sessionUser = session.user;
              
              return (
                <SettingItem
                  key={session?.id || 'unknown'}
                  icon={User}
                  title={sessionUser.name || 'Unknown User'}
                  subtitle={sessionUser.email || 'No email'}
                  onPress={() => session && switchToAccount(session)}
                  rightComponent={
                    currentSession?.id === session?.id && (
                      <View style={styles.activeAccountBadge}>
                        <Text style={styles.activeAccountText}>Active</Text>
                      </View>
                    )
                  }
                />
              );
            })}
            <SettingItem
              icon={UserPlus}
              title="Add Another Account"
              subtitle="Sign in with a different account"
              onPress={addNewAccount}
            />
          </View>
        </View>

        {/* Permissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon={Bell}
              title="Notifications"
              subtitle={permissions.notifications ? "Granted" : "Not granted"}
              onPress={handleRequestNotificationPermissions}
              rightComponent={
                permissionsLoading ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Text style={[
                    styles.permissionStatus,
                    { color: permissions.notifications ? '#34C759' : '#FF3B30' }
                  ]}>
                    {permissions.notifications ? "Granted" : "Request"}
                  </Text>
                )
              }
              showChevron={false}
            />
            <SettingItem
              icon={Camera}
              title="Camera"
              subtitle={permissions.camera ? "Granted" : "Not granted"}
              onPress={handleRequestCameraPermissions}
              rightComponent={
                permissionsLoading ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Text style={[
                    styles.permissionStatus,
                    { color: permissions.camera ? '#34C759' : '#FF3B30' }
                  ]}>
                    {permissions.camera ? "Granted" : "Request"}
                  </Text>
                )
              }
              showChevron={false}
            />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon={Globe}
              title={t('settings.language')}
              subtitle={language === 'en' ? 'English' : 'Deutsch'}
              onPress={() => setLanguageModalVisible(true)}
            />
            <SettingItem
              icon={Bell}
              title={t('settings.notifications')}
              subtitle={t('settings.notificationPreferences')}
              rightComponent={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#E5E5E7', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              }
              showChevron={false}
            />
            <SettingItem
              icon={Lock}
              title={t('settings.twoFactorAuth')}
              subtitle={twoFactorAuth ? t('settings.enabled') : t('settings.disabled')}
              rightComponent={
                <Switch
                  value={twoFactorAuth}
                  onValueChange={handleToggle2FA}
                  trackColor={{ false: '#E5E5E7', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              }
              showChevron={false}
            />
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.app')}</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon={HelpCircle}
              title={t('settings.helpSupport')}
              subtitle={t('settings.helpSupport')}
              onPress={() => Alert.alert(t('settings.helpSupport'), t('settings.helpCenterComingSoon'))}
            />
            <SettingItem
              icon={LogOut}
              title={t('auth.signOut')}
              subtitle={t('auth.signOutDescription')}
              onPress={handleLogout}
            />
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Language Selector Modal */}
      <LanguageSelector
        isVisible={isLanguageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
      />
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 16,
  },
  settingsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomSpacing: {
    height: 32,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
    marginTop: 24,
  },
  profileAvatarContainer: {
    marginRight: 16,
  },
  profileInitialsContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Urbanist-SemiBold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
    fontFamily: 'Urbanist-SemiBold',
  },
  activeAccountBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeAccountText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  permissionStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
});