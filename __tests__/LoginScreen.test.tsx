import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LoginScreen from '../app/(auth)/login';

// Mock translations
const mockTranslations = {
  en: {
    translation: {
      auth: {
        email: {
          label: 'Email',
          placeholder: 'Enter email'
        },
        password: {
          label: 'Password',
          placeholder: 'Enter password'
        },
        signIn: 'Sign in',
        signUp: 'Sign up'
      },
      common: {
        loading: 'Loading...',
        fillAllFields: 'Please fill in all required fields',
        validEmailRequired: 'Please enter a valid email address',
        error: 'Error',
        somethingWentWrong: 'Something went wrong. Please try again.'
      }
    }
  }
};

// Initialize i18next for testing
i18next
  .use(initReactI18next)
  .init({
    resources: mockTranslations,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    },
    compatibilityJSON: 'v3',
    defaultNS: 'translation',
    ns: ['translation']
  });

// Mock the hooks
jest.mock('../contexts/AuthProvider', () => ({
  useAuth: () => ({
    signIn: jest.fn(),
    loading: false,
  }),
}));

jest.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: i18next.t,
  }),
}));

jest.mock('../hooks/useNavigationReady', () => ({
  useNavigationReady: () => ({
    safePush: jest.fn(),
  }),
}));

describe('LoginScreen - COORA-001 & COORA-002', () => {
  beforeEach(() => {
    i18next.changeLanguage('en');
  });

  describe('COORA-001: i18n translations', () => {
    it('renders correct email label and placeholder', () => {
      render(
        <I18nextProvider i18n={i18next}>
          <LoginScreen />
        </I18nextProvider>
      );

      // Check that email label shows correct text
      expect(screen.getByText('Email')).toBeTruthy();
      
      // Check that email placeholder shows correct text
      const emailInput = screen.getByPlaceholderText('Enter email');
      expect(emailInput).toBeTruthy();
    });

    it('renders correct password label and placeholder', () => {
      render(
        <I18nextProvider i18n={i18next}>
          <LoginScreen />
        </I18nextProvider>
      );

      // Check that password label shows correct text
      expect(screen.getByText('Password')).toBeTruthy();
      
      // Check that password placeholder shows correct text
      const passwordInput = screen.getByPlaceholderText('Enter password');
      expect(passwordInput).toBeTruthy();
    });

    it('renders correct sign in button text', () => {
      render(
        <I18nextProvider i18n={i18next}>
          <LoginScreen />
        </I18nextProvider>
      );

      // Check that sign in button shows correct text
      expect(screen.getByText('Sign in')).toBeTruthy();
    });

    it('does not show raw i18n keys', () => {
      render(
        <I18nextProvider i18n={i18next}>
          <LoginScreen />
        </I18nextProvider>
      );

      // Ensure no raw keys are displayed
      expect(screen.queryByText('auth.email.label')).toBeNull();
      expect(screen.queryByText('auth.password.label')).toBeNull();
      expect(screen.queryByText('auth.signIn')).toBeNull();
      expect(screen.queryByText('auth.signUp')).toBeNull();
    });
  });

  describe('COORA-002: single signup CTA', () => {
    it('renders only one signup CTA', () => {
      render(
        <I18nextProvider i18n={i18next}>
          <LoginScreen />
        </I18nextProvider>
      );

      // Check that only the signup link exists, not the button
      expect(screen.getByText('Sign up')).toBeTruthy();
      expect(screen.queryByText('Create Account')).toBeNull();
    });

    it('renders signup link with correct text', () => {
      render(
        <I18nextProvider i18n={i18next}>
          <LoginScreen />
        </I18nextProvider>
      );

      // Check that the signup link shows correct text
      expect(screen.getByText("Don't have an account?")).toBeTruthy();
      expect(screen.getByText('Sign up')).toBeTruthy();
    });

    it('renders complete signup text with correct sentence case', () => {
      render(
        <I18nextProvider i18n={i18next}>
          <LoginScreen />
        </I18nextProvider>
      );

      // Check that the complete text appears as expected
      expect(screen.getByText("Don't have an account? Sign up")).toBeTruthy();
    });

    it('does not render divider or create account button', () => {
      render(
        <I18nextProvider i18n={i18next}>
          <LoginScreen />
        </I18nextProvider>
      );

      // Ensure divider and create account button are not rendered
      expect(screen.queryByText('or')).toBeNull();
      expect(screen.queryByText('Create Account')).toBeNull();
    });
  });
});
