import { Component } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PRESENTATION_PORT } from '../../../../core/ports/presentation.port';
import {
  buildInteractionsResponse,
  createPresentationPortStub,
} from '../../../../../testing/factories/presentation.factory';
import { SlidePollComponent } from './slide-poll.component';

@Component({
  standalone: true,
  imports: [SlidePollComponent],
  template: `<app-slide-poll slug="ia-solopreneurs" interactionId="poll-1" />`,
})
class HostComponent {}

describe('SlidePollComponent', () => {
  beforeEach(() => {
    const portStub = createPresentationPortStub(
      buildInteractionsResponse({
        interactions: {
          'poll-1': {
            present: [
              {
                type: 'poll',
                question: 'Quel outil utilises-tu le plus ?',
                options: ['ChatGPT', 'Claude', 'Gemini'],
              },
            ],
          },
        },
      }),
    );
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: PRESENTATION_PORT, useValue: portStub }],
    });
  });

  it('rend la question et les options', fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.slide-poll__question').textContent.trim()).toBe(
      'Quel outil utilises-tu le plus ?',
    );
    expect(fixture.nativeElement.querySelectorAll('.slide-poll__option').length).toBe(3);
  }));

  it('incrémente le compteur local après vote', fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const opts = fixture.nativeElement.querySelectorAll('.slide-poll__option');
    opts[0].click();
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector(".slide-poll__bar[data-index='0']");
    expect(bar.style.width).toBe('100%');
  }));

  it("marque l'option votée avec aria-current et laisse les autres sans", fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const opts = fixture.nativeElement.querySelectorAll('.slide-poll__option');
    opts[1].click();
    fixture.detectChanges();

    expect(opts[1].getAttribute('aria-current')).toBe('true');
    expect(opts[0].getAttribute('aria-current')).toBeNull();
    expect(opts[2].getAttribute('aria-current')).toBeNull();
  }));

  it('annonce le vote enregistré dans une région live', fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const live = fixture.nativeElement.querySelector('.slide-poll__status');
    expect(live).toBeTruthy();
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent.trim()).toBe('');

    fixture.nativeElement.querySelectorAll('.slide-poll__option')[1].click();
    fixture.detectChanges();

    expect(live.textContent).toContain('Claude');
  }));
});
