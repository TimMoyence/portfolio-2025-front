export const pulse = `
:where(.fp-root) .fp-pulse__panneau {
  display: grid;
  justify-items: stretch;
  gap: var(--fp-s-3);
}

:where(.fp-root) .fp-pulse__panneau > legend {
  padding-bottom: var(--fp-s-2);
  color: var(--fp-texte-fort);
  font-size: calc(1.25rem * var(--fp-echelle));
  line-height: 1.3;
}

:where(.fp-root) .fp-pulse__anonymat {
  color: var(--fp-ink-mute);
  font-size: calc(0.9rem * var(--fp-echelle));
  font-style: italic;
}

:where(.fp-root) .fp-pulse__choix {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
  gap: var(--fp-s-2);
}

:where(.fp-root) .fp-pulse__etat {
  display: grid;
  justify-items: center;
  gap: var(--fp-s-1);
  padding: var(--fp-s-3);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r);
  background: var(--fp-surface);
  cursor: pointer;
}

:where(.fp-root) .fp-pulse__etat[aria-pressed='true'] {
  border-width: 3px;
  border-color: var(--fp-teal-deep);
  font-weight: 700;
}

:where(.fp-root) .fp-pulse__etat:focus-visible {
  outline: 2px solid var(--fp-teal);
  outline-offset: 2px;
}

:where(.fp-root) .fp-pulse__forme {
  font-size: calc(1.6rem * var(--fp-echelle));
  line-height: 1;
}

:where(.fp-root) .fp-pulse__libelle {
  font-size: var(--fp-corps);
}

:where(.fp-root) .fp-pulse__retour {
  min-height: calc(1.5rem * var(--fp-echelle));
  color: var(--fp-texte-fort);
  font-weight: 600;
}

:where(.fp-root) .fp-pulse__agregat {
  display: grid;
  gap: var(--fp-s-2);
  list-style: none;
}

:where(.fp-root) .fp-pulse__ligne {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--fp-s-2);
  padding: var(--fp-s-2) var(--fp-s-3);
  border-radius: var(--fp-r);
  background: var(--fp-ivory);
}

:where(.fp-root) .fp-pulse__compte {
  font-family: var(--fp-font-mono);
  font-size: calc(1.3rem * var(--fp-echelle));
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

:where(.fp-root) .fp-pulse__total {
  justify-self: end;
  color: var(--fp-ink-mute);
  font-variant-numeric: tabular-nums;
}
`;
