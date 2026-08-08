import { weatherCodeToIcon } from './weather-icons';

describe('weatherCodeToIcon', () => {
  const base = '/assets/images/meteo/';

  it('devrait retourner soleil pour code 0 (jour)', () => {
    expect(weatherCodeToIcon(0)).toBe(base + 'soleil.png');
  });

  it('devrait retourner lune et etoiles pour code 0 (nuit)', () => {
    expect(weatherCodeToIcon(0, true)).toBe(base + 'lune-et-\u00e9toiles.png');
  });

  it('devrait retourner soleil-et-nuage pour code 1 (jour)', () => {
    expect(weatherCodeToIcon(1)).toBe(base + 'soleil-et-nuage.png');
  });

  it('devrait retourner nuit-partiellement-nuageuse pour code 1 (nuit)', () => {
    expect(weatherCodeToIcon(1, true)).toBe(base + 'nuit-partiellement-nuageuse.png');
  });

  it('devrait retourner soleil-et-nuage pour code 2', () => {
    expect(weatherCodeToIcon(2)).toBe(base + 'soleil-et-nuage.png');
  });

  it('devrait retourner nuage pour code 3', () => {
    expect(weatherCodeToIcon(3)).toBe(base + 'nuage.png');
  });

  it('devrait retourner brouillard-de-jour pour codes 45-48', () => {
    expect(weatherCodeToIcon(45)).toBe(base + 'brouillard-de-jour.png');
    expect(weatherCodeToIcon(48)).toBe(base + 'brouillard-de-jour.png');
  });

  it('devrait retourner partiellement-nuageux-avec-pluie pour codes 51-55', () => {
    expect(weatherCodeToIcon(51)).toBe(base + 'partiellement-nuageux-avec-pluie.png');
    expect(weatherCodeToIcon(55)).toBe(base + 'partiellement-nuageux-avec-pluie.png');
  });

  it('devrait retourner pluie pour codes 56-57 (bruine verglacante)', () => {
    expect(weatherCodeToIcon(56)).toBe(base + 'pluie.png');
    expect(weatherCodeToIcon(57)).toBe(base + 'pluie.png');
  });

  it('devrait retourner pluie pour codes 61-65', () => {
    expect(weatherCodeToIcon(61)).toBe(base + 'pluie.png');
    expect(weatherCodeToIcon(65)).toBe(base + 'pluie.png');
  });

  it('devrait retourner pluie-torrentielle pour codes 66-67', () => {
    expect(weatherCodeToIcon(66)).toBe(base + 'pluie-torrentielle.png');
    expect(weatherCodeToIcon(67)).toBe(base + 'pluie-torrentielle.png');
  });

  it('devrait retourner pluie pour codes neige 71-77', () => {
    expect(weatherCodeToIcon(71)).toBe(base + 'pluie.png');
    expect(weatherCodeToIcon(77)).toBe(base + 'pluie.png');
  });

  it('devrait retourner pluie-torrentielle pour codes averses 80-82', () => {
    expect(weatherCodeToIcon(80)).toBe(base + 'pluie-torrentielle.png');
    expect(weatherCodeToIcon(82)).toBe(base + 'pluie-torrentielle.png');
  });

  it('devrait retourner pluie-torrentielle pour codes averses neige 85-86', () => {
    expect(weatherCodeToIcon(85)).toBe(base + 'pluie-torrentielle.png');
    expect(weatherCodeToIcon(86)).toBe(base + 'pluie-torrentielle.png');
  });

  it('devrait retourner eclair-dans-un-nuage pour codes orage 95-99', () => {
    expect(weatherCodeToIcon(95)).toBe(base + '\u00e9clair-dans-un-nuage.png');
    expect(weatherCodeToIcon(99)).toBe(base + '\u00e9clair-dans-un-nuage.png');
  });

  it('devrait retourner nuage comme fallback pour code inconnu', () => {
    expect(weatherCodeToIcon(10)).toBe(base + 'nuage.png');
    expect(weatherCodeToIcon(44)).toBe(base + 'nuage.png');
  });
});
