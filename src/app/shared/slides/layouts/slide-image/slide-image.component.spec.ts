import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SlideImageComponent } from './slide-image.component';

@Component({
  standalone: true,
  imports: [SlideImageComponent],
  template: `
    <app-slide-image-left
      image="/images/why.webp"
      imageAlt="Diagramme pourquoi"
      title="Pourquoi maintenant ?"
    >
      <p>Contenu projeté.</p>
    </app-slide-image-left>
  `,
})
class HostLeftComponent {}

@Component({
  standalone: true,
  imports: [SlideImageComponent],
  template: `
    <app-slide-image-left
      image="/images/x.webp"
      imageAlt="alt"
      title="Titre"
      [paragraphs]="paragraphs"
      [items]="items"
    >
      <span class="extra">extra</span>
    </app-slide-image-left>
  `,
})
class HostLeftFullComponent {
  readonly paragraphs = ['Premier paragraphe', 'Second paragraphe'];
  readonly items = ['Item un', 'Item deux', 'Item trois'];
}

@Component({
  standalone: true,
  imports: [SlideImageComponent],
  template: `
    <app-slide-image-right image="/images/tools.webp" imageAlt="Outils IA" title="Quels outils ?">
      <p>Liste des outils.</p>
    </app-slide-image-right>
  `,
})
class HostRightComponent {}

@Component({
  standalone: true,
  imports: [SlideImageComponent],
  template: `
    <app-slide-image-right
      image="/images/x.webp"
      imageAlt="alt"
      title="Titre"
      [paragraphs]="paragraphs"
      [items]="items"
    >
      <span class="extra">extra</span>
    </app-slide-image-right>
  `,
})
class HostRightFullComponent {
  readonly paragraphs = ['Premier paragraphe', 'Second paragraphe'];
  readonly items = ['Item un', 'Item deux', 'Item trois'];
}

describe('SlideImageComponent', () => {
  describe('position left (app-slide-image-left)', () => {
    it('rend image gauche + titre + projection ng-content', () => {
      const fixture = TestBed.createComponent(HostLeftComponent);
      fixture.detectChanges();
      const root = fixture.nativeElement.querySelector('.slide-image');
      expect(root).toBeTruthy();
      const img = root.querySelector('img');
      expect(img.getAttribute('src')).toBe('/images/why.webp');
      expect(img.getAttribute('alt')).toBe('Diagramme pourquoi');
      const h2 = root.querySelector('h2');
      expect(h2.textContent).toContain('Pourquoi maintenant ?');
      const projected = root.querySelector('p');
      expect(projected.textContent).toContain('Contenu projeté.');
    });

    it("respecte l'ordre DOM: media (image) avant contenu", () => {
      const fixture = TestBed.createComponent(HostLeftComponent);
      fixture.detectChanges();
      const children = fixture.nativeElement.querySelector('.slide-image').children;
      expect(children[0].classList).toContain('slide-image__media');
      expect(children[1].classList).toContain('slide-image__content');
    });

    it('rend chaque paragraph en <p> separe', () => {
      const fixture = TestBed.createComponent(HostLeftFullComponent);
      fixture.detectChanges();
      const paragraphs = fixture.nativeElement.querySelectorAll('p.slide-image__paragraph');
      expect(paragraphs.length).toBe(2);
      expect(paragraphs[0].textContent).toContain('Premier paragraphe');
      expect(paragraphs[1].textContent).toContain('Second paragraphe');
    });

    it('rend chaque item en <li>', () => {
      const fixture = TestBed.createComponent(HostLeftFullComponent);
      fixture.detectChanges();
      const ul = fixture.nativeElement.querySelector('ul.slide-image__items');
      expect(ul).toBeTruthy();
      const items = ul.querySelectorAll('li');
      expect(items.length).toBe(3);
      expect(items[0].textContent).toContain('Item un');
      expect(items[2].textContent).toContain('Item trois');
    });

    it('rend titre + paragraphs + items + ng-content combines', () => {
      const fixture = TestBed.createComponent(HostLeftFullComponent);
      fixture.detectChanges();
      const root = fixture.nativeElement.querySelector('.slide-image');
      expect(root.querySelector('h2')).toBeTruthy();
      expect(root.querySelectorAll('p.slide-image__paragraph').length).toBe(2);
      expect(root.querySelectorAll('.slide-image__items li').length).toBe(3);
      expect(root.querySelector('.extra')).toBeTruthy();
    });
  });

  describe('position right (app-slide-image-right)', () => {
    it('rend contenu gauche + image droite (ordre DOM inverse)', () => {
      const fixture = TestBed.createComponent(HostRightComponent);
      fixture.detectChanges();
      const children = fixture.nativeElement.querySelector('.slide-image').children;
      expect(children[0].classList).toContain('slide-image__content');
      expect(children[1].classList).toContain('slide-image__media');
    });

    it('affiche titre et image avec attributs corrects + projection', () => {
      const fixture = TestBed.createComponent(HostRightComponent);
      fixture.detectChanges();
      const root = fixture.nativeElement.querySelector('.slide-image');
      expect(root.querySelector('h2').textContent).toContain('Quels outils ?');
      const img = root.querySelector('img');
      expect(img.getAttribute('src')).toBe('/images/tools.webp');
      expect(img.getAttribute('alt')).toBe('Outils IA');
      expect(root.querySelector('p').textContent).toContain('Liste des outils.');
    });

    it('rend chaque paragraph en <p> separe', () => {
      const fixture = TestBed.createComponent(HostRightFullComponent);
      fixture.detectChanges();
      const paragraphs = fixture.nativeElement.querySelectorAll('p.slide-image__paragraph');
      expect(paragraphs.length).toBe(2);
      expect(paragraphs[0].textContent).toContain('Premier paragraphe');
      expect(paragraphs[1].textContent).toContain('Second paragraphe');
    });

    it('rend chaque item en <li>', () => {
      const fixture = TestBed.createComponent(HostRightFullComponent);
      fixture.detectChanges();
      const ul = fixture.nativeElement.querySelector('ul.slide-image__items');
      expect(ul).toBeTruthy();
      const items = ul.querySelectorAll('li');
      expect(items.length).toBe(3);
      expect(items[2].textContent).toContain('Item trois');
    });

    it('rend titre + paragraphs + items + ng-content combines', () => {
      const fixture = TestBed.createComponent(HostRightFullComponent);
      fixture.detectChanges();
      const root = fixture.nativeElement.querySelector('.slide-image');
      expect(root.querySelector('h2')).toBeTruthy();
      expect(root.querySelectorAll('p.slide-image__paragraph').length).toBe(2);
      expect(root.querySelectorAll('.slide-image__items li').length).toBe(3);
      expect(root.querySelector('.extra')).toBeTruthy();
    });
  });
});
