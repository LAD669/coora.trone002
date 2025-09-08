// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  plugins: ['i18next'],
  ignorePatterns: ['/dist/*'],
  rules: {
    // i18n rules to prevent hardcoded strings (temporarily disabled during migration)
    'i18next/no-literal-string': 'off'
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
    }
  ]
};
