import type { Page } from '@playwright/test';

const AXE = 'node_modules/axe-core/axe.min.js';

export const parcourir = async (page: Page): Promise<void> => {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((suite) => requestAnimationFrame(() => suite(null)));
    }
    window.scrollTo(0, 0);
    await document.fonts.ready;
  });
};

export const violationsAxe = async (page: Page, zone?: string): Promise<string[]> => {
  await page.addScriptTag({ path: AXE });
  return page.evaluate(async (selecteur) => {
    const axe = (
      window as unknown as {
        axe: {
          run: (
            contexte: Document | string,
            options: object,
          ) => Promise<{
            violations: { nodes: { target: string[]; failureSummary?: string }[] }[];
          }>;
        };
      }
    ).axe;
    const { violations } = await axe.run(selecteur ?? document, {
      runOnly: ['color-contrast'],
    });
    return violations.flatMap(({ nodes }) =>
      nodes.map(({ target, failureSummary }) => `${target.join(' ')} — ${failureSummary ?? ''}`),
    );
  }, zone);
};

export const survolsHorsHover = (page: Page): Promise<string[]> =>
  page.evaluate(() => {
    const sousHover = (regle: CSSRule): boolean => {
      for (let r: CSSRule | null = regle.parentRule; r !== null; r = r.parentRule) {
        if (r instanceof CSSMediaRule && /hover:\s*hover/.test(r.conditionText)) return true;
      }
      return false;
    };
    const fautifs: string[] = [];
    const lire = (regles: CSSRuleList): void => {
      for (const regle of Array.from(regles)) {
        if (
          regle instanceof CSSStyleRule &&
          regle.selectorText.includes(':hover') &&
          !sousHover(regle)
        ) {
          fautifs.push(regle.selectorText.slice(0, 80));
        }
        if ('cssRules' in regle) lire((regle as CSSGroupingRule).cssRules);
      }
    };
    for (const feuille of Array.from(document.styleSheets)) lire(feuille.cssRules);
    return [...new Set(fautifs)];
  });
