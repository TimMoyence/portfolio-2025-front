import { readFileSync } from 'node:fs';

import { defineConfig } from '@hey-api/openapi-ts';

const { depot, commit } = JSON.parse(readFileSync('contrat.json', 'utf8'));

export default defineConfig({
  input: `https://raw.githubusercontent.com/${depot}/${commit}/openapi.json`,
  output: { path: 'contrat', postProcess: ['prettier'] },
  plugins: ['@hey-api/typescript', 'zod'],
});
