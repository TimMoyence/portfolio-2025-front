import { ChangeDetectorRef } from '@angular/core';
import type { ClientReport } from '../../core/models/audit-client-report.model';
import {
  buildAuditSummaryResponse,
  buildClientReport,
  fournirUnPortDuDiagnostic,
} from '../../../testing/factories/audit-request.factory';
import { monterAvecRouteur, pageMontee, type PageMontee } from '../../../testing/page/montage-page';
import { MOTS_TECHNIQUES_DU_DIAGNOSTIC, motsTrouves } from '../../../testing/texte/mots-entiers';
import { textes } from '../../../testing/texte/textes-dom';
import { AuditClientReportSectionComponent } from './components/audit-client-report-section/audit-client-report-section.component';
import { GrowthAuditComponent } from './growth-audit.component';

const LA_TABLE = [
  [
    'Clarté et appels',
    'Ce que vous faites, dit en une phrase ; le bouton qui fait appeler ; un contact sans effort ; l’affichage sur téléphone.',
  ],
  ['Vitesse', 'Le temps d’affichage de vos pages, le poids des images, la fluidité sur téléphone.'],
  [
    'Être trouvé sur Google',
    'Le titre de chaque page, ce que Google en lit, les pages qu’il connaît, votre présence près de chez vous.',
  ],
  ['Confiance', 'Avis clients, réalisations montrées, tout ce qui rassure avant d’appeler.'],
  [
    'Solidité du site',
    'L’outil qui fait tourner le site, la sécurité, les pages en erreur, la facilité d’entretien.',
  ],
  [
    'Visibilité dans les IA',
    'Ce que les assistants IA comprennent de votre métier et répondent quand on les interroge.',
  ],
  [
    'Matière à citer',
    'Sources, preuves, questions fréquentes : ce que Google et les IA peuvent reprendre de vos pages.',
  ],
];

const ATTRIBUTS_LUS = ['aria-label', 'alt', 'title', 'placeholder'];

const noeudsDeTexte = (racine: HTMLElement): string[] => {
  const parcours = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
  const lus: string[] = [];
  while (parcours.nextNode()) lus.push(parcours.currentNode.textContent ?? '');
  return lus;
};

const texteLu = (racine: HTMLElement): string =>
  [
    ...noeudsDeTexte(racine),
    ...Array.from(racine.querySelectorAll('*')).flatMap((element) =>
      ATTRIBUTS_LUS.map((nom) => element.getAttribute(nom) ?? ''),
    ),
  ].join('\n');

const interditsDe = (texte: string): string[] => motsTrouves(texte, MOTS_TECHNIQUES_DU_DIAGNOSTIC);

const etat = (statusLabel: string) => ({ statusLabel, status: 'warning' as const });

const note = (pillar: string): ClientReport['pillarScorecard'][number] => ({
  pillar,
  score: 50,
  target: 80,
  ...etat('À améliorer'),
});

const rendreLeRapport = (rapport: Partial<ClientReport>): HTMLElement =>
  monterAvecRouteur(AuditClientReportSectionComponent, {
    clientReport: buildClientReport(rapport),
  }).nativeElement as HTMLElement;

const rapportServi = (): HTMLElement =>
  rendreLeRapport({
    executiveSummary: 'Votre site est clair, il reste à le rendre plus rapide.',
    googleVsAiMatrix: {
      googleVisibility: { score: 70, summary: 'Bien trouvé.', ...etat('À améliorer') },
      aiVisibility: { score: 30, summary: 'Peu repris.', ...etat('À améliorer') },
    },
    pillarScorecard: [note('seo')],
    quickWins: [
      { title: 'Alléger les photos', businessImpact: 'Pages plus rapides', effort: 'low' },
    ],
    cta: { title: 'On en parle ?', description: 'Un appel suffit.', actionLabel: 'Réserver' },
  });

const afficherLeResume = (
  page: PageMontee<GrowthAuditComponent>,
  pillarScores: Record<string, number>,
): HTMLElement => {
  page.composant.auditSummary = buildAuditSummaryResponse({
    ready: true,
    status: 'COMPLETED',
    summaryText: 'Résumé prêt.',
    pillarScores,
  });
  page.fixture.componentRef.injector.get(ChangeDetectorRef).markForCheck();
  page.fixture.detectChanges();
  return page.racine;
};

describe('DIAG-01 · la page nomme les sept points par la table', () => {
  const page = pageMontee(GrowthAuditComponent, { providers: fournirUnPortDuDiagnostic() });

  it('DIAG-01 · la grille « Le diagnostic en 7 points » montre les sept noms et descriptions, dans l ordre de la table', () => {
    const grille = Array.from(page.racine.querySelectorAll('h2')).find((titre) =>
      titre.textContent?.includes('Le diagnostic en 7 points'),
    )?.parentElement;
    if (!grille) throw new Error('grille des sept points absente');

    expect(
      Array.from(grille.querySelectorAll<HTMLElement>('.rounded-form'), (carte) =>
        textes(carte, 'p'),
      ),
    ).toEqual(LA_TABLE);
  });

  it('DIAG-01 · le résumé prêt sans rapport nomme ses notes par la table, jamais par la clé', () => {
    const resume = afficherLeResume(page, { aiVisibility: 30, seo: 42 }).querySelector<HTMLElement>(
      '.bg-green-50',
    );
    if (!resume) throw new Error('résumé absent');

    expect(textes(resume, ':scope > p')).toEqual(['Résumé de votre diagnostic', 'Résumé prêt.']);
    expect(
      Array.from(resume.querySelectorAll<HTMLElement>('.grid > div'), (carte) =>
        textes(carte, 'p'),
      ),
    ).toEqual([
      ['Être trouvé sur Google', '42/100'],
      ['Visibilité dans les IA', '30/100'],
    ]);
  });
});

describe('DIAG-01 · le rapport nomme les sept points par la même table', () => {
  it('DIAG-01 · le rapport nomme chaque point servi par le nom de la table, dans l ordre servi, sans description', () => {
    const rapport = rendreLeRapport({
      pillarScorecard: [
        'seo',
        'performance',
        'technical',
        'trust',
        'conversion',
        'aiVisibility',
        'citationWorthiness',
      ].map(note),
    });

    expect(textes(rapport, '.pillar-card__name')).toEqual([
      'Être trouvé sur Google',
      'Vitesse',
      'Solidité du site',
      'Confiance',
      'Clarté et appels',
      'Visibilité dans les IA',
      'Matière à citer',
    ]);
    expect(rapport.textContent).not.toContain(LA_TABLE[2][1]);
  });

  it('DIAG-01 · une clé que la table ne connaît pas s affiche telle que servie', () => {
    expect(
      textes(rendreLeRapport({ pillarScorecard: [note('inconnu')] }), '.pillar-card__name'),
    ).toEqual(['inconnu']);
  });

  it('DIAG-01 · la carte moteur IA du rapport porte le nom du point, la carte Google garde le sien', () => {
    expect(
      textes(
        rendreLeRapport({ pillarScorecard: [] }),
        '[data-testid="engine-card"] > p:first-child',
      ),
    ).toEqual(['Visibilité Google', 'Visibilité dans les IA']);
  });
});

describe('DIAG-02 · un mot technique se lit entier', () => {
  it('DIAG-02 · un mot se lit entier, lettres accentuées comprises, sans la casse', () => {
    expect(interditsDe('Tech & scalabilité')).toEqual(['scalabilité']);
    expect(interditsDe('SEO fondations')).toEqual(['SEO']);
    expect(interditsDe('métadonnées, metadata')).toEqual([]);
    expect(interditsDe('Priority quick wins, then SEO_audit')).toEqual(['quick wins', 'SEO']);
    expect(interditsDe('SEO_audit')).toEqual(['SEO']);
    expect(interditsDe('SEO, puis seo et Core  Web\nVitals')).toEqual([
      'SEO',
      'seo',
      'Core  Web\nVitals',
    ]);
    expect(motsTrouves('Angular', [])).toEqual([]);
  });
});

describe('DIAG-02 · la page Diagnostic gratuit parle sans mot technique', () => {
  const page = pageMontee(GrowthAuditComponent, { providers: fournirUnPortDuDiagnostic() });

  it('DIAG-02 · l étape 3 promet une note claire et les corrections rapides, en mots simples', () => {
    expect(textes(page.racine, '.image-background-audit li')).toEqual([
      'Rapport PDF détaillé',
      'Une note claire, point par point',
      'Les corrections rapides d’abord, puis les priorités',
      'Aucun engagement',
    ]);
  });

  it('DIAG-02 · la FAQ « Que contient le diagnostic ? » nomme les sept points par leurs noms', () => {
    expect(page.racine.textContent).toContain(
      'Le diagnostic passe en revue sept points : clarté et appels, vitesse, être trouvé sur Google, confiance, solidité du site, visibilité dans les IA et matière à citer. Vous recevez une note point par point, les corrections rapides d’abord, puis les priorités.',
    );
  });

  it('DIAG-02 · la page et son résumé ne lisent aucun mot technique', () => {
    const lu = texteLu(afficherLeResume(page, { seo: 42, technical: 60 }));

    expect(lu).toContain('Résumé de votre diagnostic');
    expect(interditsDe(lu)).toEqual([]);
  });
});

describe('DIAG-02 · le rapport parle sans mot technique', () => {
  it('DIAG-02 · le rapport titre « Votre note, point par point » et « Les corrections rapides d abord »', () => {
    expect(textes(rapportServi(), 'h3').slice(0, 2)).toEqual([
      'Votre note, point par point',
      'Les corrections rapides d’abord',
    ]);
  });

  it('DIAG-02 · le rapport, hors textes servis, ne lit aucun mot technique', () => {
    const lu = texteLu(rapportServi());

    expect(lu).toContain('Votre rapport de diagnostic');
    expect(interditsDe(lu)).toEqual([]);
  });
});
