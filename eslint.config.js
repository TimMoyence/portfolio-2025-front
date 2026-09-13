const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const sonarjs = require('eslint-plugin-sonarjs');
const globals = require('globals');

module.exports = tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      '.angular/**',
      '.claude/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  {
    files: ['src/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
      sonarjs.configs.recommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@angular-eslint/component-class-suffix': ['error', { suffixes: ['Component'] }],
      '@angular-eslint/directive-class-suffix': ['error', { suffixes: ['Directive'] }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['src/cours/**/*.ts', 'src/app/**/cours*/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSAsExpression > TSTypeReference > Identifier[name="EscapedHtml"]',
          message:
            "Interdit : un cast vers EscapedHtml contourne le typage qui impose l'echappement. Passez par escapeHtml, safeHtml ou escapeUrl. Une XSS est deja passee par ce chemin dans FpExit.",
        },
      ],
    },
  },
  {
    files: ['src/cours/runtime/core/html.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['src/**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  },
  {
    files: ['e2e/**/*.ts', 'scripts/**/*.mts'],
    extends: [sonarjs.configs.recommended],
    languageOptions: {
      parser: tseslint.parser,
      globals: { ...globals.node },
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    extends: [sonarjs.configs.recommended],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
);
