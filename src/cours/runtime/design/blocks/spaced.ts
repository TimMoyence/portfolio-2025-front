export const spaced = `
:where(.fp-root) .fp-spaced__seance {
  display: grid;
  justify-items: stretch;
  gap: var(--fp-s-3);
  min-width: 0;
}

:where(.fp-root) .fp-spaced__consigne {
  padding: var(--fp-s-2) var(--fp-s-3);
  border-left: var(--fp-s-1) solid var(--fp-teal-deep);
  border-radius: var(--fp-r-sm);
  background: var(--fp-confirme-fond);
  color: var(--fp-confirme);
}

:where(.fp-root) .fp-spaced__attente {
  color: var(--fp-ink-mute);
}

:where(.fp-root) .fp-spaced__progression {
  justify-self: start;
  padding: var(--fp-s-1) var(--fp-s-3);
  border-radius: var(--fp-r-pill);
  background: var(--fp-en-cours-fond);
  color: var(--fp-en-cours);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

:where(.fp-root) .fp-spaced__reperes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
  align-items: center;
}

:where(.fp-root) .fp-spaced__origine {
  display: inline-flex;
  gap: 0.35em;
  background: var(--fp-sand);
  color: var(--fp-texte-fort);
}

:where(.fp-root) .fp-spaced__concept {
  color: var(--fp-ink-mute);
  font-size: calc(0.9rem * var(--fp-echelle));
  letter-spacing: 0.02em;
}

:where(.fp-root) .fp-spaced__enonce {
  margin: 0;
}

:where(.fp-root) .fp-spaced__options {
  display: grid;
  gap: var(--fp-s-2);
}

:where(.fp-root) .fp-spaced__option {
  padding: var(--fp-s-3) var(--fp-s-4);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r);
  background: var(--fp-surface);
  font-size: var(--fp-corps);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s var(--fp-ease);
}

:where(.fp-root) .fp-spaced__option:hover {
  border-color: var(--fp-teal-deep);
}

:where(.fp-root) .fp-spaced__option:focus-visible {
  outline: 2px solid var(--fp-teal);
  outline-offset: 2px;
}

:where(.fp-root) .fp-spaced__annonce {
  color: var(--fp-ink-mute);
  min-height: 1.5em;
}

:where(.fp-root) .fp-spaced__panne {
  border-left-color: var(--fp-a-revoir);
  background: var(--fp-a-revoir-fond);
  color: var(--fp-a-revoir);
}

:where(.fp-root) .fp-spaced__vide {
  padding: var(--fp-s-3);
  border-radius: var(--fp-r);
  background: var(--fp-ivory);
  color: var(--fp-texte-fort);
}

:where(.fp-root) .fp-spaced__termine {
  padding: var(--fp-s-3);
  border-radius: var(--fp-r);
  background: var(--fp-confirme-fond);
  color: var(--fp-confirme);
  font-weight: 600;
}

:where(.fp-root) .fp-spaced__liste {
  display: grid;
  gap: var(--fp-s-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

:where(.fp-root) .fp-spaced__ligne {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
  align-items: baseline;
  padding: var(--fp-s-2) var(--fp-s-3);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r);
  background: var(--fp-surface);
}

:where(.fp-root) .fp-spaced__nom {
  color: var(--fp-texte-fort);
  font-weight: 600;
}

:where(.fp-root) .fp-spaced__diagnostics {
  display: grid;
  gap: var(--fp-s-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

:where(.fp-root) .fp-spaced__diagnostic {
  color: var(--fp-ink-mute);
  font-size: calc(0.9rem * var(--fp-echelle));
}

:where(.fp-root) .fp-spaced__mention {
  color: var(--fp-ink-mute);
  font-weight: 600;
}

:where(.fp-root) .fp-spaced__intitule {
  margin: 0;
  font-family: var(--fp-font-display);
  font-size: calc(1.4rem * var(--fp-echelle));
  color: var(--fp-ink);
}

:where(.fp-root) .fp-spaced__maitrise {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

:where(.fp-root) .fp-spaced__maitrise th,
:where(.fp-root) .fp-spaced__maitrise td {
  padding: var(--fp-s-1) var(--fp-s-2);
  border-bottom: 1px solid var(--fp-line);
  text-align: start;
}
`;
