import { TestBed } from '@angular/core/testing';
import { B2TraitementInformationChiffreeComponent } from './b2-01-traitement-information-chiffree.component';

describe('B2TraitementInformationChiffreeComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [B2TraitementInformationChiffreeComponent] });
  });

  it('compose les 66 diapositives du storyboard et 6 annexes métier dans le deck partagé', () => {
    const fixture = TestBed.createComponent(B2TraitementInformationChiffreeComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-slide-deck')).not.toBeNull();
    expect(element.querySelectorAll('section.slide')).toHaveSize(72);
    expect(element.querySelector('app-slide-hero')).not.toBeNull();
    expect(element.querySelector('app-slide-chart')).not.toBeNull();
    expect(element.querySelector('app-slide-guide')).not.toBeNull();
    expect(element.querySelector('app-slide-quiz')).not.toBeNull();
    expect(element.querySelectorAll('.slide-quiz__competency')).toHaveSize(0);
    expect(element.querySelectorAll('.slide-reflection__competency')).toHaveSize(0);
  });

  it('garde la photo dans le code sans afficher de crédit visible', () => {
    const fixture = TestBed.createComponent(B2TraitementInformationChiffreeComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.b2-source')).toBeNull();
    expect(element.querySelector<HTMLImageElement>('app-slide-hero img')?.src).toContain(
      'pexels.com',
    );
  });
});
