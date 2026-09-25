import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { HoneypotDirective } from './honeypot.directive';

@Component({
  standalone: true,
  imports: [HoneypotDirective],
  template: `<input appHoneypot name="website" />`,
})
class HotePiegeComponent {}

describe('HoneypotDirective', () => {
  it('pose sur le champ les attributs qui le cachent aux humains et aux lecteurs d ecran', () => {
    setupTestBed({ http: false, imports: [HotePiegeComponent] });
    const fixture = TestBed.createComponent(HotePiegeComponent);
    fixture.detectChanges();

    const champ = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(champ.getAttribute('name')).toBe('website');
    expect(champ.getAttribute('type')).toBe('text');
    expect(champ.getAttribute('tabindex')).toBe('-1');
    expect(champ.getAttribute('autocomplete')).toBe('off');
    expect(champ.getAttribute('aria-hidden')).toBe('true');
    expect(champ.className).toBe('absolute -left-[10000px] h-px w-px overflow-hidden');
  });
});
