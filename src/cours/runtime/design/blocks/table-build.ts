export const tableBuild = `
:where(.fp-root) .fp-table-build__atelier {
  display: grid;
  justify-items: stretch;
  gap: var(--fp-s-3);
  min-width: 0;
}

:where(.fp-root) .fp-table-build__consigne {
  padding: var(--fp-s-2) var(--fp-s-3);
  border-left: var(--fp-s-1) solid var(--fp-teal-deep);
  border-radius: var(--fp-r-sm);
  background: var(--fp-confirme-fond);
  color: var(--fp-confirme);
}

:where(.fp-root) .fp-table-build__tableau {
  display: block;
  overflow-x: auto;
  border-collapse: collapse;
  width: 100%;
}

:where(.fp-root) .fp-table-build__intitule {
  padding-bottom: var(--fp-s-2);
  color: var(--fp-teal-ink);
  font-family: var(--fp-font-sans);
  font-size: calc(0.85rem * var(--fp-echelle));
  font-weight: 700;
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
}

:where(.fp-root) .fp-table-build__entete {
  padding: var(--fp-s-1) var(--fp-s-2);
  border-bottom: 2px solid var(--fp-bordure);
  color: var(--fp-texte-fort);
  font-weight: 700;
  text-align: right;
  vertical-align: bottom;
}

:where(.fp-root) .fp-table-build__role {
  display: block;
  color: var(--fp-ink-mute);
  font-size: calc(0.75rem * var(--fp-echelle));
  font-weight: 400;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

:where(.fp-root) .fp-table-build__ligne:nth-child(even) {
  background: var(--fp-en-attente-fond);
}

:where(.fp-root) .fp-table-build__rang {
  padding: var(--fp-s-1) var(--fp-s-2);
  border-bottom: 1px solid var(--fp-bordure);
  color: var(--fp-texte-fort);
  font-family: var(--fp-font-mono);
  font-weight: 700;
  text-align: left;
  white-space: nowrap;
}

:where(.fp-root) .fp-table-build__cellule {
  padding: var(--fp-s-1) var(--fp-s-2);
  border-bottom: 1px solid var(--fp-bordure);
  text-align: right;
}

:where(.fp-root) .fp-table-build__champ {
  width: 100%;
  min-width: calc(6rem * var(--fp-echelle));
  padding: var(--fp-s-1) var(--fp-s-2);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r-sm);
  background: var(--fp-surface);
  color: var(--fp-texte-fort);
  font-family: var(--fp-font-mono);
  font-size: var(--fp-corps);
  text-align: right;
}

:where(.fp-root) .fp-table-build__champ:focus-visible {
  outline: 2px solid var(--fp-teal);
  outline-offset: 2px;
}

:where(.fp-root) .fp-table-build__champ[readonly] {
  border-color: transparent;
  background: transparent;
  color: var(--fp-ink-mute);
  font-weight: 600;
}

:where(.fp-root) .fp-table-build__champ:disabled {
  background: var(--fp-en-attente-fond);
  color: var(--fp-en-attente);
}

:where(.fp-root) .fp-table-build__totaux th,
:where(.fp-root) .fp-table-build__totaux td {
  border-top: 2px solid var(--fp-bordure);
  border-bottom: none;
  color: var(--fp-teal-ink);
  font-weight: 700;
}

:where(.fp-root) .fp-table-build__solde {
  color: var(--fp-texte-fort);
  font-weight: 600;
  overflow-wrap: anywhere;
}

:where(.fp-root) .fp-table-build__vide {
  padding: var(--fp-s-2) var(--fp-s-3);
  border: 1px dashed var(--fp-bordure);
  border-radius: var(--fp-r-sm);
  color: var(--fp-en-attente);
}

:where(.fp-root) .fp-table-build__valider {
  justify-self: start;
  padding: var(--fp-s-2) var(--fp-s-4);
  border: 1px solid var(--fp-teal-deep);
  border-radius: var(--fp-r-pill);
  background: var(--fp-teal-deep);
  color: var(--fp-cream);
  font-weight: 600;
  cursor: pointer;
}

:where(.fp-root) .fp-table-build__valider:disabled {
  border-color: var(--fp-bordure);
  background: var(--fp-en-attente-fond);
  color: var(--fp-en-attente);
  cursor: not-allowed;
}

:where(.fp-root) .fp-table-build__retour {
  min-height: calc(1.5rem * var(--fp-echelle));
  color: var(--fp-texte-fort);
}

:where(.fp-root) .fp-table-build__progression {
  color: var(--fp-ink-mute);
  font-family: var(--fp-font-mono);
  letter-spacing: 0.02em;
}

:where(.fp-root) .fp-table-build__reperes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
}

:where(.fp-root) .fp-table-build__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
  align-items: center;
}

:where(.fp-root) .fp-table-build__consignes,
:where(.fp-root) .fp-table-build__attendus {
  display: grid;
  gap: var(--fp-s-1);
  margin: 0;
  padding-left: var(--fp-s-3);
}

:where(.fp-root) .fp-table-build__attendu {
  color: var(--fp-texte-fort);
  font-variant-numeric: tabular-nums;
}

:where(.fp-root) .fp-table-build__synthese {
  display: grid;
  gap: var(--fp-s-2);
  padding: var(--fp-s-2) var(--fp-s-3);
  border: 1px solid var(--fp-line);
  border-radius: var(--fp-r);
  background: var(--fp-ivory);
}

:where(.fp-root) .fp-table-build__titre {
  margin: 0;
  font-size: calc(1rem * var(--fp-echelle));
}

:where(.fp-root) .fp-table-build__resultat {
  display: flex;
  justify-content: space-between;
  gap: var(--fp-s-2);
}
`;
