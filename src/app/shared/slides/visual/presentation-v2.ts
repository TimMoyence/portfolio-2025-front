import type { PresentationServie } from '../../../../../contrat';
import { zPresentationServie } from '../../../../../contrat/zod.gen';
import type { EcranContent } from '../../../../cours/content/types';
import { chaineDe, objet } from '../../../../cours/runtime/core/texte/valeurs';

export type Donnees = Readonly<Record<string, unknown>>;

export type RenduServi = PresentationServie['renderer'];

interface PresentationLue {
  readonly version: 2;
  readonly screenId: string;
  readonly renderer: RenduServi;
  readonly props: Donnees;
}

const RENDUS_SERVIS: ReadonlySet<unknown> = new Set(
  zPresentationServie.options.flatMap((option) => option.shape.renderer.options),
);

export const RENDUS_DE_REVELATION: ReadonlySet<string> = new Set(['sort-review']);

export function ecranSourceDe(source: Donnees | null): string | null {
  return chaineDe(source, 'screenId');
}

export function aUnePresentation(slide: EcranContent): boolean {
  return Object.values(slide.donnees ?? {}).some(
    (value) => objet(objet(value)?.['presentation'])?.['version'] === 2,
  );
}

function estServi(renderer: unknown): renderer is RenduServi {
  return RENDUS_SERVIS.has(renderer);
}

export function presentationDe(slide: EcranContent): PresentationLue | null {
  for (const value of Object.values(slide.donnees ?? {})) {
    const presentation = objet(objet(value)?.['presentation']);
    const screenId = presentation?.['screenId'];
    const renderer = presentation?.['renderer'];
    const props = objet(presentation?.['props']);
    if (
      presentation?.['version'] === 2 &&
      typeof screenId === 'string' &&
      estServi(renderer) &&
      props !== null
    ) {
      return { version: 2, screenId, renderer, props };
    }
  }
  return null;
}
