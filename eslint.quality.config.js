const baseConfig = require('./eslint.config.js');
const sonarjs = require('eslint-plugin-sonarjs');

/**
 * Abaisse un niveau de severite ESLint en `warn` en preservant les options
 * eventuelles de la regle (`['error', { threshold: 15 }]` -> `['warn', {...}]`).
 */
function toWarn(severity) {
  if (Array.isArray(severity)) {
    return severity[0] === 'off' ? severity : ['warn', ...severity.slice(1)];
  }
  return severity === 'off' ? severity : 'warn';
}

const sonarRecommendedAsWarn = Object.fromEntries(
  Object.entries(sonarjs.configs.recommended.rules).map(([rule, severity]) => [
    rule,
    toWarn(severity),
  ]),
);

/**
 * Configuration ESLint « qualite » — utilisee par `npm run lint:quality`.
 *
 * Elle reprend la configuration de lint standard et y ajoute l'integralite du
 * jeu de regles `eslint-plugin-sonarjs` en `warn`. Elle n'est volontairement
 * PAS branchee sur `npm run lint` (donc ni sur `ci:check`, ni sur
 * `pre-push:check`, ni sur `lint-staged` qui tourne avec `--max-warnings=0`) :
 * son role est de mesurer la dette de qualite, pas de bloquer le depot.
 *
 * Les regles sonarjs deja au vert sur tout le code sont, elles, activees en
 * `error` directement dans `eslint.config.js`.
 */
module.exports = [
  ...baseConfig,
  {
    files: ['src/**/*.ts'],
    plugins: sonarjs.configs.recommended.plugins,
    settings: sonarjs.configs.recommended.settings,
    rules: sonarRecommendedAsWarn,
  },
];
