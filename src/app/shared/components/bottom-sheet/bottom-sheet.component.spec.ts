import { Component, PLATFORM_ID, signal } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BottomSheetComponent } from './bottom-sheet.component';

@Component({
  standalone: true,
  imports: [BottomSheetComponent],
  template: `
    <app-bottom-sheet [open]="open()" [title]="title" (openChange)="open.set($event)">
      <p class="test-content">Contenu projete</p>
    </app-bottom-sheet>
  `,
})
class TestHostComponent {
  open = signal(false);
  title = 'Titre test';
}

async function monterLHote(
  plateforme: 'browser' | 'server',
): Promise<ComponentFixture<TestHostComponent>> {
  await TestBed.configureTestingModule({
    imports: [TestHostComponent, NoopAnimationsModule],
    providers: [{ provide: PLATFORM_ID, useValue: plateforme }],
  }).compileComponents();
  return TestBed.createComponent(TestHostComponent);
}

describe('BottomSheetComponent', () => {
  describe('en contexte navigateur (desktop)', () => {
    let host: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    function ouvrir(selecteur: string): HTMLElement {
      host.open.set(true);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const element = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(selecteur);
      expect(element).toBeTruthy();
      return element!;
    }

    beforeEach(async () => {
      fixture = await monterLHote('browser');
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('devrait se creer', () => {
      const sheet = fixture.debugElement.query((el) => el.name === 'app-bottom-sheet');
      expect(sheet).toBeTruthy();
    });

    it('ne devrait rien afficher quand open=false', () => {
      const overlay = fixture.nativeElement.querySelector('[data-testid="bottom-sheet-overlay"]');
      expect(overlay).toBeNull();
    });

    it('devrait afficher le panel quand open=true', fakeAsync(() => {
      ouvrir('[data-testid="bottom-sheet-panel"]');
    }));

    it('devrait projeter le contenu', fakeAsync(() => {
      expect(ouvrir('.test-content').textContent).toContain('Contenu projete');
    }));

    it('devrait afficher le titre', fakeAsync(() => {
      expect(ouvrir('[data-testid="bottom-sheet-title"]').textContent).toContain('Titre test');
    }));

    it('devrait avoir role=dialog et aria-modal=true', fakeAsync(() => {
      const panel = ouvrir('[data-testid="bottom-sheet-panel"]');
      expect(panel.getAttribute('role')).toBe('dialog');
      expect(panel.getAttribute('aria-modal')).toBe('true');
    }));

    it('devrait emettre openChange(false) au clic sur le bouton fermer', fakeAsync(() => {
      ouvrir('[data-testid="bottom-sheet-close"]').click();
      fixture.detectChanges();

      expect(host.open()).toBe(false);
    }));

    it('devrait fermer avec la touche Escape', fakeAsync(() => {
      ouvrir('[data-testid="bottom-sheet-panel"]').dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape' }),
      );
      fixture.detectChanges();

      expect(host.open()).toBe(false);
    }));
  });

  describe('en contexte SSR', () => {
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
      fixture = await monterLHote('server');
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();
    });

    it('devrait se rendre sans erreur cote serveur', () => {
      const panel = fixture.nativeElement.querySelector('[data-testid="bottom-sheet-panel"]');
      expect(panel).toBeTruthy();
    });
  });
});
