import { executer } from './lib/processus.mjs';

const ecarts = (
  await executer(
    'git',
    ['status', '--porcelain', '--untracked-files=all', '--', 'contrat', 'src/testing/fixtures'],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  )
).trim();

if (ecarts !== '') {
  console.error(`Le contrat genere ne correspond plus a l'epingle de contrat.json :\n${ecarts}`);
  process.exitCode = 1;
}
