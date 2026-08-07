import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
// ROUGE (TDD) : ce composant n'existe pas encore — Batch 6 DRY P3 auth.
import { AuthShellComponent } from './auth-shell.component';

/**
 * Hote de test : reproduit le contrat d'usage des 4 pages auth.
 * - slot nomme [aside] : le wrapper `.auth-aside-mid` complet (kicker/h2/p),
 *   projete verbatim depuis la page pour preserver les IDs i18n `@@` + `<em>`.
 * - slot par defaut : corps de la carte (formulaire ou bloc succes).
 */
@Component({
  standalone: true,
  imports: [AuthShellComponent],
  template: `
    <app-auth-shell>
      <div aside class="auth-aside-mid">
        <span class="kicker">Bon retour</span>
        <h2>Reprenez là où vous <em>vous étiez arrêté</em>.</h2>
        <p>Accédez à vos formations.</p>
      </div>
      <div class="card-body-probe">Corps de carte projeté</div>
    </app-auth-shell>
  `,
})
class HostComponent {}

describe('AuthShellComponent', () => {
  /** Configure le TestBed avec le shell seul (chrome statique, sans projection). */
  function setupBare(): ComponentFixture<AuthShellComponent> {
    TestBed.configureTestingModule({
      imports: [AuthShellComponent],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(AuthShellComponent);
    fixture.detectChanges();
    return fixture;
  }

  /** Configure le TestBed avec l'hote projetant aside + corps de carte. */
  function setupWithHost(): ComponentFixture<HostComponent> {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('se cree', () => {
    const fixture = setupBare();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('structure le split-screen : .auth-split > .auth-aside + .auth-main > .auth-card', () => {
    const el = setupBare().nativeElement as HTMLElement;
    expect(el.querySelector('.auth-split')).not.toBeNull();
    expect(el.querySelector('.auth-split > .auth-aside')).not.toBeNull();
    expect(el.querySelector('.auth-split > .auth-main')).not.toBeNull();
    expect(el.querySelector('.auth-main > .auth-card')).not.toBeNull();
  });

  it("rend le logo Asili en lien vers l'accueil (routerLink /)", () => {
    const el = setupBare().nativeElement as HTMLElement;
    const logo = el.querySelector('a.auth-logo') as HTMLAnchorElement | null;
    expect(logo).not.toBeNull();
    expect(logo?.getAttribute('href')).toBe('/');
    // Puce decorative + wordmark Asili / design.
    expect(logo?.querySelector('span.dot[aria-hidden]')).not.toBeNull();
    expect(logo?.textContent).toContain('Asili');
    expect(logo?.querySelector('small')?.textContent).toContain('design');
  });

  it('rend la citation de pied dans .auth-aside-foot (i18n @@authAsideQuote)', () => {
    const el = setupBare().nativeElement as HTMLElement;
    const foot = el.querySelector('.auth-aside-foot');
    expect(foot).not.toBeNull();
    expect(foot?.textContent).toContain('Clarifier avant de construire');
  });

  it("projette le contenu [aside] (kicker/titre/em) dans l'aside", () => {
    const el = setupWithHost().nativeElement as HTMLElement;
    const asideMid = el.querySelector('.auth-aside .auth-aside-mid');
    expect(asideMid).not.toBeNull();
    expect(asideMid?.querySelector('.kicker')?.textContent).toContain('Bon retour');
    expect(asideMid?.querySelector('h2 em')?.textContent).toContain('vous étiez arrêté');
  });

  it('projette le corps par defaut dans .auth-card', () => {
    const el = setupWithHost().nativeElement as HTMLElement;
    const body = el.querySelector('.auth-card .card-body-probe');
    expect(body).not.toBeNull();
    expect(body?.textContent).toContain('Corps de carte projeté');
  });

  it("n'importe pas RevealOnScrollDirective (chrome statique, appReveal reste porte par la page)", () => {
    const el = setupBare().nativeElement as HTMLElement;
    // Le shell ne rend aucun `.auth-aside-mid` en propre : il est projete.
    expect(el.querySelector('.auth-aside > .auth-aside-mid')).toBeNull();
  });
});
