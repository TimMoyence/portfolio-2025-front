import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FORMATIONS_PORT } from '../../../../core/ports/formations.port';
import type { FormationsPort } from '../../../../core/ports/formations.port';
import { PRESENTATION_PORT } from '../../../../core/ports/presentation.port';
import { createFormationsPortStub } from '../../../../../testing/factories/formations.factory';
import {
  buildInteractionsResponse,
  createPresentationPortStub,
} from '../../../../../testing/factories/presentation.factory';
import type { ModeInteraction } from '../mode-interaction';
import { SlideReflectionComponent } from './slide-reflection.component';

@Component({
  standalone: true,
  imports: [SlideReflectionComponent],
  template: ` <app-slide-reflection slug="ia-solopreneurs" interactionId="reflect-1" /> `,
})
class HostComponent {}

describe('SlideReflectionComponent', () => {
  let formations: jasmine.SpyObj<FormationsPort>;

  beforeEach(() => {
    const portStub = createPresentationPortStub(
      buildInteractionsResponse({
        interactions: {
          'reflect-1': {
            scroll: [
              {
                type: 'reflection',
                question: 'Quelle tâche aimerais-tu déléguer à une IA ?',
                placeholder: 'Ex: relances email',
              },
            ],
          },
        },
      }),
    );
    formations = createFormationsPortStub();
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        { provide: PRESENTATION_PORT, useValue: portStub },
        { provide: FORMATIONS_PORT, useValue: formations },
      ],
    });
  });

  function racine(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function monterEnSeance(
    mode: ModeInteraction,
    sessionId: string | null,
  ): ComponentFixture<SlideReflectionComponent> {
    const fixture = TestBed.createComponent(SlideReflectionComponent);
    fixture.componentRef.setInput('promptData', {
      id: 'reflexion-1',
      type: 'reflection',
      question: 'Pourquoi comparer les bases ?',
    });
    fixture.componentRef.setInput('screenId', 'ecran-1');
    fixture.componentRef.setInput('sessionId', sessionId);
    fixture.componentRef.setInput('jeton', 'jeton-1');
    fixture.componentRef.setInput('mode', mode);
    fixture.detectChanges();
    return fixture;
  }

  it('rend prompt et textarea', fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(racine(fixture).querySelector('.slide-reflection__prompt')?.textContent).toContain(
      'Quelle tâche',
    );
    expect(racine(fixture).querySelector('textarea')).toBeTruthy();
  }));

  it('sans seance, se presente en apercu : rien n est envoye, rien ne reste en attente', fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(racine(fixture).querySelector('[data-testid="slide-reflection-apercu"]')).not.toBeNull();
    expect(racine(fixture).querySelector('.slide-reflection__save')).toBeNull();
    expect(racine(fixture).textContent).not.toContain('en attente');
    expect(formations.enregistrerReponseLibre).not.toHaveBeenCalled();
  }));

  it('en projection, montre la consigne sans zone de saisie', () => {
    const fixture = monterEnSeance('projection', null);

    expect(racine(fixture).textContent).toContain('Pourquoi comparer les bases ?');
    expect(racine(fixture).querySelector('textarea')).toBeNull();
    expect(racine(fixture).querySelector('.slide-reflection__save')).toBeNull();
    expect(
      racine(fixture).querySelector('[data-testid="slide-reflection-projection"]'),
    ).not.toBeNull();
  });

  it('en seance, envoie la reflexion au serveur avec l ecran et l activite', () => {
    const fixture = monterEnSeance('seance', 'seance-envoi');
    const zone = racine(fixture).querySelector('textarea') as HTMLTextAreaElement;

    zone.value = '  On compare des parts de totaux différents.  ';
    zone.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (racine(fixture).querySelector('.slide-reflection__save') as HTMLButtonElement).click();

    expect(formations.enregistrerReponseLibre).toHaveBeenCalledOnceWith(
      'seance-envoi',
      'jeton-1',
      jasmine.objectContaining({
        screenId: 'ecran-1',
        activityId: 'reflexion-1',
        response: 'On compare des parts de totaux différents.',
      }),
    );
    expect(racine(fixture).querySelector('[data-testid="slide-reflection-apercu"]')).toBeNull();
  });
});
