const { execFileSync } = require('node:child_process');

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {NodeJS.ProcessEnv}
 */
function isolatedGitEnv(env = process.env) {
  return Object.fromEntries(Object.entries(env).filter(([name]) => !name.startsWith('GIT_')));
}

/**
 * @param {string} root
 * @param {string[]} args
 * @param {{ input?: string }} [options]
 * @returns {string}
 */
function git(root, args, options = {}) {
  // eslint-disable-next-line sonarjs/no-os-command-from-path -- outil de depot lance depuis le poste dev / la CI : figer un chemin absolu casserait les installations Homebrew (/opt/homebrew/bin), nvm ou corepack
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    maxBuffer: 1 << 28,
    env: isolatedGitEnv(),
    ...options,
  });
}

module.exports = { git };
