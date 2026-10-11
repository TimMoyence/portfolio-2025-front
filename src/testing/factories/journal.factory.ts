export type JournalEspion = jasmine.SpyObj<Pick<Console, 'warn'>>;

export function createJournalSpy(): JournalEspion {
  return jasmine.createSpyObj<Pick<Console, 'warn'>>('journal', ['warn']);
}
