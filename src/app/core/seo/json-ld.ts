// Tous les `<` sont echappes, pas seulement `</script>` : apres un `<!--<script`,
// l'etat « script data double escaped » du tokenizer HTML empeche le `</script>`
// suivant de fermer le bloc (mXSS).
// https://html.spec.whatwg.org/multipage/parsing.html#script-data-double-escaped-state
export const serialiserJsonLd = (donnees: unknown): string =>
  JSON.stringify(donnees).replace(/</g, '\\u003c');
