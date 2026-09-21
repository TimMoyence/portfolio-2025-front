import { defineConfig, devices } from '@playwright/test';

const SPECS_BANC = 'banc/**/*.spec.ts';

const baseSsr = process.env['SSR_BASE_URL'];

const baseSsrAnglais = process.env['SSR_EN_BASE_URL'];

const PORT_DU_BANC = '4010';

function projetsDemandes(arguments_: readonly string[]): string[] {
  return arguments_.flatMap((argument, rang) => {
    if (argument.startsWith('--project=')) {
      return [argument.slice('--project='.length)];
    }
    const suivant = arguments_[rang + 1];
    return argument === '--project' && suivant !== undefined ? [suivant] : [];
  });
}

const banc = projetsDemandes(process.argv).includes('banc');

const baseBanc = process.env['BANC_URL_FRONT'] ?? `http://localhost:${PORT_DU_BANC}`;

const serveurAngular = {
  command: 'npm run start',
  url: 'http://localhost:4200',
  reuseExistingServer: !process.env['CI'],
  timeout: 180_000,
};

const serveurDeLocale = (commande: string, base: string | undefined) =>
  base === undefined || base === ''
    ? []
    : [
        {
          command: commande,
          url: `${base}/sitemap.xml`,
          reuseExistingServer: !process.env['CI'],
          timeout: 180_000,
        },
      ];

const serveurSsr = [
  ...serveurDeLocale('npm run serve:ssr:portfolio-app', baseSsr),
  ...serveurDeLocale('npm run serve:ssr:portfolio-app:en', baseSsrAnglais),
];

const serveurDuBanc = [
  {
    command: 'node dist/portfolio-app/server/fr/server.mjs',
    url: `${baseBanc}/fr/cours/rejoindre`,
    env: {
      PORT: new URL(baseBanc).port || PORT_DU_BANC,
      PORTFOLIO_ARTICLE_API_URL: process.env['BANC_URL_API'] ?? '',
    },
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
];

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: process.env['CI'] ? [['github'], ['line']] : 'html',
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    locale: 'fr-FR',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: [SPECS_BANC],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'banc',
      testMatch: SPECS_BANC,
      fullyParallel: false,
      timeout: 120_000,
      expect: { timeout: 20_000 },
      use: { ...devices['Desktop Chrome'], baseURL: baseBanc, trace: 'retain-on-failure' },
    },
  ],
  webServer: banc ? serveurDuBanc : [serveurAngular, ...serveurSsr],
});
