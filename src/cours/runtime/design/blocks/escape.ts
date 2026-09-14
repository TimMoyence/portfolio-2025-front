export const escape = `
:where(.fp-root) .fp-escape__parcours {
  display: grid;
  justify-items: stretch;
  gap: var(--fp-s-3);
  min-width: 0;
}

:where(.fp-root) .fp-escape__intitule {
  margin: 0;
}

:where(.fp-root) .fp-escape__consigne {
  padding: var(--fp-s-2) var(--fp-s-3);
  border-left: var(--fp-s-1) solid var(--fp-teal-deep);
  border-radius: var(--fp-r-sm);
  background: var(--fp-confirme-fond);
  color: var(--fp-confirme);
}

:where(.fp-root) .fp-escape__progression {
  color: var(--fp-ink-mute);
  font-family: var(--fp-font-mono);
  letter-spacing: 0.02em;
}

:where(.fp-root) .fp-escape__minuteur {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
  align-items: baseline;
  color: var(--fp-ink-mute);
  font-family: var(--fp-font-mono);
}

:where(.fp-root) .fp-escape__minuteur[data-echu='true'] {
  color: var(--fp-texte-fort);
}

:where(.fp-root) .fp-escape__echeance {
  padding: 0 var(--fp-s-2);
  border-radius: var(--fp-r-pill);
  background: var(--fp-en-cours-fond);
  color: var(--fp-en-cours);
  font-family: var(--fp-font-sans);
}

:where(.fp-root) .fp-escape__liste {
  display: grid;
  gap: var(--fp-s-3);
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: fp-escape;
}

:where(.fp-root) .fp-escape__enigme {
  display: grid;
  gap: var(--fp-s-2);
  padding: var(--fp-s-3);
  border: 1px solid var(--fp-bordure);
  border-left: var(--fp-s-1) solid var(--fp-bordure);
  border-radius: var(--fp-r);
  background: var(--fp-ivory);
}

:where(.fp-root) .fp-escape__enigme[data-etat='resolue'] {
  border-left-color: var(--fp-confirme);
}

:where(.fp-root) .fp-escape__enigme[data-etat='ouverte'] {
  border-left-color: var(--fp-teal-deep);
  background: var(--fp-surface);
}

:where(.fp-root) .fp-escape__enigme[data-etat='verrouillee'] {
  border-left-style: dashed;
  background: var(--fp-en-attente-fond);
}

:where(.fp-root) .fp-escape__titre {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
  align-items: baseline;
  justify-content: space-between;
  margin: 0;
}

:where(.fp-root) .fp-escape__nom {
  color: var(--fp-teal-ink);
  font-family: var(--fp-font-sans);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

:where(.fp-root) .fp-escape__nom::before {
  counter-increment: fp-escape;
  content: counter(fp-escape) '. ';
}

:where(.fp-root) .fp-escape__etat {
  white-space: nowrap;
}

:where(.fp-root) .fp-escape__verrou {
  margin: 0;
  color: var(--fp-en-attente);
}

:where(.fp-root) .fp-escape__fragment {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
  align-items: baseline;
  margin: 0;
  color: var(--fp-confirme);
}

:where(.fp-root) .fp-escape__mention {
  color: var(--fp-ink-mute);
  font-weight: 600;
}

:where(.fp-root) .fp-escape__enonce {
  margin: 0;
}

:where(.fp-root) .fp-escape__saisie {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
  align-items: center;
  margin: 0;
}

:where(.fp-root) .fp-escape__etiquette {
  color: var(--fp-ink-mute);
  font-weight: 600;
}

:where(.fp-root) .fp-escape__champ {
  flex: 1 1 12rem;
  min-width: 0;
  padding: var(--fp-s-1) var(--fp-s-2);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r-sm);
  background: var(--fp-surface);
  color: var(--fp-texte-fort);
  font-family: var(--fp-font-mono);
  font-size: var(--fp-corps);
}

:where(.fp-root) .fp-escape__repondre {
  padding: var(--fp-s-2) var(--fp-s-4);
  border: 1px solid var(--fp-teal-deep);
  border-radius: var(--fp-r-pill);
  background: var(--fp-teal-deep);
  color: var(--fp-cream);
  font-weight: 600;
  cursor: pointer;
}

:where(.fp-root) .fp-escape__aide {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
  align-items: center;
  margin: 0;
}

:where(.fp-root) .fp-escape__indice {
  padding: var(--fp-s-1) var(--fp-s-3);
  border: 1px solid var(--fp-gold-deep);
  border-radius: var(--fp-r-pill);
  background: var(--fp-surface);
  color: var(--fp-gold-ink);
  font-weight: 600;
  cursor: pointer;
}

:where(.fp-root) .fp-escape__indice[data-pret='false'] {
  border-style: dashed;
  color: var(--fp-ink-mute);
}

:where(.fp-root) .fp-escape__indice:disabled {
  background: var(--fp-en-attente-fond);
  color: var(--fp-en-attente);
  cursor: not-allowed;
}

:where(.fp-root) .fp-escape__gratuite {
  color: var(--fp-ink-mute);
  font-size: calc(0.85rem * var(--fp-echelle));
}

:where(.fp-root) .fp-escape__indication {
  margin: 0;
}

:where(.fp-root) .fp-escape__coffre {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
  align-items: baseline;
  padding: var(--fp-s-2) var(--fp-s-3);
  border: 1px solid var(--fp-confirme);
  border-radius: var(--fp-r);
  background: var(--fp-confirme-fond);
  color: var(--fp-confirme);
}

:where(.fp-root) .fp-escape__annonce {
  min-height: calc(1.5rem * var(--fp-echelle));
  color: var(--fp-texte-fort);
}

:where(.fp-root) .fp-escape__reperes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
}

:where(.fp-root) .fp-escape__solutions {
  display: grid;
  gap: var(--fp-s-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

:where(.fp-root) .fp-escape__solution {
  color: var(--fp-ink-soft);
  font-family: var(--fp-font-mono);
}

:where(.fp-root) .fp-escape__vide {
  padding: var(--fp-s-2) var(--fp-s-3);
  border: 1px dashed var(--fp-bordure);
  border-radius: var(--fp-r-sm);
  color: var(--fp-en-attente);
}
`;
