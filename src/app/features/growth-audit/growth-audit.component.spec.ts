import { TestBed } from '@angular/core/testing';
import type { NgForm } from '@angular/forms';
import { of } from 'rxjs';
import type { AuditStreamEvent } from '../../core/models/audit-request.model';
import { AUDIT_REQUEST_PORT } from '../../core/ports/audit-request.port';
import { GrowthAuditComponent } from './growth-audit.component';
import {
  buildAuditCompletedEvent,
  buildAuditCreateResponse,
  buildAuditProgressEvent,
  buildAuditSummaryResponse,
  buildAuditStreamHeartbeat,
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
