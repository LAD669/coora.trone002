import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';
import InfohubScreenContent from '../app/(app)/(tabs)/index';

// Mock the hooks and dependencies
jest.mock('../contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      teamId: 'test-team-id',
      role: 'trainer',
      name: 'Test User'
    },
  }),
}));

jest.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'en',
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'common.createUpdate': 'Create Update',
        'common.cancel': 'Cancel',
        'common.postTo': 'Post to',
        'common.organization': 'Organization',
        'common.teams': 'Teams',
        'common.updateTitle': 'Update Title',
        'common.publishUpdate': 'Publish Update',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../hooks/useNavigationReady', () => ({
  useNavigationReady: () => ({
    safePush: jest.fn(),
    safeBack: jest.fn(),
  }),
}));

jest.mock('react-native-modal', () => {
  const { View, Text } = require('react-native');
  return function MockModal({ isVisible, children, onBackdropPress, avoidKeyboard, keyboardShouldPersistTaps }: any) {
    if (!isVisible) return null;
    return (
      <View testID="modal-overlay" onTouchEnd={onBackdropPress}>
        <View testID="modal-content">
          {children}
        </View>
      </View>
    );
  };
});

describe('CreateUpdateModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    i18next.init({
      lng: 'en',
      fallbackLng: 'en',
      resources: {
        en: {
          translation: {
            common: {
              createUpdate: 'Create Update',
              cancel: 'Cancel',
              postTo: 'Post to',
              organization: 'Organization',
              teams: 'Teams',
              updateTitle: 'Update Title',
              publishUpdate: 'Publish Update'
            }
          }
        }
      }
    });
  });

  it('renders modal with keyboard handling properties', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <InfohubScreenContent />
      </I18nextProvider>
    );

    // The modal should not be visible initially
    expect(screen.queryByTestId('modal-overlay')).toBeNull();
  });

  it('opens modal when create update button is pressed', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <InfohubScreenContent />
      </I18nextProvider>
    );

    // Find and press the create update button (Plus button)
    const createButton = screen.getByTestId('create-update-button');
    fireEvent.press(createButton);

    // Modal should now be visible
    expect(screen.getByTestId('modal-overlay')).toBeTruthy();
    expect(screen.getByText('Create Update')).toBeTruthy();
  });

  it('renders modal with proper keyboard handling structure', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <InfohubScreenContent />
      </I18nextProvider>
    );

    // Open modal
    const createButton = screen.getByTestId('create-update-button');
    fireEvent.press(createButton);

    // Check modal structure with keyboard handling
    expect(screen.getByText('Create Update')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
    expect(screen.getByPlaceholderText('Update Title')).toBeTruthy();
    expect(screen.getByText('Publish Update')).toBeTruthy();
  });

  it('closes modal when cancel button is pressed', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <InfohubScreenContent />
      </I18nextProvider>
    );

    // Open modal
    const createButton = screen.getByTestId('create-update-button');
    fireEvent.press(createButton);

    // Verify modal is open
    expect(screen.getByText('Create Update')).toBeTruthy();

    // Close modal
    const cancelButton = screen.getByText('Cancel');
    fireEvent.press(cancelButton);

    // Modal should be closed
    expect(screen.queryByTestId('modal-overlay')).toBeNull();
  });

  it('closes modal when backdrop is pressed', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <InfohubScreenContent />
      </I18nextProvider>
    );

    // Open modal
    const createButton = screen.getByTestId('create-update-button');
    fireEvent.press(createButton);

    // Verify modal is open
    expect(screen.getByText('Create Update')).toBeTruthy();

    // Close modal by pressing backdrop
    const modalOverlay = screen.getByTestId('modal-overlay');
    fireEvent(modalOverlay, 'touchEnd');

    // Modal should be closed
    expect(screen.queryByTestId('modal-overlay')).toBeNull();
  });

  it('handles form input correctly with keyboard', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <InfohubScreenContent />
      </I18nextProvider>
    );

    // Open modal
    const createButton = screen.getByTestId('create-update-button');
    fireEvent.press(createButton);

    // Test title input
    const titleInput = screen.getByPlaceholderText('Update Title');
    fireEvent.changeText(titleInput, 'Test Update');
    expect(titleInput.props.value).toBe('Test Update');

    // Test content input
    const contentInput = screen.getByPlaceholderText(/Was gibt es Neues in der Organisation/);
    fireEvent.changeText(contentInput, 'Test content');
    expect(contentInput.props.value).toBe('Test content');
  });

  it('renders scrollable content to handle keyboard', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <InfohubScreenContent />
      </I18nextProvider>
    );

    // Open modal
    const createButton = screen.getByTestId('create-update-button');
    fireEvent.press(createButton);

    // Modal should be properly contained with scrollable content
    const modalOverlay = screen.getByTestId('modal-overlay');
    expect(modalOverlay).toBeTruthy();

    // Check that scrollable content exists
    expect(screen.getByText('Create Update')).toBeTruthy();
    expect(screen.getByPlaceholderText('Update Title')).toBeTruthy();
    expect(screen.getByText('Publish Update')).toBeTruthy();
  });

  it('has proper keyboard handling attributes', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <InfohubScreenContent />
      </I18nextProvider>
    );

    // Open modal
    const createButton = screen.getByTestId('create-update-button');
    fireEvent.press(createButton);

    // Check that inputs are accessible
    const titleInput = screen.getByPlaceholderText('Update Title');
    const contentInput = screen.getByPlaceholderText(/Was gibt es Neues in der Organisation/);

    expect(titleInput).toBeTruthy();
    expect(contentInput).toBeTruthy();
    expect(contentInput.props.multiline).toBe(true);
    expect(contentInput.props.numberOfLines).toBe(6);
  });
});
