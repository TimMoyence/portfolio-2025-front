import type { CoursContent, FreeRange, PacingMode, Role } from '../../content/types';

export interface DeckOptions {
  role?: Role;
}

export interface DeckState {
  ecranCourant: number;
  modeRythme: PacingMode;
  intervalleLibre: FreeRange | null;
}

export type DeckListener = (etat: DeckState) => void;

export interface Deck {
  current(): number;
  goTo(index: number): boolean;
  next(): boolean;
  previous(): boolean;
  setPacing(mode: PacingMode, intervalle: FreeRange | null): void;
  applyRemote(index: number): void;
  canNavigate(index: number): boolean;
  subscribe(listener: DeckListener): () => void;
}

export function createDeck(cours: CoursContent, options: DeckOptions = {}): Deck {
  const role: Role = options.role ?? 'presentateur';
  const ecoutes = new Set<DeckListener>();

  let etat: DeckState = { ecranCourant: 0, modeRythme: 'pilote', intervalleLibre: null };

  const notifier = (): void => {
    for (const ecoute of ecoutes) {
      ecoute({ ...etat });
    }
  };

  const dansLesBornes = (index: number): boolean =>
    Number.isInteger(index) && index >= 0 && index < cours.ecrans.length;

  const canNavigate = (index: number): boolean => {
    if (!dansLesBornes(index)) {
      return false;
    }
    if (role !== 'etudiant') {
      return true;
    }
    if (etat.modeRythme === 'pilote') {
      return index === etat.ecranCourant;
    }
    const intervalle = etat.intervalleLibre;
    return intervalle === null || (index >= intervalle.premier && index <= intervalle.dernier);
  };

  const goTo = (index: number): boolean => {
    if (!canNavigate(index) || index === etat.ecranCourant) {
      return false;
    }
    etat = { ...etat, ecranCourant: index };
    notifier();
    return true;
  };

  return {
    current: () => etat.ecranCourant,
    goTo,
    next: () => goTo(etat.ecranCourant + 1),
    previous: () => goTo(etat.ecranCourant - 1),
    canNavigate,
    setPacing(mode, intervalle) {
      etat = {
        ...etat,
        modeRythme: mode,
        intervalleLibre: mode === 'libre' ? intervalle : null,
      };
      notifier();
    },
    applyRemote(index) {
      if (!dansLesBornes(index) || index === etat.ecranCourant) {
        return;
      }
      etat = { ...etat, ecranCourant: index };
      notifier();
    },
    subscribe(listener) {
      ecoutes.add(listener);
      return () => {
        ecoutes.delete(listener);
      };
    },
  };
}
