export const sheet = `
:where(.fp-root) .fp-sheet__atelier {
  display: grid;
  justify-items: stretch;
  gap: var(--fp-s-3);
  min-width: 0;
}

:where(.fp-root) .fp-sheet__consigne {
  padding: var(--fp-s-2) var(--fp-s-3);
  border-left: var(--fp-s-1) solid var(--fp-teal-deep);
  border-radius: var(--fp-r-sm);
  background: var(--fp-confirme-fond);
  color: var(--fp-confirme);
}

:where(.fp-root) .fp-sheet__barre {
  display: flex;
  align-items: center;
  gap: var(--fp-s-2);
  min-width: 0;
}

:where(.fp-root) .fp-sheet__reference {
  min-width: calc(3.5rem * var(--fp-echelle));
  padding: var(--fp-s-1) var(--fp-s-2);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r-sm);
  background: var(--fp-sand);
  color: var(--fp-teal-ink);
  font-family: var(--fp-font-mono);
  font-weight: 700;
  text-align: center;
}

:where(.fp-root) .fp-sheet__saisie {
  flex: 1 1 auto;
  min-width: 0;
  padding: var(--fp-s-1) var(--fp-s-2);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r-sm);
  background: var(--fp-surface);
  color: var(--fp-texte-fort);
  font-family: var(--fp-font-mono);
  font-size: var(--fp-corps);
}

:where(.fp-root) .fp-sheet__tableau {
  display: block;
  overflow-x: auto;
  border-collapse: collapse;
  width: 100%;
}

:where(.fp-root) .fp-sheet__intitule {
  padding-bottom: var(--fp-s-2);
  color: var(--fp-teal-ink);
  font-family: var(--fp-font-sans);
  font-size: calc(0.85rem * var(--fp-echelle));
  font-weight: 700;
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
}

:where(.fp-root) .fp-sheet__entete {
  padding: var(--fp-s-1) var(--fp-s-2);
  border: 1px solid var(--fp-bordure);
  background: var(--fp-sand);
  color: var(--fp-texte-fort);
  font-family: var(--fp-font-mono);
  font-weight: 700;
  text-align: center;
}

:where(.fp-root) .fp-sheet__coin {
  color: var(--fp-ink-mute);
  font-size: calc(0.75rem * var(--fp-echelle));
  font-weight: 400;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

:where(.fp-root) .fp-sheet__rang {
  padding: var(--fp-s-1) var(--fp-s-2);
  border: 1px solid var(--fp-bordure);
  background: var(--fp-sand);
  color: var(--fp-texte-fort);
  font-family: var(--fp-font-mono);
  font-weight: 700;
  text-align: center;
}

:where(.fp-root) .fp-sheet__ligne:nth-child(even) .fp-sheet__cellule {
  background: var(--fp-en-attente-fond);
}

:where(.fp-root) .fp-sheet__cellule {
  padding: 0;
  border: 1px solid var(--fp-bordure);
}

:where(.fp-root) .fp-sheet__champ {
  width: 100%;
  min-width: calc(6rem * var(--fp-echelle));
  padding: var(--fp-s-1) var(--fp-s-2);
  border: none;
  background: transparent;
  color: var(--fp-texte-fort);
  font-family: var(--fp-font-mono);
  font-size: var(--fp-corps);
  text-align: right;
}

:where(.fp-root) .fp-sheet__champ:focus-visible {
  outline: 2px solid var(--fp-teal);
  outline-offset: -2px;
}

:where(.fp-root) .fp-sheet__champ[readonly] {
  color: var(--fp-ink-mute);
  font-weight: 600;
}

:where(.fp-root) .fp-sheet__champ[aria-invalid='true'] {
  background: repeating-linear-gradient(
    135deg,
    transparent,
    transparent 5px,
    var(--fp-a-revoir-fond) 5px,
    var(--fp-a-revoir-fond) 10px
  );
  color: var(--fp-erreur);
  font-weight: 700;
  text-decoration: underline wavy var(--fp-erreur);
}

:where(.fp-root) .fp-sheet__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
}

:where(.fp-root) .fp-sheet__recopier {
  padding: var(--fp-s-2) var(--fp-s-4);
  border: 1px solid var(--fp-teal-deep);
  border-radius: var(--fp-r-pill);
  background: transparent;
  color: var(--fp-teal-ink);
  font-weight: 600;
  cursor: pointer;
}

:where(.fp-root) .fp-sheet__valider {
  padding: var(--fp-s-2) var(--fp-s-4);
  border: 1px solid var(--fp-teal-deep);
  border-radius: var(--fp-r-pill);
  background: var(--fp-teal-deep);
  color: var(--fp-cream);
  font-weight: 600;
  cursor: pointer;
}

:where(.fp-root) .fp-sheet__valider:disabled,
:where(.fp-root) .fp-sheet__recopier:disabled {
  border-color: var(--fp-bordure);
  background: var(--fp-en-attente-fond);
  color: var(--fp-en-attente);
  cursor: not-allowed;
}

:where(.fp-root) .fp-sheet__bilan {
  min-height: calc(1.5rem * var(--fp-echelle));
  color: var(--fp-texte);
  overflow-wrap: anywhere;
}

:where(.fp-root) .fp-sheet__bilan--fautif {
  color: var(--fp-erreur);
  font-weight: 600;
}

:where(.fp-root) .fp-sheet__retour {
  min-height: calc(1.5rem * var(--fp-echelle));
  color: var(--fp-texte-fort);
}

:where(.fp-root) .fp-sheet__vide {
  padding: var(--fp-s-2) var(--fp-s-3);
  border: 1px dashed var(--fp-bordure);
  border-radius: var(--fp-r-sm);
  color: var(--fp-en-attente);
}

:where(.fp-root) .fp-sheet__progression {
  color: var(--fp-ink-mute);
  font-family: var(--fp-font-mono);
  letter-spacing: 0.02em;
}

:where(.fp-root) .fp-sheet__reperes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
}

:where(.fp-root) .fp-sheet__consignes,
:where(.fp-root) .fp-sheet__attendus {
  display: grid;
  gap: var(--fp-s-1);
  margin: 0;
  padding-left: var(--fp-s-3);
}

:where(.fp-root) .fp-sheet__attendu {
  color: var(--fp-texte-fort);
  font-variant-numeric: tabular-nums;
}
`;
