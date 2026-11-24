import { texteDe as texte } from '../../../testing/texte/textes-dom';
import { AUDIT_REQUEST_PORT } from '../../core/ports/audit-request.port';
import { METADONNEES_DU_SITE, nomCourtServi } from '../../core/seo/site-servi';
import { createAuditRequestPortStub } from '../../../testing/factories/audit-request.factory';
import { pageMontee } from '../../../testing/page/montage-page';
import { GrowthAuditComponent } from './growth-audit.component';

const pages = METADONNEES_DU_SITE.pages;

const localesDe = (id: string) => pages.find((page) => page.id === id)?.locales ?? {};

describe('REC-08 · le diagnostic porte un seul nom', () => {
  const page = pageMontee(GrowthAuditComponent, {
    providers: [{ provide: AUDIT_REQUEST_PORT, useValue: createAuditRequestPortStub() }],
  });

  it('REC-08 · le titre de la page dit « Diagnostic gratuit »', () => {
    const titres = page.racine.querySelectorAll('h1');

    expect(titres.length).toBe(1);
    expect(texte(titres[0])).toContain('Diagnostic gratuit');
  });

  it('REC-08 · le kicker reprend le nom du lien', () => {
    const kicker = page.racine.querySelector('h1')?.previousElementSibling;

    expect(texte(kicker).startsWith(nomCourtServi('/growth-audit'))).toBeTrue();
  });

  it('REC-08 · aucun texte de la page ne parle encore d audit', () => {
    expect(texte(page.racine)).not.toMatch(/audit/i);
  });

  it('REC-08 · la FAQ parle du diagnostic', () => {
    const faq = page.racine.querySelector('app-asili-faq');

    expect(texte(faq?.querySelector('h2'))).toContain('diagnostic');
  });

  it('REC-08 · le SEO dit « Diagnostic gratuit » en français et « Free diagnosis » en anglais', () => {
    const { fr, en } = localesDe('growth-audit');

    expect(fr?.title).toContain('Diagnostic gratuit');
    expect(fr?.description).toContain('diagnostic');
    expect(en?.title).toContain('Free diagnosis');
    expect(JSON.stringify(fr)).not.toMatch(/audit/i);
    expect(JSON.stringify(en)).not.toMatch(/audit/i);
  });

  it('REC-08 · la formation « audit SEO » garde son nom', () => {
    expect(pages.some((entree) => entree.path === '/formations/audit-seo-diy')).toBeTrue();
  });
});
