import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { type OptionPublique, projeterMetadonnees, projeterOptions } from './projection';
import {
  estObjet,
  estVerdictDeProduction,
  type DetailDeVerdict,
  type VerdictDeProduction,
} from './retours';

export interface CardsortPlanPublic {
  readonly id: string;
  readonly intitule: string;
  readonly cartes: readonly OptionPublique[];
  readonly categories: readonly OptionPublique[];
  readonly dureeJeuMs?: number;
  readonly metadonnees: MetadonneesBrique;
}

interface AttenduFormateur {
  readonly carteId: string;
  readonly categorieId: string;
  readonly justification: string;
}

type Foyer = 'carte' | 'cible' | null;

const PIOCHE = '';
const VIDE = escapeHtml('');
const DESACTIVE = safeHtml`disabled`;
const RETENU = safeHtml`selected`;
const TOUCHES_ACTION: readonly string[] = ['Enter', ' '];
const PAS_MS = 1000;
const MS_PAR_MINUTE = 60_000;

function copierPlan(source: CardsortPlanPublic): CardsortPlanPublic {
  const duree = source.dureeJeuMs;
  return {
    id: source.id,
    intitule: source.intitule,
    cartes: projeterOptions(source.cartes),
    categories: projeterOptions(source.categories),
    ...(typeof duree === 'number' && Number.isFinite(duree) && duree > 0
      ? { dureeJeuMs: duree }
      : {}),
    metadonnees: projeterMetadonnees(source.metadonnees),
  };
}

function lireAttendus(valeur: unknown): readonly AttenduFormateur[] {
  if (!estObjet(valeur) || valeur['type'] !== 'classement' || !Array.isArray(valeur['attendus'])) {
    return [];
  }
  return valeur['attendus'].filter(
    (attendu): attendu is AttenduFormateur =>
      estObjet(attendu) &&
      typeof attendu['carteId'] === 'string' &&
      typeof attendu['categorieId'] === 'string' &&
      typeof attendu['justification'] === 'string',
  );
}

function formaterChrono(restantMs: number): string {
  const secondes = Math.ceil(restantMs / PAS_MS);
  const minutes = Math.floor((secondes * PAS_MS) / MS_PAR_MINUTE);
  return `${minutes}:${String(secondes % 60).padStart(2, '0')}`;
}

export class FpCardsort extends FpBlock {
  private interne: CardsortPlanPublic | null = null;
  private places: Record<string, string> = {};
  private selection: string | null = null;
  private derniere: string | null = null;
  private destination = PIOCHE;
  private foyer: Foyer = null;
  private message = '';
  private soumis = false;
  private deposee = false;
  private interneVerdict: VerdictDeProduction | null = null;
  private attendus: readonly AttenduFormateur[] = [];
  private minuteur: ReturnType<typeof setInterval> | null = null;

  set plan(valeur: CardsortPlanPublic | null) {
    const change = (valeur?.id ?? null) !== (this.interne?.id ?? null);
    this.interne = valeur === null ? null : copierPlan(valeur);
    if (change) {
      this.places = {};
      this.selection = null;
      this.derniere = null;
      this.destination = PIOCHE;
      this.foyer = null;
      this.message = '';
      this.soumis = false;
      this.interneVerdict = null;
    }
    this.refreshSiConnecte();
  }

  get plan(): CardsortPlanPublic | null {
    return this.interne;
  }

  set verdict(valeur: VerdictDeProduction | null) {
    this.interneVerdict =
      estVerdictDeProduction(valeur) && valeur.questionId === this.interne?.id ? valeur : null;
    this.refreshSiConnecte();
  }

  get verdict(): VerdictDeProduction | null {
    return this.interneVerdict;
  }

  set corrige(valeur: unknown) {
    this.attendus = lireAttendus(valeur);
    this.refreshSiConnecte();
  }

  set brouillon(valeur: unknown) {
    if (!estObjet(valeur) || this.soumis) {
      return;
    }
    const cartes = new Set(this.interne?.cartes.map((carte) => carte.id) ?? []);
    const categories = new Set(this.interne?.categories.map((categorie) => categorie.id) ?? []);
    this.places = Object.fromEntries(
      Object.entries(valeur).filter(
        (entree): entree is [string, string] =>
          cartes.has(entree[0]) && typeof entree[1] === 'string' && categories.has(entree[1]),
      ),
    );
    this.noterBrouillonRepris();
    this.refreshSiConnecte();
  }

  disconnectedCallback(): void {
    this.arreter();
  }

  render(): EscapedHtml {
    const plan = this.interne;
    if (plan === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('chargement'))}</p>`;
    }
    return safeHtml`
      <section class="fp-carte fp-scene fp-cardsort__atelier">
        <p class="fp-enonce fp-cardsort__intitule">${escapeHtml(plan.intitule)}</p>
        ${this.presentateur() ? VIDE : safeHtml`<p class="fp-cardsort__consigne">${escapeHtml(this.texte('cardsort-consigne'))}</p>`}
        ${this.chrono()}
        ${this.plateau(!this.presentateur())}
        ${this.presentateur() ? VIDE : this.commandes(plan)}
        ${this.correction()}
      </section>
    `;
  }

  private commandes(plan: CardsortPlanPublic): EscapedHtml {
    const verrouille = this.verrouille();
    return safeHtml`
      ${this.pilote()}
      <div class="fp-cardsort__actions">
        <button type="button" class="fp-cardsort__valider" data-testid="valider" ${verrouille ? DESACTIVE : VIDE}>${escapeHtml(this.texte('valider'))}</button>
        ${this.boutonNeSaitPas(verrouille)}
      </div>
      <p class="fp-cardsort__annonce" role="status" aria-live="polite" data-testid="annonce">${escapeHtml(this.message)}</p>
      ${this.verdictDeProduction(this.interneVerdict, 'cardsort-verdict', this.justes(), plan.cartes.length)}
      ${this.annonces()}
    `;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.interne?.id ?? null);
    this.planifier();
    if (this.presentateur()) {
      return;
    }
    for (const carte of racine.querySelectorAll<HTMLElement>('[data-testid="carte"]')) {
      this.brancherCarte(carte);
    }
    for (const pile of racine.querySelectorAll<HTMLElement>('[data-testid="pile"]')) {
      this.brancherPile(pile);
    }
    this.brancherCible(racine.querySelector<HTMLSelectElement>('[data-testid="cible"]'));
    this.brancherActivation(racine.querySelector('[data-testid="deplacer"]'), () =>
      this.deplacer(),
    );
    this.brancherActivation(racine.querySelector('[data-testid="valider"]'), () => this.valider());
    this.brancherActivation(racine.querySelector('[data-testid="je-ne-sais-pas"]'), () =>
      this.neSaitPas(),
    );
  }

  private verrouille(): boolean {
    return this.verrouilleApresEnvoi(this.soumis, this.interneVerdict !== null);
  }

  private detailDe(carteId: string): DetailDeVerdict | null {
    return this.interneVerdict?.details.find((detail) => detail.cle === carteId) ?? null;
  }

  private justes(): number {
    return this.interneVerdict?.details.filter((detail) => detail.juste).length ?? 0;
  }

  private restantMs(): number | null {
    const duree = this.interne?.dureeJeuMs;
    return duree === undefined ? null : Math.max(0, duree - this.depuisAffichage());
  }

  private chrono(): EscapedHtml {
    const restant = this.restantMs();
    if (restant === null) {
      return VIDE;
    }
    const texte =
      restant > 0
        ? `${this.texte('cardsort-chrono')} ${formaterChrono(restant)}`
        : this.texte('cardsort-chrono-echu');
    return safeHtml`<p class="fp-cardsort__chrono" aria-live="off" data-testid="chrono" data-echu="${escapeHtml(String(restant === 0))}">${escapeHtml(texte)}</p>`;
  }

  private planifier(): void {
    const restant = this.restantMs();
    if (this.minuteur !== null || restant === null || restant <= 0) {
      return;
    }
    this.minuteur = setInterval(() => this.battre(), PAS_MS);
  }

  private arreter(): void {
    if (this.minuteur !== null) {
      clearInterval(this.minuteur);
      this.minuteur = null;
    }
  }

  private battre(): void {
    const restant = this.restantMs() ?? 0;
    const chrono = this.racine.querySelector<HTMLElement>('[data-testid="chrono"]');
    if (chrono !== null) {
      chrono.textContent =
        restant > 0
          ? `${this.texte('cardsort-chrono')} ${formaterChrono(restant)}`
          : this.texte('cardsort-chrono-echu');
      chrono.dataset['echu'] = String(restant === 0);
    }
    if (restant <= 0) {
      this.arreter();
    }
  }

  private brancherActivation(element: Element | null, action: () => void): void {
    if (element === null) {
      return;
    }
    element.addEventListener('click', action);
    element.addEventListener('keydown', (evenement) => {
      if (!(evenement instanceof KeyboardEvent) || !TOUCHES_ACTION.includes(evenement.key)) {
        return;
      }
      evenement.preventDefault();
      action();
    });
  }

  private brancherCarte(carte: HTMLElement): void {
    const id = carte.dataset['carte'] ?? '';
    this.brancherActivation(carte, () => this.choisir(id));
    carte.addEventListener('dragstart', () => this.saisir(id));
    carte.addEventListener('dragend', () => this.relacher());
    if (id === this.derniere && this.foyer === 'carte' && !this.verrouille()) {
      carte.focus();
    }
  }

  private brancherPile(pile: HTMLElement): void {
    const zone = pile.dataset['zone'] ?? PIOCHE;
    pile.addEventListener('dragover', (evenement) => evenement.preventDefault());
    pile.addEventListener('drop', (evenement) => {
      evenement.preventDefault();
      this.deposee = true;
      this.deposer(zone);
    });
  }

  private brancherCible(cible: HTMLSelectElement | null): void {
    if (cible === null) {
      return;
    }
    cible.disabled = this.verrouille();
    cible.addEventListener('change', () => {
      this.destination = cible.value;
    });
    if (this.foyer === 'cible' && !this.verrouille()) {
      cible.focus();
    }
  }

  private zones(): readonly OptionPublique[] {
    return [
      { id: PIOCHE, libelle: this.texte('cardsort-pioche') },
      ...(this.interne?.categories ?? []),
    ];
  }

  private zoneConnue(id: string): string {
    return this.interne?.categories.some((categorie) => categorie.id === id) === true ? id : PIOCHE;
  }

  private libelleZone(id: string): string {
    return this.zones().find((zone) => zone.id === id)?.libelle ?? '';
  }

  private zoneDe(carte: string): string {
    if (this.presentateur()) {
      const attendu = this.attendus.find((candidat) => candidat.carteId === carte);
      return this.zoneConnue(attendu?.categorieId ?? PIOCHE);
    }
    return this.zoneConnue(this.places[carte] ?? PIOCHE);
  }

  private cartesDe(zone: string): readonly OptionPublique[] {
    return (this.interne?.cartes ?? []).filter((carte) => this.zoneDe(carte.id) === zone);
  }

  private placees(): number {
    return (this.interne?.cartes ?? []).filter((carte) => this.zoneDe(carte.id) !== PIOCHE).length;
  }

  private carteChoisie(): OptionPublique | null {
    return this.interne?.cartes.find((carte) => carte.id === this.selection) ?? null;
  }

  private plateau(interactif: boolean): EscapedHtml {
    return safeHtml`
      <div class="fp-cardsort__zones">${this.zones().map((zone) => this.zone(zone, interactif))}</div>
      ${(this.interne?.cartes.length ?? 0) === 0 ? this.plateauVide() : VIDE}
    `;
  }

  private plateauVide(): EscapedHtml {
    return safeHtml`<p class="fp-cardsort__vide" data-testid="vide">${escapeHtml(this.texte('cardsort-vide'))}</p>`;
  }

  private zone(zone: OptionPublique, interactif: boolean): EscapedHtml {
    const cartes = this.cartesDe(zone.id);
    const repere = `fp-cardsort-zone-${zone.id === PIOCHE ? 'pioche' : zone.id}`;
    return safeHtml`
      <section class="fp-cardsort__zone" data-testid="zone" data-pioche="${escapeHtml(String(zone.id === PIOCHE))}" aria-labelledby="${escapeHtml(repere)}">
        <h3 class="fp-cardsort__titre" id="${escapeHtml(repere)}">${escapeHtml(zone.libelle)} <span class="fp-cardsort__compte fp-montant" data-testid="compte">${cartes.length}</span></h3>
        <ul class="fp-cardsort__pile" data-testid="pile" data-zone="${escapeHtml(zone.id)}">${cartes.map((carte) => this.place(carte, zone, interactif))}</ul>
      </section>
    `;
  }

  private attenduDe(carteId: string): AttenduFormateur | null {
    return this.attendus.find((attendu) => attendu.carteId === carteId) ?? null;
  }

  private carteJuste(carteId: string): boolean | null {
    const detail = this.detailDe(carteId);
    if (detail !== null) {
      return detail.juste;
    }
    const attendu = this.attenduDe(carteId);
    return attendu === null ? null : this.places[carteId] === attendu.categorieId;
  }

  private etatDeLaCarte(carteId: string): EscapedHtml {
    const juste = this.carteJuste(carteId);
    if (juste === null) {
      return VIDE;
    }
    return safeHtml`data-etat="${escapeHtml(juste ? 'confirme' : 'a-revoir')}" data-correction="${escapeHtml(juste ? 'juste' : 'fausse')}"`;
  }

  private correction(): EscapedHtml {
    if (this.attendus.length === 0) {
      return VIDE;
    }
    return safeHtml`
      <section class="fp-cardsort__zone" data-testid="cardsort-correction">
        <h3 class="fp-cardsort__titre">${escapeHtml(this.texte('cardsort-correction'))}</h3>
        <ul class="fp-cardsort__attendus">${this.attendus.map((attendu) => this.justification(attendu))}</ul>
      </section>
    `;
  }

  private justification(attendu: AttenduFormateur): EscapedHtml {
    return safeHtml`<li class="fp-cardsort__attendu" data-testid="cardsort-justification" data-carte="${escapeHtml(attendu.carteId)}"><strong>${escapeHtml(this.libelleCarte(attendu.carteId))} — ${escapeHtml(this.libelleZone(this.zoneConnue(attendu.categorieId)))}</strong> <span class="fp-cardsort__justification">${escapeHtml(attendu.justification)}</span></li>`;
  }

  private place(carte: OptionPublique, zone: OptionPublique, interactif: boolean): EscapedHtml {
    const enonce = `${carte.libelle} — ${zone.libelle}`;
    if (!interactif) {
      const marque = this.attenduDe(carte.id) === null ? VIDE : safeHtml`data-correction="juste"`;
      return safeHtml`<li class="fp-cardsort__place"><span class="fp-carte fp-cardsort__carte" data-testid="carte" data-carte="${escapeHtml(carte.id)}" ${marque}>${escapeHtml(carte.libelle)}</span></li>`;
    }
    const choisie = carte.id === this.selection;
    const detail = this.detailDe(carte.id);
    const confusion =
      detail === null || detail.juste || detail.libelleConfusion === null
        ? VIDE
        : safeHtml`<span class="fp-cardsort__confusion" data-testid="confusion">${escapeHtml(detail.libelleConfusion)}</span>`;
    return safeHtml`<li class="fp-cardsort__place"><button type="button" class="fp-carte fp-cardsort__carte" data-testid="carte" data-carte="${escapeHtml(carte.id)}" draggable="true" aria-pressed="${escapeHtml(choisie)}" aria-label="${escapeHtml(enonce)}" ${this.etatDeLaCarte(carte.id)} ${this.verrouille() ? DESACTIVE : VIDE}>${escapeHtml(carte.libelle)}</button>${confusion}</li>`;
  }

  private pilote(): EscapedHtml {
    const verrouille = this.verrouille();
    return safeHtml`
      <p class="fp-cardsort__pilote">
        <label class="fp-cardsort__etiquette" for="fp-cardsort-cible">${escapeHtml(this.texte('cardsort-destination'))}</label>
        <select class="fp-cardsort__cible" id="fp-cardsort-cible" data-testid="cible">${this.zones().map((zone) => this.choix(zone))}</select>
        <button type="button" class="fp-cardsort__deplacer" data-testid="deplacer" ${verrouille ? DESACTIVE : VIDE}>${escapeHtml(this.texte('cardsort-deplacer'))}</button>
        <span class="fp-cardsort__progression" data-testid="progression">${escapeHtml(this.texte('cardsort-progression'))} ${this.placees()} / ${this.interne?.cartes.length ?? 0}</span>
      </p>
    `;
  }

  private choix(zone: OptionPublique): EscapedHtml {
    return safeHtml`<option value="${escapeHtml(zone.id)}" ${zone.id === this.destination ? RETENU : VIDE}>${escapeHtml(zone.libelle)}</option>`;
  }

  private choisir(id: string): void {
    if (this.verrouille()) {
      return;
    }
    const relachee = this.selection === id;
    this.selection = relachee ? null : id;
    this.derniere = id;
    this.foyer = relachee ? 'carte' : 'cible';
    this.message = relachee
      ? this.texte('cardsort-relachee')
      : `${this.texte('cardsort-selection')} ${this.libelleCarte(id)}`;
    this.refresh();
  }

  private libelleCarte(id: string): string {
    return this.interne?.cartes.find((carte) => carte.id === id)?.libelle ?? '';
  }

  private deplacer(): void {
    const carte = this.carteChoisie();
    if (this.verrouille()) {
      return;
    }
    if (carte === null) {
      this.message = this.texte('cardsort-aucune-carte');
      this.foyer = 'cible';
      this.refresh();
      return;
    }
    this.poser(carte, this.destination);
  }

  private deposer(zone: string): void {
    const carte = this.carteChoisie();
    if (!this.verrouille() && carte !== null) {
      this.poser(carte, zone);
    }
  }

  private poser(carte: OptionPublique, zone: string): void {
    const cible = this.zoneConnue(zone);
    const places = { ...this.places };
    if (cible === PIOCHE) {
      delete places[carte.id];
    } else {
      places[carte.id] = cible;
    }
    this.places = places;
    this.selection = null;
    this.derniere = carte.id;
    this.destination = cible;
    this.foyer = 'carte';
    this.message = `${carte.libelle} ${this.texte('cardsort-deplacee')} ${this.libelleZone(cible)}`;
    this.signalerBrouillon(this.interne?.id ?? '', { ...this.places });
    this.refresh();
  }

  private saisir(id: string): void {
    if (!this.verrouille()) {
      this.selection = id;
      this.deposee = false;
    }
  }

  private relacher(): void {
    if (this.deposee || this.selection === null || this.verrouille()) {
      return;
    }
    this.derniere = this.selection;
    this.foyer = 'carte';
    this.message = this.texte('cardsort-hors-cible');
    this.refresh();
  }

  private conclure(detail: Readonly<Record<string, unknown>>): void {
    this.soumis = true;
    this.selection = null;
    this.foyer = null;
    this.message = this.messageApresEnvoi();
    this.emit('fp-cardsort-submit', { ...detail, dureeMs: this.depuisAffichage() });
    this.refresh();
  }

  private valider(): void {
    const plan = this.interne;
    if (plan === null || this.verrouille()) {
      return;
    }
    if (plan.cartes.length === 0 || this.placees() !== plan.cartes.length) {
      this.message = this.texte(this.placees() === 0 ? 'production-vide' : 'cardsort-incomplet');
      this.foyer = null;
      this.refresh();
      return;
    }
    this.conclure({ planId: plan.id, classement: { ...this.places } });
  }

  private neSaitPas(): void {
    const plan = this.interne;
    if (plan !== null && !this.verrouille()) {
      this.conclure({ planId: plan.id, neSaitPas: true });
    }
  }
}
