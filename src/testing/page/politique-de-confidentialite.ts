import { LOCALE_ID, PLATFORM_ID } from '@angular/core';
import { PrivacyComponent } from '../../app/features/annexes/privacy/privacy.component';
import { setupTestBed } from '../setup-test-bed';

export function rendreLaPolitique(): HTMLElement {
  const fixture = setupTestBed({
    http: false,
    router: true,
    imports: [PrivacyComponent],
    providers: [
      { provide: PLATFORM_ID, useValue: 'browser' },
      { provide: LOCALE_ID, useValue: 'fr' },
    ],
  }).createComponent(PrivacyComponent);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

export const texteNormalise = (element: Element | null): string =>
  (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
