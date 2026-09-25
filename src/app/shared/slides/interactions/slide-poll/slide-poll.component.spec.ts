import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { fakeAsync } from '@angular/core/testing';
import {
  configurerLHoteDInteraction,
  monterApresChargement,
} from '../../../../../testing/hote-d-interaction';
import { SlidePollComponent } from './slide-poll.component';

@Component({
  standalone: true,
  imports: [SlidePollComponent],
  template: `<app-slide-poll slug="ia-solopreneurs" interactionId="poll-1" />`,
})
class HostComponent {}

describe('SlidePollComponent', () => {
  beforeEach(() => {
    configurerLHoteDInteraction(HostComponent, {
      'poll-1': {
        present: [
          {
            type: 'poll',
            question: 'Quel outil utilises-tu le plus ?',
            options: ['ChatGPT', 'Claude', 'Gemini'],
          },
        ],
      },
    });
  });

  function voter(index: number): { fixture: ComponentFixture<HostComponent>; opts: HTMLElement[] } {
    const fixture = monterApresChargement(HostComponent);
    const opts = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('.slide-poll__option'),
    );
    opts[index].click();
    fixture.detectChanges();
    return { fixture, opts };
  }

  it('rend la question et les options', fakeAsync(() => {
    const fixture = monterApresChargement(HostComponent);
    expect(fixture.nativeElement.querySelector('.slide-poll__question').textContent.trim()).toBe(
      'Quel outil utilises-tu le plus ?',
    );
    expect(fixture.nativeElement.querySelectorAll('.slide-poll__option').length).toBe(3);
  }));

  it('incrémente le compteur local après vote', fakeAsync(() => {
    const { fixture } = voter(0);
    const bar = fixture.nativeElement.querySelector(".slide-poll__bar[data-index='0']");
    expect(bar.style.width).toBe('100%');
  }));

  it("marque l'option votée avec aria-current et laisse les autres sans", fakeAsync(() => {
    const { opts } = voter(1);

    expect(opts[1].getAttribute('aria-current')).toBe('true');
    expect(opts[0].getAttribute('aria-current')).toBeNull();
    expect(opts[2].getAttribute('aria-current')).toBeNull();
  }));

  it('annonce le vote enregistré dans une région live', fakeAsync(() => {
    const fixture = monterApresChargement(HostComponent);

    const live = fixture.nativeElement.querySelector('.slide-poll__status');
    expect(live).toBeTruthy();
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent.trim()).toBe('');

    fixture.nativeElement.querySelectorAll('.slide-poll__option')[1].click();
    fixture.detectChanges();

    expect(live.textContent).toContain('Claude');
  }));
});
