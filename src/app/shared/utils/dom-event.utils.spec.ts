import { readInputValue, readCheckboxChecked } from './dom-event.utils';

function eventWithTarget(target: EventTarget | null): Event {
  return { target } as unknown as Event;
}

describe('readInputValue', () => {
  it("devrait lire la valeur d'un HTMLInputElement", () => {
    const input = document.createElement('input');
    input.value = 'abc';
    expect(readInputValue(eventWithTarget(input))).toBe('abc');
  });

  it("devrait retourner la value par defaut d'une checkbox cochee", () => {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = true;
    // value par defaut d'une checkbox = "on"
    expect(readInputValue(eventWithTarget(input))).toBe('on');
  });

  it("devrait lire la valeur d'un HTMLTextAreaElement (superset)", () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'xyz';
    expect(readInputValue(eventWithTarget(textarea))).toBe('xyz');
  });

  it('devrait retourner une chaine vide pour un HTMLSelectElement (hors scope)', () => {
    const select = document.createElement('select');
    expect(readInputValue(eventWithTarget(select))).toBe('');
  });

  it('devrait retourner une chaine vide quand target est null', () => {
    expect(readInputValue(eventWithTarget(null))).toBe('');
  });

  it('devrait retourner une chaine vide pour un element non-form (div)', () => {
    const div = document.createElement('div');
    expect(readInputValue(eventWithTarget(div))).toBe('');
  });

  it('devrait retourner une chaine vide (pas undefined) pour une cible non couverte', () => {
    const result = readInputValue(eventWithTarget(null));
    expect(result).toBe('');
    expect(typeof result).toBe('string');
  });
});

describe('readCheckboxChecked', () => {
  it("devrait lire l'etat coche d'un HTMLInputElement checkbox (true)", () => {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = true;
    expect(readCheckboxChecked(eventWithTarget(input))).toBe(true);
  });

  it("devrait lire l'etat coche d'un HTMLInputElement checkbox (false)", () => {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = false;
    expect(readCheckboxChecked(eventWithTarget(input))).toBe(false);
  });

  it('devrait retourner false pour un HTMLTextAreaElement (pas un input)', () => {
    const textarea = document.createElement('textarea');
    expect(readCheckboxChecked(eventWithTarget(textarea))).toBe(false);
  });

  it('devrait retourner false pour un HTMLSelectElement', () => {
    const select = document.createElement('select');
    expect(readCheckboxChecked(eventWithTarget(select))).toBe(false);
  });

  it('devrait retourner false quand target est null', () => {
    expect(readCheckboxChecked(eventWithTarget(null))).toBe(false);
  });

  it('devrait retourner false pour un element non-form (div)', () => {
    const div = document.createElement('div');
    expect(readCheckboxChecked(eventWithTarget(div))).toBe(false);
  });
});
