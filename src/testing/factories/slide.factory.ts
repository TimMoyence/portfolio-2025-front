import type {
  Act,
  PresentationSlide,
  Slide,
} from "../../app/shared/models/slide.model";

/**
 * Construit un objet Act avec des valeurs par defaut.
 * Accepte des surcharges partielles pour les cas de test specifiques.
 */
export function buildAct(overrides?: Partial<Act>): Act {
  return {
    id: "act-1",
    label: "Introduction",
    ...overrides,
  };
}

/**
 * Construit un objet Slide avec des valeurs par defaut (layout split).
 * Accepte des surcharges partielles pour les cas de test specifiques.
 */
export function buildSlide(overrides?: Partial<Slide>): Slide {
  return {
    id: "slide-1",
    title: "Titre de la slide",
    subtitle: "Sous-titre explicatif",
    bullets: ["Point cle numero un", "Point cle numero deux"],
    layout: "split",
    ...overrides,
  };
}

/**
 * Construit un objet PresentationSlide avec acte et fragmentCount.
 * Accepte des surcharges partielles pour les cas de test specifiques.
 */
export function buildPresentationSlide(
  overrides?: Partial<PresentationSlide>,
): PresentationSlide {
  return {
    id: "pslide-1",
    title: "Slide de presentation",
    subtitle: "Sous-titre de presentation",
    bullets: ["Fragment un", "Fragment deux"],
    layout: "split",
    act: buildAct(),
    fragmentCount: 2,
    ...overrides,
  };
}

/**
 * Construit un deck realiste de 8 PresentationSlides reparties en 3 actes.
 *
 * Repartition :
 * - `act-intro` : 2 slides (hero, split)
 * - `act-main`  : 4 slides (stats, comparison, demo, quote)
 * - `act-conclusion` : 2 slides (cta, split)
 *
 * Couvre l'ensemble des 8 layouts supportes par le `SlideRendererComponent`
 * afin que les tests d'integration puissent verifier chaque template.
 */
export function buildPresentationDeck(): PresentationSlide[] {
  const actIntro = buildAct({ id: "act-intro", label: "Introduction" });
  const actMain = buildAct({ id: "act-main", label: "Contenu principal" });
  const actConclusion = buildAct({
    id: "act-conclusion",
    label: "Conclusion",
  });

  return [
    buildPresentationSlide({
      id: "deck-1",
      title: "Bienvenue",
      subtitle: "Presentation du sujet",
      layout: "hero",
      act: actIntro,
      fragmentCount: 0,
    }),
    buildPresentationSlide({
      id: "deck-2",
      title: "Contexte",
      subtitle: "Pourquoi ce sujet est important",
      bullets: ["Tendance du marche", "Besoin identifie"],
      layout: "split",
      act: actIntro,
      fragmentCount: 2,
    }),
    buildPresentationSlide({
      id: "deck-3",
      title: "Chiffres cles",
      layout: "stats",
      stats: [
        { value: "42%", label: "Croissance annuelle" },
        { value: "1.2M", label: "Utilisateurs actifs" },
      ],
      act: actMain,
      fragmentCount: 2,
    }),
    buildPresentationSlide({
      id: "deck-4",
      title: "Comparatif",
      subtitle: "Avant / apres",
      layout: "comparison",
      table: {
        headers: ["Critere", "Avant", "Apres"],
        rows: [
          ["Vitesse", "2s", "200ms"],
          ["Taille", "500KB", "80KB"],
        ],
      },
      act: actMain,
      fragmentCount: 0,
    }),
    buildPresentationSlide({
      id: "deck-5",
      title: "Demo interactive",
      subtitle: "Generez votre prompt",
      layout: "demo",
      promptTemplate: {
        label: "Votre secteur",
        placeholder: "ex: Coach sportif",
        template: "Secteur : {{sector}}",
      },
      act: actMain,
      fragmentCount: 0,
    }),
    buildPresentationSlide({
      id: "deck-6",
      title: "Citation",
      quote: "La simplicite est la sophistication supreme.",
      quoteAuthor: "Leonard de Vinci",
      layout: "quote",
      act: actMain,
      fragmentCount: 0,
    }),
    buildPresentationSlide({
      id: "deck-7",
      title: "Prochaines etapes",
      subtitle: "Appel a l'action",
      bullets: ["Rejoindre le projet", "Tester la demo"],
      layout: "cta",
      act: actConclusion,
      fragmentCount: 2,
    }),
    buildPresentationSlide({
      id: "deck-8",
      title: "Merci",
      subtitle: "Questions & reponses",
      bullets: ["Discussion", "Contact"],
      layout: "split",
      act: actConclusion,
      fragmentCount: 0,
    }),
    buildPresentationSlide({
      id: "deck-9",
      title: "Transition (present only)",
      subtitle: "Visible uniquement en mode présentation",
      layout: "hero",
      act: actConclusion,
      fragmentCount: 0,
      visibility: "presentOnly",
    }),
    buildPresentationSlide({
      id: "deck-10",
      title: "Bibliographie (scroll only)",
      subtitle: "Visible uniquement en mode scroll",
      layout: "split",
      act: actConclusion,
      fragmentCount: 0,
      visibility: "scrollOnly",
      sources: [{ label: "Source de test", url: "https://example.com" }],
      authorNote: "Note editoriale de test.",
    }),
  ];
}
