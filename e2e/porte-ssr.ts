import { test } from '@playwright/test';

export const baseSsr = process.env['SSR_BASE_URL'] ?? '';
export const baseAnglaise = process.env['SSR_EN_BASE_URL'] ?? '';

export function exigerLaPorteSsr({ anglaise = false } = {}): void {
  test.skip(
    baseSsr === '' || (anglaise && baseAnglaise === ''),
    anglaise
      ? 'hors porte : SSR_BASE_URL ou SSR_EN_BASE_URL absente. La porte les fournit (npm run test:e2e:portail).'
      : 'hors porte : SSR_BASE_URL absente. La porte la fournit (npm run test:e2e:portail).',
  );
}
