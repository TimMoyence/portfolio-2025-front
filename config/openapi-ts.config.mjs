import { defineConfig } from '@hey-api/openapi-ts';

import { sourceEpinglee } from '../scripts/lib/contrat/source.mjs';

export default defineConfig({
  input: sourceEpinglee().openapi,
  output: { path: 'contrat', postProcess: ['prettier'] },
  plugins: ['@hey-api/typescript', 'zod'],
});
