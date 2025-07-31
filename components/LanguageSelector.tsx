import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageSelectorProps {
  isVisible: boolean;
  onClose: () => void;
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
] as const;

export default function LanguageSelector({ isVisible, onClose }: LanguageSelectorProps) {
  const { language: currentLanguage, setLanguage, t } = useLanguage();

  const handleLanguageSelect = async (languageCode: 'en' | 'de') => {
    await setLanguage(languageCode);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#1A1A1A" strokeWidth={1.5} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('settings.selectLanguage')}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.languageList}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={styles.languageItem}
                onPress={() => handleLanguageSelect(lang.code)}
              >
                <Text style={styles.languageName}>{lang.name}</Text>
                {currentLanguage === lang.code && (
                  <Check size={20} color="#34C759" strokeWidth={1.5} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 'auto',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  headerSpacer: {
    width: 40,
  },
  languageList: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  languageName: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Medium',
  },
}); 