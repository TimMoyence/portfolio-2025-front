import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PRESENTATION_PORT } from '../../../core/ports/presentation.port';
import { SlideDeckService } from '../../../shared/slides';
import { createPresentationPortStub } from '../../../../testing/factories/presentation.factory';
import { AuditSeoDiyComponent } from './audit-seo-diy.component';

describe('AuditSeoDiyComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AuditSeoDiyComponent],
      providers: [
        SlideDeckService,
        provideRouter([]),
        {
          provide: PRESENTATION_PORT,
          useValue: createPresentationPortStub(),
        },
      ],
    });
  });

  it('rend la slide hero', () => {
    const fixture = TestBed.createComponent(AuditSeoDiyComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-slide-hero')).toBeTruthy();
  });

  it('rend une slide CTA vers le toolkit audit', () => {
    const fixture = TestBed.createComponent(AuditSeoDiyComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-slide-cta')).toBeTruthy();
  });
});
