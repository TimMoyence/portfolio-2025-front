import { texteDe } from '../texte/textes-dom';
export type RoleDAnnonce = 'status' | 'alert';

export function annonces(racine: Element, role: RoleDAnnonce): readonly string[] {
  return [...racine.querySelectorAll(`[role="${role}"]`)].map(texteDe);
}
