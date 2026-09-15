export const cardsort = `
:where(.fp-root) .fp-cardsort__atelier {
  display: grid;
  justify-items: stretch;
  gap: var(--fp-s-3);
  min-width: 0;
}

:where(.fp-root) .fp-cardsort__intitule {
  margin: 0;
}

:where(.fp-root) .fp-cardsort__consigne {
  padding: var(--fp-s-2) var(--fp-s-3);
  border-left: var(--fp-s-1) solid var(--fp-teal-deep);
  border-radius: var(--fp-r-sm);
  background: var(--fp-confirme-fond);
  color: var(--fp-confirme);
}

:where(.fp-root) .fp-cardsort__zones {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: var(--fp-s-3);
  align-items: start;
}

:where(.fp-root) .fp-cardsort__zone {
  display: grid;
  gap: var(--fp-s-2);
  padding: var(--fp-s-3);
  border: 1px dashed var(--fp-bordure);
  border-radius: var(--fp-r);
  background: var(--fp-ivory);
}

:where(.fp-root) .fp-cardsort__titre {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
  align-items: baseline;
  justify-content: space-between;
  color: var(--fp-teal-ink);
  font-family: var(--fp-font-sans);
  font-size: calc(0.85rem * var(--fp-echelle));
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

:where(.fp-root) .fp-cardsort__compte {
  color: var(--fp-ink-mute);
  font-weight: 400;
}

:where(.fp-root) .fp-cardsort__pile {
  display: grid;
  gap: var(--fp-s-2);
  min-height: calc(3rem * var(--fp-echelle));
  margin: 0;
  padding: 0;
  list-style: none;
}

:where(.fp-root) .fp-cardsort__place {
  display: block;
}

:where(.fp-root) .fp-cardsort__carte {
  display: block;
  width: 100%;
  padding: var(--fp-s-2) var(--fp-s-3);
  text-align: left;
  cursor: grab;
}

:where(.fp-root) .fp-cardsort__carte[aria-pressed='true'] {
  border-color: var(--fp-teal-deep);
  box-shadow: 0 0 0 2px var(--fp-teal-deep);
}

:where(.fp-root) .fp-cardsort__carte:focus-visible {
  outline: 2px solid var(--fp-teal);
  outline-offset: 2px;
}

:where(.fp-root) .fp-cardsort__carte:disabled {
  background: var(--fp-en-attente-fond);
  color: var(--fp-en-attente);
  cursor: not-allowed;
}

:where(.fp-root) .fp-cardsort__vide {
  padding: var(--fp-s-2) var(--fp-s-3);
  border: 1px dashed var(--fp-bordure);
  border-radius: var(--fp-r-sm);
  color: var(--fp-en-attente);
}

:where(.fp-root) .fp-cardsort__pilote {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
  align-items: center;
}

:where(.fp-root) .fp-cardsort__etiquette {
  color: var(--fp-ink-mute);
  font-weight: 600;
}

:where(.fp-root) .fp-cardsort__cible {
  padding: var(--fp-s-1) var(--fp-s-2);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r-sm);
  background: var(--fp-surface);
  color: var(--fp-texte-fort);
  font-size: var(--fp-corps);
}

:where(.fp-root) .fp-cardsort__deplacer {
  padding: var(--fp-s-1) var(--fp-s-3);
  border: 1px solid var(--fp-teal-deep);
  border-radius: var(--fp-r-pill);
  background: var(--fp-surface);
  color: var(--fp-teal-ink);
  font-weight: 600;
  cursor: pointer;
}

:where(.fp-root) .fp-cardsort__valider {
  justify-self: start;
  padding: var(--fp-s-2) var(--fp-s-4);
  border: 1px solid var(--fp-teal-deep);
  border-radius: var(--fp-r-pill);
  background: var(--fp-teal-deep);
  color: var(--fp-cream);
  font-weight: 600;
  cursor: pointer;
}

:where(.fp-root) .fp-cardsort__valider:disabled {
  border-color: var(--fp-bordure);
  background: var(--fp-en-attente-fond);
  color: var(--fp-en-attente);
  cursor: not-allowed;
}

:where(.fp-root) .fp-cardsort__annonce {
  min-height: calc(1.5rem * var(--fp-echelle));
  color: var(--fp-texte-fort);
}

:where(.fp-root) .fp-cardsort__progression {
  color: var(--fp-ink-mute);
  font-family: var(--fp-font-mono);
  letter-spacing: 0.02em;
}

:where(.fp-root) .fp-cardsort__reperes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
}
`;
