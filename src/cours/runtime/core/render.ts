import type { RenderMode, Role } from '../../content/types';

const LARGEUR_SCENE_MIN = 1280;

export function resolveRenderMode(role: Role, largeur: number, force?: RenderMode): RenderMode {
  if (force) {
    return force;
  }
  if (role === 'presentateur') {
    return largeur >= LARGEUR_SCENE_MIN ? 'stage' : 'board';
  }
  return 'hand';
}
