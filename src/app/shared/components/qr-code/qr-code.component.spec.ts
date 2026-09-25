import { pageMontee } from '../../../../testing/montage-page';
import { QrCodeComponent } from './qr-code.component';

describe('QrCodeComponent', () => {
  const qr = pageMontee(QrCodeComponent, {
    avantRendu: (fixture) => fixture.componentRef.setInput('data', 'https://asilidesign.fr/test'),
  });

  it('should create', () => {
    expect(qr.composant).toBeTruthy();
  });

  it('should render a container div', () => {
    expect(qr.racine.querySelector('[data-qr-container]')).toBeTruthy();
  });

  it('should accept custom size input', () => {
    qr.fixture.componentRef.setInput('size', 300);
    qr.fixture.detectChanges();
    expect(qr.composant.size()).toBe(300);
  });

  it('should accept custom color input', () => {
    qr.fixture.componentRef.setInput('color', '#ff0000');
    qr.fixture.detectChanges();
    expect(qr.composant.color()).toBe('#ff0000');
  });
});
