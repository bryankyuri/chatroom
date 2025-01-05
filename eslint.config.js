import js from '@eslint/js'
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefresh
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      // React rules
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],
      
      // General rules
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-console': ['warn', {
        allow: ['warn', 'error']
      }]
    }
  }
];