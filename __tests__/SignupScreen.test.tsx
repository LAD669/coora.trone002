import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';
import SignUpScreen from '../app/(auth)/signup';

// Mock the hooks
jest.mock('../contexts/AuthProvider', () => ({
  useAuth: () => ({
    signUp: jest.fn(),
    loading: false,
  }),
}));

jest.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'auth.name.label': 'Name',
        'auth.name.placeholder': 'Enter name',
        'auth.email.label': 'Email',
        'auth.email.placeholder': 'Enter email',
        'auth.password.label': 'Password',
        'auth.password.placeholder': 'Enter password',
        'auth.accessCode.label': 'Access Code',
        'auth.accessCode.placeholder': 'Enter your team access code',
        'auth.signUp': 'Sign up',
        'auth.signIn': 'Sign In',
        'common.fillAllFields': 'Please fill in all fields',
        'common.validEmailRequired': 'Please enter a valid email',
        'common.error': 'Error',
        'common.somethingWentWrong': 'Something went wrong',
        'common.loading': 'Loading...',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../hooks/useNavigationReady', () => ({
  useNavigationReady: () => ({
    safePush: jest.fn(),
  }),
}));

describe('SignupScreen', () => {
  beforeEach(() => {
    i18next.init({
      lng: 'en',
      fallbackLng: 'en',
      resources: {
        en: {
          translation: {
            auth: {
              name: {
                label: 'Name',
                placeholder: 'Enter name'
              },
              email: {
                label: 'Email',
                placeholder: 'Enter email'
              },
              password: {
                label: 'Password',
                placeholder: 'Enter password'
              },
              accessCode: {
                label: 'Access Code',
                placeholder: 'Enter your team access code'
              },
              signUp: 'Sign up',
              signIn: 'Sign In'
            }
          }
        }
      }
    });
  });

  it('renders all form fields with correct labels', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <SignUpScreen />
      </I18nextProvider>
    );

    // Check that all labels show correct text
    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText('Password')).toBeTruthy();
    expect(screen.getByText('Access Code')).toBeTruthy();
  });

  it('renders all form fields with correct placeholders', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <SignUpScreen />
      </I18nextProvider>
    );

    // Check that all placeholders show correct text
    expect(screen.getByPlaceholderText('Enter name')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter password')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your team access code')).toBeTruthy();
  });

  it('renders sign up button with correct text', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <SignUpScreen />
      </I18nextProvider>
    );

    // Check that sign up button shows correct text
    expect(screen.getByText('Sign up')).toBeTruthy();
  });

  it('renders exactly one sign in CTA', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <SignUpScreen />
      </I18nextProvider>
    );

    // Check that there is exactly one sign in CTA (the link)
    expect(screen.getByText('Already have an account?')).toBeTruthy();
    expect(screen.getByText('Sign In')).toBeTruthy();
    
    // Ensure there's no duplicate sign in button
    const signInElements = screen.queryAllByText('Sign In');
    expect(signInElements).toHaveLength(1);
  });

  it('renders sign in link with correct text', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <SignUpScreen />
      </I18nextProvider>
    );

    // Check that the sign in link shows correct text
    expect(screen.getByText('Already have an account?')).toBeTruthy();
    expect(screen.getByText('Sign In')).toBeTruthy();
  });

  it('does not show raw i18n keys', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <SignUpScreen />
      </I18nextProvider>
    );

    // Ensure no raw keys are displayed
    expect(screen.queryByText('auth.name.label')).toBeNull();
    expect(screen.queryByText('auth.email.label')).toBeNull();
    expect(screen.queryByText('auth.password.label')).toBeNull();
    expect(screen.queryByText('auth.accessCode.label')).toBeNull();
    expect(screen.queryByText('auth.signUp')).toBeNull();
    expect(screen.queryByText('auth.signIn')).toBeNull();
  });

  it('renders all input fields with correct accessibility', () => {
    render(
      <I18nextProvider i18n={i18next}>
        <SignUpScreen />
      </I18nextProvider>
    );

    // Check that all input fields are present
    const nameInput = screen.getByPlaceholderText('Enter name');
    const emailInput = screen.getByPlaceholderText('Enter email');
    const passwordInput = screen.getByPlaceholderText('Enter password');
    const accessCodeInput = screen.getByPlaceholderText('Enter your team access code');

    expect(nameInput).toBeTruthy();
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(accessCodeInput).toBeTruthy();
  });
});
