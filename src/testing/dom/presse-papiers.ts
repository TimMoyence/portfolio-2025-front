export function poserLePressePapiers(writeText: jasmine.Spy | null): void {
  Object.defineProperty(navigator, 'clipboard', {
    value: writeText === null ? undefined : { writeText },
    configurable: true,
  });
}

export function rendreLePressePapiers(): void {
  Reflect.deleteProperty(navigator, 'clipboard');
}
