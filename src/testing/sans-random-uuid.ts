export const MOTIF_UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function sansRandomUuid<T>(action: () => T): T {
  Object.defineProperty(globalThis.crypto, 'randomUUID', { value: undefined, configurable: true });
  try {
    return action();
  } finally {
    Reflect.deleteProperty(globalThis.crypto, 'randomUUID');
  }
}
