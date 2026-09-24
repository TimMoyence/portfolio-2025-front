export const quote = `
:where(.fp-root) .fp-quote__figure {
  display: grid;
  gap: var(--fp-s-3);
  justify-items: start;
}

:where(.fp-root) .fp-quote__texte {
  max-width: 46ch;
  color: var(--fp-texte-fort);
  font-family: var(--fp-font-display);
  font-size: calc(1.5rem * var(--fp-echelle));
  line-height: 1.3;
  text-wrap: balance;
}

:where(.fp-root) .fp-quote__texte::before {
  content: '« ';
}

:where(.fp-root) .fp-quote__texte::after {
  content: ' »';
}

:where(.fp-root) .fp-quote__attribution {
  color: var(--fp-ink-mute);
  font-size: calc(0.95rem * var(--fp-echelle));
  font-style: italic;
  letter-spacing: 0.01em;
}

:where(.fp-root) .fp-quote__attribution::before {
  content: '— ';
}
`;

export const story = `
:where(.fp-root) .fp-story__recit {
  display: grid;
  gap: var(--fp-s-3);
}

:where(.fp-root) .fp-story__titre {
  font-size: calc(1.35rem * var(--fp-echelle));
}

:where(.fp-root) .fp-story__corps {
  display: grid;
  gap: var(--fp-s-2);
}

:where(.fp-root) .fp-story__visuel {
  display: grid;
  gap: var(--fp-s-1);
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--fp-line);
  border-radius: var(--fp-r);
  background: linear-gradient(135deg, var(--fp-teal-deep), var(--fp-ink));
}

:where(.fp-root) .fp-story__visuel img {
  display: block;
  width: 100%;
  max-height: min(38cqh, 22rem);
  margin: 0;
  object-fit: cover;
}

:where(.fp-root) .fp-story__visuel figcaption {
  padding: 0 var(--fp-s-2) var(--fp-s-2);
  color: var(--fp-cream);
  font-family: var(--fp-font-mono);
  font-size: calc(0.68rem * var(--fp-echelle));
}

:where(.fp-root) .fp-story__video {
  display: grid;
  gap: var(--fp-s-2);
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--fp-line);
  border-radius: var(--fp-r);
  background: var(--fp-ink);
}

:where(.fp-root) .fp-story__video-titre {
  padding: var(--fp-s-3) var(--fp-s-3) 0;
  color: var(--fp-cream);
  font-size: calc(0.9rem * var(--fp-echelle));
  font-weight: 700;
}

:where(.fp-root) .fp-story__video video {
  width: 100%;
  min-height: min(42cqh, 24rem);
  background: #050505;
  object-fit: contain;
}

:where(.fp-root) .fp-story__video {
  width: min(100%, 72rem);
  box-sizing: border-box;
  margin-inline: auto;
  padding: clamp(1rem, 2cqi, 1.5rem);
  background: var(--fp-ink);
  border-radius: var(--fp-r-lg);
  box-shadow: var(--fp-shadow-card);
}

:where(.fp-root) .fp-story__video video {
  width: min(100%, 53.75rem);
  min-height: 0;
  max-height: min(60cqh, 26rem);
  margin-inline: auto;
}

:where(.fp-root) .fp-story__transcription {
  margin-inline: var(--fp-s-3);
  color: var(--fp-cream);
}

:where(.fp-root) .fp-story__transcription summary {
  cursor: pointer;
  font-weight: 700;
}

:where(.fp-root) .fp-story__transcription p {
  padding: var(--fp-s-2) 0;
  color: var(--fp-sand);
}

:where(.fp-root) .fp-story__licence {
  padding: 0 var(--fp-s-3) var(--fp-s-3);
  color: var(--fp-sand);
  font-family: var(--fp-font-mono);
  font-size: calc(0.68rem * var(--fp-echelle));
}

:where(.fp-root) .fp-story__licence a {
  color: var(--fp-cream);
}

:where(.fp-root) .fp-story__paragraphe {
  overflow-wrap: anywhere;
}

:where(.fp-root) .fp-story__paragraphe:first-child::first-letter {
  float: left;
  padding-right: var(--fp-s-1);
  color: var(--fp-gold-ink);
  font-family: var(--fp-font-display);
  font-size: calc(2.4rem * var(--fp-echelle));
  line-height: 0.8;
}

:where(.fp-root) .fp-story__reperes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
}
`;

export const pro = `
:where(.fp-root) .fp-pro__cas {
  display: grid;
  gap: var(--fp-s-3);
  justify-items: center;
}

:where(.fp-root) .fp-pro__metier {
  background: var(--fp-gold-deep);
  color: var(--fp-cream);
  text-transform: uppercase;
}

:where(.fp-root) .fp-pro__corps {
  display: grid;
  gap: var(--fp-s-3);
  width: 100%;
}

:where(.fp-root) .fp-pro__situation {
  overflow-wrap: anywhere;
}

:where(.fp-root) .fp-pro__geste {
  display: grid;
  gap: var(--fp-s-1);
  border-left-color: var(--fp-teal-deep);
}

:where(.fp-root) .fp-pro__intitule {
  color: var(--fp-teal-ink);
  font-family: var(--fp-font-sans);
  font-size: calc(0.85rem * var(--fp-echelle));
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

:where(.fp-root) .fp-pro__geste-texte {
  color: var(--fp-texte-fort);
  overflow-wrap: anywhere;
}

:where(.fp-root) .fp-pro__consequence {
  color: var(--fp-ink-mute);
  font-style: italic;
  overflow-wrap: anywhere;
}

:where(.fp-root) .fp-pro__questions {
  display: grid;
  gap: var(--fp-s-3);
  width: 100%;
  margin: 0;
  padding-left: var(--fp-s-4);
}

:where(.fp-root) .fp-pro__question {
  display: grid;
  gap: var(--fp-s-1);
  color: var(--fp-texte-fort);
  overflow-wrap: anywhere;
}

:where(.fp-root) .fp-pro__libelle {
  font-weight: 600;
}

:where(.fp-root) .fp-pro__champ {
  box-sizing: border-box;
  width: 100%;
  padding: var(--fp-s-2);
  font: inherit;
  color: var(--fp-texte-fort);
  background: var(--fp-surface);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r-sm);
  resize: vertical;
}

:where(.fp-root) .fp-pro__champ:focus-visible {
  outline: 2px solid var(--fp-teal);
  outline-offset: 2px;
}

:where(.fp-root) .fp-pro__champ:disabled,
:where(.fp-root) .fp-pro__valider:disabled {
  color: var(--fp-en-attente);
  background: var(--fp-en-attente-fond);
}

:where(.fp-root) .fp-pro__valider {
  justify-self: start;
  padding: var(--fp-s-2) var(--fp-s-4);
  font-weight: 600;
  color: var(--fp-cream);
  background: var(--fp-teal-deep);
  border: 1px solid var(--fp-teal-deep);
  border-radius: var(--fp-r-pill);
  cursor: pointer;
}

:where(.fp-root) .fp-pro__retour {
  min-height: calc(1.5rem * var(--fp-echelle));
  color: var(--fp-texte-fort);
}

:where(.fp-root) .fp-pro__cas {
  width: min(100%, 64rem);
  box-sizing: border-box;
  margin-inline: auto;
}

:where(.fp-root) .fp-pro__metier {
  justify-self: center;
  text-align: center;
}

:where(.fp-root) .fp-pro__corps,
:where(.fp-root) .fp-pro__reponses {
  max-width: 62ch;
  margin-inline: auto;
}

:where(.fp-root) .fp-pro__reponses {
  display: grid;
  gap: var(--fp-s-3);
  width: 100%;
}

:where(.fp-root) .fp-pro__geste-texte {
  font-size: calc(1.2rem * var(--fp-echelle));
  line-height: 1.35;
}

:where(.fp-root) .fp-pro__geste {
  padding: clamp(1rem, 2cqi, 1.5rem);
  border-left-width: 0.35rem;
  background: var(--fp-ivory);
}

@container (min-width: 60rem) {
  :where(.fp-root) .fp-pro__cas:has(.fp-pro__reponses) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }

  :where(.fp-root) .fp-pro__cas:has(.fp-pro__reponses) > :not(.fp-pro__corps, .fp-pro__reponses) {
    grid-column: 1 / -1;
  }

  :where(.fp-root) .fp-pro__cas:has(.fp-pro__reponses) .fp-pro__corps,
  :where(.fp-root) .fp-pro__cas:has(.fp-pro__reponses) .fp-pro__reponses {
    margin-inline: 0;
  }
}
`;
