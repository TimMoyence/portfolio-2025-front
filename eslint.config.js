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
      'e2e/**',
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

      // --- sonarjs : regles desactivees car en dette sur le code existant ---
      // Le jeu `sonarjs/recommended` est actif en `error` : 202 de ses 217 regles
      // passent deja au vert et protegent donc le code des maintenant. Les regles
      // ci-dessous ont des occurrences dans le code applicatif : les laisser en
      // `error` casserait `npm run lint` (donc `ci:check` et `pre-push:check`) et
      // les passer en `warn` casserait `lint-staged`, qui tourne avec
      // `--max-warnings=0`. Elles restent mesurees par `npm run lint:quality`.
      // Comptes releves le 2026-08-07 (voir docs/qualite-baseline-2026-08-07.md).
      'sonarjs/deprecation': 'off', // 31 occurrences (4 applicatif / 27 specs)
      'sonarjs/no-nested-conditional': 'off', // 10 occurrences (8 / 2)
      'sonarjs/pseudo-random': 'off', // 9 occurrences (9 / 0)
      'sonarjs/super-linear-regex': 'off', // 9 occurrences (9 / 0)
      'sonarjs/prefer-regexp-exec': 'off', // 9 occurrences (4 / 5)
      'sonarjs/cognitive-complexity': 'off', // 8 occurrences (8 / 0)
      'sonarjs/function-return-type': 'off', // 5 occurrences (5 / 0)
      'sonarjs/different-types-comparison': 'off', // 5 occurrences (4 / 1)
      'sonarjs/void-use': 'off', // 3 occurrences (3 / 0)
      'sonarjs/no-angular-bypass-sanitization': 'off', // 2 occurrences (2 / 0)
      'sonarjs/no-nested-template-literals': 'off', // 1 occurrence (1 / 0)
    },
  },
  {
    // Les regles sonarjs ci-dessous ne remontent QUE dans les fichiers de test,
    // ou leurs violations sont attendues (mots de passe factices, comparaisons
    // de flottants sur des fixtures, tests non parametres). Elles restent donc
    // actives en `error` sur tout le code applicatif.
    files: ['src/**/*.spec.ts', 'src/testing/**/*.ts', 'src/test.ts'],
    rules: {
      'sonarjs/no-hardcoded-passwords': 'off', // 21 occurrences, toutes en specs
      'sonarjs/parameterized-tests': 'off', // 9 occurrences, toutes en specs
      'sonarjs/no-floating-point-equality': 'off', // 4 occurrences, toutes en specs
      'sonarjs/assertions-in-tests': 'off', // 2 occurrences, toutes en specs
    },
  },
  {
    files: ['src/**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  },
);
