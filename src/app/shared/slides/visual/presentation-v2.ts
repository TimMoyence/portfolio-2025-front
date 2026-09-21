import type { EcranContent } from '../../../../cours/content/types';

export type Donnees = Readonly<Record<string, unknown>>;

interface PresentationV2 {
  readonly version: 2;
  readonly screenId: string;
  readonly renderer: string;
  readonly props: Donnees;
}

export function objet(value: unknown): Donnees | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Donnees)
    : null;
}

export function aUnePresentation(slide: EcranContent): boolean {
  return Object.values(slide.donnees ?? {}).some(
    (value) => objet(objet(value)?.['presentation'])?.['version'] === 2,
  );
}

export function presentationDe(slide: EcranContent): PresentationV2 | null {
  for (const value of Object.values(slide.donnees ?? {})) {
    const presentation = objet(objet(value)?.['presentation']);
    if (
      presentation?.['version'] === 2 &&
      typeof presentation['screenId'] === 'string' &&
      typeof presentation['renderer'] === 'string' &&
      objet(presentation['props']) !== null
    ) {
      return presentation as unknown as PresentationV2;
    }
  }
  return null;
}

export function quizPrincipal(presentation: PresentationV2 | null): Donnees | null {
  return presentation?.renderer === 'quiz' ? objet(presentation.props['questionData']) : null;
}

export function quizImbrique(presentation: PresentationV2 | null): Donnees | null {
  return objet(presentation?.props['nestedQuiz']);
}
