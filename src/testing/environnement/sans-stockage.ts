export function sansStockageLocal<T>(action: () => T): T {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { value: undefined, configurable: true });
  try {
    return action();
  } finally {
    if (original) {
      Object.defineProperty(globalThis, 'localStorage', original);
    } else {
      delete (globalThis as { localStorage?: Storage }).localStorage;
    }
  }
}

export function saturationDuStockage(): Error {
  const saturation = new Error('quota de stockage depasse');
  saturation.name = 'QuotaExceededError';
  return saturation;
}
