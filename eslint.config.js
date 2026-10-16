const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const sonarjs = require('eslint-plugin-sonarjs');
const globals = require('globals');

const COEUR_SANS_SHARED_NI_FEATURES =
  'Le core ne dépend ni de shared ni de features : le contrat vit dans core/ports.';

const SANS_CAST_VERS_ESCAPED_HTML = {
  selector: 'TSAsExpression > TSTypeReference > Identifier[name="EscapedHtml"]',
  message:
    "Interdit : un cast vers EscapedHtml contourne le typage qui impose l'echappement. Passez par escapeHtml, safeHtml ou escapeUrl. Une XSS est deja passee par ce chemin dans FpExit.",
};

const COEUR_SANS_CHEMIN_VERS_SHARED_NI_FEATURES = [
  {
    selector: 'ImportExpression > Literal[value=/(^|\\/)(shared|features)(\\/|$)/]',
    message: COEUR_SANS_SHARED_NI_FEATURES,
  },
  {
    selector: 'ImportExpression[source.type!="Literal"]',
    message: `${COEUR_SANS_SHARED_NI_FEATURES} Un import() du core prend un chemin littéral, que cette règle peut lire.`,
  },
  {
    selector: 'TSImportType Literal[value=/(^|\\/)(shared|features)(\\/|$)/]',
    message: COEUR_SANS_SHARED_NI_FEATURES,
  },
];

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
    files: ['src/**/*.ts', 'e2e/**/*.ts', 'scripts/**/*.{mjs,mts}'],
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
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
    ignores: ['src/cours/runtime/core/html.ts'],
    rules: {
      'no-restricted-syntax': ['error', SANS_CAST_VERS_ESCAPED_HTML],
    },
  },
  {
    files: ['src/app/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '(^|/)(shared|features)(/|$)',
              message: COEUR_SANS_SHARED_NI_FEATURES,
            },
          ],
        },
      ],
      'no-restricted-syntax': ['error', ...COEUR_SANS_CHEMIN_VERS_SHARED_NI_FEATURES],
    },
  },
  {
    files: ['src/app/core/**/cours*/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        SANS_CAST_VERS_ESCAPED_HTML,
        ...COEUR_SANS_CHEMIN_VERS_SHARED_NI_FEATURES,
      ],
    },
  },
  {
    files: ['src/**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  },
  {
    files: ['e2e/**/*.ts', 'scripts/**/*.mts', 'playwright.config.ts'],
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
