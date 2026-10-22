import { ecartsDeLaCopieDeTravail } from './lib/ecarts-du-contrat.mjs';
import { executer } from './lib/processus.mjs';

const ecarts = ecartsDeLaCopieDeTravail(
  await executer(
    'git',
    ['status', '--porcelain', '--untracked-files=all', '--', 'contrat', 'src/testing/fixtures'],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  ),
);

if (ecarts.length > 0) {
  console.error(
    `Le contrat genere ne correspond plus a l'epingle de contrat.json :\n${ecarts.join('\n')}`,
  );
  process.exitCode = 1;
}
