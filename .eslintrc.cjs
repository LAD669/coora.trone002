module.exports = {
  extends: [
    'expo',
    '@react-native',
  ],
  plugins: ['react', 'react-native'],
  rules: {
    // Prevent cross-imports between (app) and (manager) route groups
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@/screens/manager/*'],
          message: 'Manager-Screens dürfen außerhalb (manager) nicht importiert werden.',
        },
        {
          group: ['@/app/(manager)/*'],
          message: 'Manager-Route-Gruppe nur aus (manager) referenzieren.',
        },
      ],
    }],
    
    // Additional code quality rules
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    
    // React specific rules
    'react/prop-types': 'off', // We use TypeScript
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react-hooks/exhaustive-deps': 'warn',
    
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'error',
  },
  env: {
    'react-native/react-native': true,
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
};
