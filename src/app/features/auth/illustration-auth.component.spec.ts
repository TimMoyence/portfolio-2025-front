import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { IllustrationAuthComponent } from './illustration-auth.component';

@Component({
  standalone: true,
  imports: [IllustrationAuthComponent],
  template: `<div [appIllustrationAuth]="'cadenas'"></div>`,
})
class HoteIllustrationComponent {}

describe('IllustrationAuthComponent', () => {
  it('habille la tuile auth-illus, masquee aux lecteurs d ecran, du picto demande', () => {
    setupTestBed({ http: false, imports: [HoteIllustrationComponent] });
    const fixture = TestBed.createComponent(HoteIllustrationComponent);
    fixture.detectChanges();

    const tuile = (fixture.nativeElement as HTMLElement).querySelector('div') as HTMLDivElement;

    expect(tuile.className).toBe('auth-illus');
    expect(tuile.getAttribute('aria-hidden')).toBe('true');
    expect(tuile.querySelector('svg rect')?.getAttribute('y')).toBe('11');
  });
});
