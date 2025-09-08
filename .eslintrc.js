// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  plugins: ['i18next'],
  ignorePatterns: ['/dist/*'],
  rules: {
    // i18n rules to prevent hardcoded strings
    'i18next/no-literal-string': [
      'error',
      {
        markupOnly: true,
        ignoreAttribute: [
          'testID',
          'accessibilityLabel',
          'accessibilityHint',
          'accessibilityRole',
          'role',
          'data-testid',
          'name',
          'type',
          'id',
          'className',
          'style',
          'key',
          'ref'
        ],
        ignoreCallee: [
          'console.log',
          'console.error',
          'console.warn',
          'console.info',
          'console.debug',
          'Alert.alert',
          'require',
          'import',
          'describe',
          'it',
          'test',
          'expect',
          'jest.fn',
          'jest.mock'
        ],
        ignoreProperty: [
          'displayName',
          'propTypes',
          'defaultProps',
          'contextTypes',
          'childContextTypes'
        ]
      }
    ]
  },
  overrides: [
    {
      files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*'],
      rules: {
        'i18next/no-literal-string': 'off'
      }
    },
    {
      files: ['**/*.config.*', '**/babel.config.*', '**/metro.config.*'],
      rules: {
        'i18next/no-literal-string': 'off'
      }
    },
    {
      files: ['app/(app)/(tabs)/calendar.tsx'],
      rules: {
        'i18next/no-literal-string': 'error'
      }
    },
    {
      files: [
        'app/(auth)/login.tsx',
        'app/(auth)/signup.tsx',
        'app/(app)/settings.tsx',
        'app/(app)/notifications.tsx',
        'app/(app)/EditProfileScreen.tsx'
      ],
      rules: {
        'i18next/no-literal-string': 'warn' // TODO: Migrate remaining hardcoded strings
      }
    }
  ]
};
