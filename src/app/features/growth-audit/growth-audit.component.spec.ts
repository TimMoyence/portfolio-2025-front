import { LOCALE_ID } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { NgForm } from '@angular/forms';
import { of, throwError } from 'rxjs';
import type { AuditStreamEvent } from '../../core/models/audit-request.model';
import { AUDIT_REQUEST_PORT } from '../../core/ports/audit-request.port';
import { GrowthAuditComponent } from './growth-audit.component';
import { erreursApresSaisie, texteDuBlocDuChamp } from '../../../testing/champ-de-formulaire';
import {
  buildAuditCompletedEvent,
  buildAuditCreateResponse,
  buildAuditFailedEvent,
  buildAuditProgressEvent,
  buildAuditSummaryResponse,
  buildAuditStreamHeartbeat,
  buildAuditTimeoutEvent,
  buildClientReport,
  createAuditRequestPortStub,
} from '../../../testing/factories/audit-request.factory';

function buildValidForm(): NgForm {
  return jasmine.createSpyObj<NgForm>('NgForm', ['resetForm'], {
    valid: true,
  });
}

function remplirEtSoumettre(component: GrowthAuditComponent, rgpdConsent: boolean): void {
  component.auditFormState = {
    websiteName: 'https://example.com',
    contactMethod: 'EMAIL',
    contactValue: 'test@example.com',
  };
  component.rgpdConsent = rgpdConsent;

  component.submit(buildValidForm());
}

describe('GrowthAuditComponent', () => {
  const auditServiceMock = createAuditRequestPortStub();

  beforeEach(async () => {
    auditServiceMock.submit.calls.reset();
    auditServiceMock.getSummary.calls.reset();
    auditServiceMock.stream.calls.reset();

    auditServiceMock.submit.and.returnValue(of(buildAuditCreateResponse({ auditId: 'audit-id' })));
    auditServiceMock.getSummary.and.returnValue(of(buildAuditSummaryResponse()));
    auditServiceMock.stream.and.returnValue(of(buildAuditStreamHeartbeat()));

    await TestBed.configureTestingModule({
      imports: [GrowthAuditComponent],
      providers: [{ provide: AUDIT_REQUEST_PORT, useValue: auditServiceMock }],
    }).compileComponents();
  });

  it('envoie avec la demande d audit la langue du site lue de LOCALE_ID, sans sa région', () => {
    TestBed.overrideProvider(LOCALE_ID, { useValue: 'en-GB' });
    const fixture = TestBed.createComponent(GrowthAuditComponent);

    remplirEtSoumettre(fixture.componentInstance, true);

    expect(auditServiceMock.submit.calls.mostRecent().args[0].locale).toBe('en');
  });

  function soumettreEtDiffuser(event: AuditStreamEvent, auditId: string) {
    const fixture = TestBed.createComponent(GrowthAuditComponent);
    auditServiceMock.submit.and.returnValue(
      of(buildAuditCreateResponse({ auditId, httpCode: 201 })),
    );
    auditServiceMock.stream.and.returnValue(of<AuditStreamEvent>(event));

    remplirEtSoumettre(fixture.componentInstance, true);
    fixture.detectChanges();

    return {
      component: fixture.componentInstance,
      root: fixture.nativeElement as HTMLElement,
    };
  }

  it('renders current URL and synthesis section badges from enriched progress details', () => {
    const { component, root } = soumettreEtDiffuser(
      buildAuditProgressEvent({
        auditId: 'audit-1',
        progress: 72,
        step: 'Recap IA des pages',
        details: {
          phase: 'synthesis',
          iaTask: 'synthesis',
          iaSubTask: 'prioritySection',
          currentUrl: 'https://example.com/pricing',
          recentCompletedUrls: ['https://example.com/', 'https://example.com/about'],
          sectionStatuses: {
            summary: 'completed',
            prioritySection: 'started',
          },
        },
      }),
      'audit-1',
    );

    expect(component.auditCurrentUrl).toBe('https://example.com/pricing');
    expect(component.auditIaTask).toBe('Synthèse IA');
    expect(component.auditSectionBadges.length).toBeGreaterThan(0);
    const content = root.textContent as string;
    expect(content).toContain('URL en cours');
    expect(content).toContain('https://example.com/pricing');
    expect(content).toContain('Résumé: completed');
    expect(content).toContain('Priorités: started');
  });

  it('affiche la section annoncée par l évènement sans altérer les statuts reçus', () => {
    const statutsRecus = { summary: 'completed' };
    const { root } = soumettreEtDiffuser(
      buildAuditProgressEvent({
        auditId: 'audit-3',
        progress: 80,
        step: 'Recap IA des pages',
        details: {
          sectionStatuses: statutsRecus,
          section: 'prioritySection',
          sectionStatus: 'started',
        },
      }),
      'audit-3',
    );

    expect(root.textContent).toContain('Priorités: started');
    expect(statutsRecus).toEqual({ summary: 'completed' });
  });

  it('keeps backward compatibility when progress details only expose done/total', () => {
    const { component } = soumettreEtDiffuser(
      buildAuditProgressEvent({
        auditId: 'audit-2',
        progress: 45,
        step: 'Analyse des pages',
        details: { done: 3, total: 10 },
      }),
      'audit-2',
    );

    expect(component.auditStep).toContain('(3/10)');
    expect(component.auditCurrentUrl).toBe('');
    expect(component.auditSectionBadges).toEqual([]);
  });

  it('renders client report section when event contains clientReport', () => {
    const clientReport = buildClientReport();

    const { component, root } = soumettreEtDiffuser(
      buildAuditCompletedEvent({
        auditId: 'audit-42',
        summaryText: 'Résumé legacy',
        clientReport,
      }),
      'audit-42',
    );

    expect(component.clientReport).toEqual(clientReport);
    expect(root.querySelector('app-audit-client-report-section')).toBeTruthy();
  });

  it('falls back to legacy summary when clientReport is absent', () => {
    const { component, root } = soumettreEtDiffuser(
      buildAuditCompletedEvent({
        auditId: 'audit-43',
        summaryText: 'Résumé de votre audit',
        pillarScores: { seo: 80 },
      }),
      'audit-43',
    );

    expect(component.clientReport).toBeNull();
    expect(root.querySelector('app-audit-client-report-section')).toBeNull();
    expect(root.textContent).toContain('Résumé de votre audit');
  });

  it('does not crash on unknown details keys', () => {
    const { component } = soumettreEtDiffuser(
      buildAuditProgressEvent({
        auditId: 'audit-3',
        progress: 30,
        step: 'Analyse',
        details: {
          foo: 'bar',
          nested: { ok: true },
        },
      }),
      'audit-3',
    );

    expect(component.auditPhaseLabel).toBe('');
    expect(component.auditCurrentUrl).toBe('');
    expect(component.auditRecentCompletedUrls).toEqual([]);
  });

  describe('bornes et grammaires du back sur la demande d audit', () => {
    function monterLeFormulaire(): ComponentFixture<GrowthAuditComponent> {
      const fixture = TestBed.createComponent(GrowthAuditComponent);
      fixture.detectChanges();
      return fixture;
    }

    it('borne le nom du site entre 2 et 200 caractères', async () => {
      const fixture = monterLeFormulaire();

      expect(await erreursApresSaisie(fixture, '#websiteName', 'a')).toEqual({
        minlength: { requiredLength: 2, actualLength: 1 },
      });
      expect(texteDuBlocDuChamp(fixture, '#websiteName', 'form')).toContain(
        'Ce champ doit contenir au moins 2 caractères.',
      );
      expect(await erreursApresSaisie(fixture, '#websiteName', 'a'.repeat(201))).toEqual({
        maxlength: { requiredLength: 200, actualLength: 201 },
      });
      expect(await erreursApresSaisie(fixture, '#websiteName', 'ab')).toBeNull();
    });

    it('refuse un contact par email que le back refuse, et le borne entre 6 et 200 caractères', async () => {
      const fixture = monterLeFormulaire();

      expect(await erreursApresSaisie(fixture, '#contactValue', 'jean@gmail')).toEqual({
        email: true,
      });
      expect(
        Object.keys((await erreursApresSaisie(fixture, '#contactValue', 'a@b.c')) ?? {}),
      ).toEqual(jasmine.arrayWithExactContents(['email', 'minlength']));
      const adresseDe201 = `${'a'.repeat(15)}@${'b'.repeat(60)}.${'c'.repeat(60)}.${'d'.repeat(60)}.fr`;
      expect(await erreursApresSaisie(fixture, '#contactValue', adresseDe201)).toEqual({
        maxlength: { requiredLength: 200, actualLength: 201 },
      });
      expect(await erreursApresSaisie(fixture, '#contactValue', 'jean@exemple.fr')).toBeNull();
    });

    it('refuse un contact par téléphone que le back refuse, et le dit sous le champ', async () => {
      const fixture = monterLeFormulaire();
      fixture.componentInstance.handleMethodChange('PHONE');
      fixture.detectChanges();

      expect(await erreursApresSaisie(fixture, '#contactValue', '06 98 a0 32 82')).toEqual({
        phone: true,
      });
      expect(texteDuBlocDuChamp(fixture, '#contactValue', 'div')).toContain(
        'Merci d’entrer un numéro de téléphone valide.',
      );
      expect(await erreursApresSaisie(fixture, '#contactValue', '06 98 50 32 82')).toBeNull();
    });
  });

  it('exposes the seven report pillars in the public offer', () => {
    const fixture = TestBed.createComponent(GrowthAuditComponent);
    const component = fixture.componentInstance;

    expect(component.pillars).toHaveSize(7);
    expect(component.pillars.map(({ title }) => title)).toEqual([
      'Conversion & clarté',
      'Vitesse & performance',
      'SEO fondations',
      'Crédibilité & confiance',
      'Tech & scalabilité',
      'Visibilité IA',
      'Citabilité',
    ]);
  });

  describe('fin et interruption de l audit', () => {
    function soumettreSansFlux(): GrowthAuditComponent {
      const fixture = TestBed.createComponent(GrowthAuditComponent);
      auditServiceMock.stream.and.returnValue(throwError(() => new Error('flux coupe')));
      remplirEtSoumettre(fixture.componentInstance, true);
      return fixture.componentInstance;
    }

    it('vide le formulaire une fois la demande envoyee', () => {
      const fixture = TestBed.createComponent(GrowthAuditComponent);
      const form = buildValidForm();
      fixture.componentInstance.auditFormState = {
        websiteName: 'https://example.com',
        contactMethod: 'PHONE',
        contactValue: '0698503282',
      };
      fixture.componentInstance.rgpdConsent = true;

      fixture.componentInstance.submit(form);

      const vierge = fixture.componentInstance.auditFormState;
      expect(vierge).toEqual({
        website: '',
        formStartedAt: jasmine.any(Number),
        websiteName: '',
        contactMethod: 'EMAIL',
        contactValue: '',
      });
      expect(fixture.componentInstance.rgpdConsent).toBeFalse();
      expect(form.resetForm).toHaveBeenCalledWith(vierge);
    });

    for (const error of [null, 'connect ECONNREFUSED 10.0.0.5:5432']) {
      it(`affiche le message générique d un audit échoué sans lire le texte d erreur servi (${error}), et efface la chronologie`, () => {
        const { component } = soumettreEtDiffuser(buildAuditFailedEvent({ error }), 'audit-5');

        expect(component.isAuditRunning).toBeFalse();
        expect(component.errorMessage).toBe("L'audit a échoué.");
        expect(component.auditSectionBadges).toEqual([]);
      });
    }

    it('affiche la connexion interrompue sur un délai dépassé, sans relire le résumé ni rouvrir le flux', () => {
      const { component } = soumettreEtDiffuser(
        buildAuditTimeoutEvent({ error: 'SSE stream closed after 1800000ms' }),
        'audit-6',
      );

      expect(component.isAuditRunning).toBeFalse();
      expect(component.errorMessage).toContain('Connexion interrompue pendant l');
      expect(component.errorMessage).not.toContain('SSE');
      expect(component.auditSectionBadges).toEqual([]);
      expect(auditServiceMock.stream).toHaveBeenCalledTimes(1);
      expect(auditServiceMock.getSummary).not.toHaveBeenCalled();
    });

    it('reprend un audit termine depuis le resume quand le flux tombe', () => {
      auditServiceMock.getSummary.and.returnValue(
        of(buildAuditSummaryResponse({ ready: true, status: 'COMPLETED', progress: 100 })),
      );

      const component = soumettreSansFlux();

      expect(component.auditProgress).toBe(100);
      expect(component.auditStep).toBe('Audit terminé');
      expect(component.isAuditRunning).toBeFalse();
      expect(component.errorMessage).toBeUndefined();
    });

    it('signale l echec lu dans le resume quand le flux tombe', () => {
      auditServiceMock.getSummary.and.returnValue(
        of(buildAuditSummaryResponse({ status: 'FAILED' })),
      );

      const component = soumettreSansFlux();

      expect(component.isAuditRunning).toBeFalse();
      expect(component.errorMessage).toBe("L'audit a échoué.");
    });

    it('rouvre le flux trois fois avant de declarer la connexion perdue', () => {
      const component = soumettreSansFlux();

      expect(auditServiceMock.stream).toHaveBeenCalledTimes(4);
      expect(component.isAuditRunning).toBeFalse();
      expect(component.errorMessage).toContain('Connexion interrompue pendant l');
    });

    it('signale un resume illisible quand le flux tombe', () => {
      auditServiceMock.getSummary.and.returnValue(throwError(() => new Error('503')));

      const component = soumettreSansFlux();

      expect(component.isAuditRunning).toBeFalse();
      expect(component.errorMessage).toContain('Impossible de récupérer le résumé');
    });
  });

  describe('P0.4 — consentement RGPD obligatoire', () => {
    it('bloque la soumission si rgpdConsent est false', () => {
      const fixture = TestBed.createComponent(GrowthAuditComponent);
      const component = fixture.componentInstance;

      remplirEtSoumettre(component, false);
      fixture.detectChanges();

      expect(auditServiceMock.submit).not.toHaveBeenCalled();
      expect(component.errorMessage).toBe(component.formLabels.rgpdError);
    });

    it('laisse passer la soumission si rgpdConsent est true', () => {
      const fixture = TestBed.createComponent(GrowthAuditComponent);
      const component = fixture.componentInstance;
      auditServiceMock.submit.and.returnValue(
        of(buildAuditCreateResponse({ auditId: 'audit-ok', httpCode: 201 })),
      );

      remplirEtSoumettre(component, true);
      fixture.detectChanges();

      expect(auditServiceMock.submit).toHaveBeenCalledTimes(1);
      expect(component.errorMessage).toBeUndefined();
    });
  });
});
