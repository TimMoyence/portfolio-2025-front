export function contrastesInsuffisants(racine: Element): readonly string[] {
  interface Couleur {
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly a: number;
  }
  const BLANC: Couleur = { r: 255, g: 255, b: 255, a: 1 };

  const lire = (valeur: string): Couleur | null => {
    const rgb = /^rgba?\(([^)]+)\)$/.exec(valeur);
    const srgb = /^color\(srgb ([^)]+)\)$/.exec(valeur);
    const brut = rgb?.[1] ?? srgb?.[1];
    if (brut === undefined) return null;
    const [r = 0, g = 0, b = 0, a = 1] = brut
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number);
    const echelle = srgb ? 255 : 1;
    return { r: r * echelle, g: g * echelle, b: b * echelle, a };
  };

  const poser = (dessus: Couleur, dessous: Couleur): Couleur => ({
    r: dessus.r * dessus.a + dessous.r * (1 - dessus.a),
    g: dessus.g * dessus.a + dessous.g * (1 - dessus.a),
    b: dessus.b * dessus.a + dessous.b * (1 - dessus.a),
    a: 1,
  });

  const lineaire = (canal: number): number => {
    const v = canal / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (c: Couleur): number =>
    0.2126 * lineaire(c.r) + 0.7152 * lineaire(c.g) + 0.0722 * lineaire(c.b);
  const rapport = (a: Couleur, b: Couleur): number => {
    const [clair, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (clair + 0.05) / (sombre + 0.05);
  };

  const fondDe = (element: Element): Couleur | null => {
    const couches: Couleur[] = [];
    for (let e: Element | null = element; e !== null; e = e.parentElement) {
      const style = getComputedStyle(e);
      if (style.backgroundImage !== 'none') return null;
      const couleur = lire(style.backgroundColor);
      if (couleur === null) return null;
      if (couleur.a > 0) couches.push(couleur);
      if (couleur.a >= 1) break;
    }
    return couches.reduceRight((dessous, dessus) => poser(dessus, dessous), BLANC);
  };

  const opaciteDe = (element: Element): number => {
    let opacite = 1;
    for (let e: Element | null = element; e !== null; e = e.parentElement) {
      opacite *= Number(getComputedStyle(e).opacity);
    }
    return opacite;
  };

  const mesurer = (parent: Element, contenu: string): string | null => {
    const style = getComputedStyle(parent);
    const texte = lire(style.color);
    const fond = fondDe(parent);
    if (texte === null || fond === null) return null;
    const vu = poser({ ...texte, a: texte.a * opaciteDe(parent) }, fond);
    const taille = parseFloat(style.fontSize);
    const gras = Number(style.fontWeight) >= 700;
    const seuil = taille >= 24 || (gras && taille >= 18.66) ? 3 : 4.5;
    const mesure = rapport(vu, fond);
    return mesure < seuil
      ? `« ${contenu.slice(0, 40)} » ${mesure.toFixed(2)}:1 < ${seuil}:1`
      : null;
  };

  const vus = new Set<Element>();
  const insuffisants: string[] = [];
  const aMesurer = (enfant: Text): Element | null => {
    const parent = enfant.parentElement;
    if (enfant.data.trim() === '' || parent === null || vus.has(parent)) return null;
    if (parent.closest('[aria-hidden="true"]') !== null) return null;
    return parent.checkVisibility({ opacityProperty: true, visibilityProperty: true })
      ? parent
      : null;
  };
  const parcourir = (noeud: Node): void => {
    for (const enfant of noeud.childNodes) {
      if (enfant instanceof Element) {
        parcourir(enfant);
        continue;
      }
      const parent = enfant instanceof Text ? aMesurer(enfant) : null;
      if (parent === null) continue;
      vus.add(parent);
      const ecart = mesurer(parent, enfant.textContent?.trim() ?? '');
      if (ecart !== null) insuffisants.push(ecart);
    }
  };
  parcourir(racine);
  return insuffisants;
}
