import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterModule } from '@angular/router';
import { AuthSuccessComponent } from './auth-success.component';

const MESSAGE = 'Un email de réinitialisation vous a été envoyé.';

@Component({
  standalone: true,
  imports: [AuthSuccessComponent, RouterModule],
  template: `
    <app-auth-success [message]="message">
      <h1 title>Email <em>envoyé</em></h1>
      <p class="sub redirect-probe">Redirection...</p>
      <p class="auth-alt">
        <a routerLink="/login" class="back-probe">← Retour à la connexion</a>
      </p>
    </app-auth-success>
  `,
})
class HostComponent {
  message = MESSAGE;
}

describe('AuthSuccessComponent', () => {
  function setupBare(message = MESSAGE): ComponentFixture<AuthSuccessComponent> {
    TestBed.configureTestingModule({
      imports: [AuthSuccessComponent],
    });
    const fixture = TestBed.createComponent(AuthSuccessComponent);
    fixture.componentRef.setInput('message', message);
    fixture.detectChanges();
    return fixture;
  }

  function setupWithHost(): ComponentFixture<HostComponent> {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('se cree', () => {
    expect(setupBare().componentInstance).toBeTruthy();
  });

  it('rend le conteneur .auth-success avec role=status + aria-live=polite', () => {
    const el = setupBare().nativeElement as HTMLElement;
    const box = el.querySelector('.auth-success');
    expect(box).not.toBeNull();
    expect(box?.getAttribute('role')).toBe('status');
    expect(box?.getAttribute('aria-live')).toBe('polite');
  });

  it('rend la coche SVG (chemin exact) dans .check[aria-hidden]', () => {
    const el = setupBare().nativeElement as HTMLElement;
    const check = el.querySelector('.auth-success .check[aria-hidden]');
    expect(check).not.toBeNull();
    const path = check?.querySelector('svg path');
    expect(path?.getAttribute('d')).toBe('M5 12.5 10 17l9-10');
  });

  it('rend le message (input) dans <p class="sub">', () => {
    const el = setupBare('Message de test').nativeElement as HTMLElement;
    const sub = el.querySelector('p.sub');
    expect(sub).not.toBeNull();
    expect(sub?.textContent?.trim()).toBe('Message de test');
  });

  it("met a jour le rendu quand l'input message change", () => {
    const fixture = setupBare('initial');
    fixture.componentRef.setInput('message', 'actualise');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('p.sub')?.textContent?.trim()).toBe('actualise');
  });

  it('projette le titre [title] (avec <em>) fourni par la page', () => {
    const el = setupWithHost().nativeElement as HTMLElement;
    const h1 = el.querySelector('.auth-success h1');
    expect(h1).not.toBeNull();
    expect(h1?.querySelector('em')?.textContent).toContain('envoyé');
  });

  it("projette l'action par defaut (lien / bouton) fournie par la page", () => {
    const el = setupWithHost().nativeElement as HTMLElement;
    const back = el.querySelector('.auth-success .back-probe');
    expect(back).not.toBeNull();
    expect((back as HTMLAnchorElement).getAttribute('href')).toBe('/login');
  });

  it('rend le message pilote (input) + le sous-titre projete (ex. redirect verify)', () => {
    const el = setupWithHost().nativeElement as HTMLElement;
    const subs = el.querySelectorAll('.auth-success p.sub');
    const texts = Array.from(subs).map((n) => n.textContent?.trim());
    expect(texts).toContain(MESSAGE);
    expect(el.querySelector('.auth-success .redirect-probe')).not.toBeNull();
  });
});
