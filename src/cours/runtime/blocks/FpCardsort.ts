import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { shuffleWithSeed } from '../core/seed';
import { FpBlock } from './FpBlock';
import { type OptionPublique, projeterMetadonnees, projeterOptions } from './projection';

export interface CardsortPlanPublic {
  readonly id: string;
  readonly intitule: string;
  readonly cartes: readonly OptionPublique[];
  readonly categories: readonly OptionPublique[];
  readonly metadonnees: MetadonneesBrique;
}

export interface AppariementAttendu {
  readonly carteId: string;
  readonly categorieId: string;
}

export interface CardsortPlan extends CardsortPlanPublic {
  readonly attendus: readonly AppariementAttendu[];
}

type Foyer = 'carte' | 'cible' | null;

const PIOCHE = '';
const VIDE = escapeHtml('');
const DESACTIVE = safeHtml`disabled`;
const RETENU = safeHtml`selected`;
const TOUCHES_ACTION: readonly string[] = ['Enter', ' '];

function copierPlan(source: CardsortPlanPublic): CardsortPlanPublic {
  return {
    id: source.id,
    intitule: source.intitule,
    cartes: projeterOptions(source.cartes),
    categories: projeterOptions(source.categories),
    metadonnees: projeterMetadonnees(source.metadonnees),
  };
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

  set plan(valeur: CardsortPlanPublic | null) {
    this.interne = valeur === null ? null : copierPlan(valeur);
    this.places = {};
    this.selection = null;
    this.derniere = null;
    this.destination = PIOCHE;
    this.foyer = null;
    this.message = '';
    this.soumis = false;
    this.refreshSiConnecte();
  }

  get plan(): CardsortPlanPublic | null {
    return this.interne;
  }

  get classement(): Readonly<Record<string, string>> {
    return { ...this.places };
  }

  renderHand(): EscapedHtml {
    const plan = this.interne;
    if (plan === null) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    return safeHtml`
      <section class="fp-carte fp-cardsort__atelier">
        <p class="fp-enonce fp-cardsort__intitule">${escapeHtml(plan.intitule)}</p>
        <p class="fp-cardsort__consigne">${escapeHtml(this.texte('cardsort-consigne'))}</p>
        ${this.plateau(true)}
        ${this.pilote()}
        <button type="button" class="fp-cardsort__valider" data-testid="valider" ${this.soumis ? DESACTIVE : VIDE}>${escapeHtml(this.texte('valider'))}</button>
        <p class="fp-cardsort__annonce" role="status" aria-live="polite" data-testid="annonce">${escapeHtml(this.message)}</p>
      </section>
    `;
  }

  renderStage(): EscapedHtml {
    if (this.interne === null) {
      return safeHtml``;
    }
    return safeHtml`<section class="fp-scene fp-cardsort__atelier">${this.plateau(false)}</section>`;
  }

  renderBoard(): EscapedHtml {
    const plan = this.interne;
    if (plan === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    return safeHtml`
      <section class="fp-carte fp-cardsort__atelier">
        <p class="fp-enonce fp-cardsort__intitule">${escapeHtml(plan.intitule)}</p>
        <p class="fp-cardsort__progression" data-testid="progression">${escapeHtml(this.texte('cardsort-progression'))} ${this.placees()} / ${plan.cartes.length}</p>
        <div class="fp-cardsort__reperes">
          <span class="fp-badge" data-testid="modalite">${escapeHtml(plan.metadonnees.modalite)}</span>
          <span class="fp-badge" data-testid="duree">${plan.metadonnees.dureeMinutes} min</span>
        </div>
      </section>
    `;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.interne?.id ?? null);
    if (this.mode() !== 'hand') {
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
    if (id === this.derniere && this.foyer === 'carte' && !this.soumis) {
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
    cible.disabled = this.soumis;
    cible.addEventListener('change', () => {
      this.destination = cible.value;
    });
    if (this.foyer === 'cible' && !this.soumis) {
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
    return this.zoneConnue(this.places[carte] ?? PIOCHE);
  }

  private cartesDe(zone: string): readonly OptionPublique[] {
    return shuffleWithSeed(this.interne?.cartes ?? [], this.seed()).filter(
      (carte) => this.zoneDe(carte.id) === zone,
    );
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
      <section class="fp-cardsort__zone" data-testid="zone" aria-labelledby="${escapeHtml(repere)}">
        <h3 class="fp-cardsort__titre" id="${escapeHtml(repere)}">${escapeHtml(zone.libelle)} <span class="fp-cardsort__compte fp-montant" data-testid="compte">${cartes.length}</span></h3>
        <ul class="fp-cardsort__pile" data-testid="pile" data-zone="${escapeHtml(zone.id)}">${cartes.map((carte) => this.place(carte, zone, interactif))}</ul>
      </section>
    `;
  }

  private place(carte: OptionPublique, zone: OptionPublique, interactif: boolean): EscapedHtml {
    const enonce = `${carte.libelle} — ${zone.libelle}`;
    if (!interactif) {
      return safeHtml`<li class="fp-cardsort__place"><span class="fp-carte fp-cardsort__carte" data-testid="carte" data-carte="${escapeHtml(carte.id)}">${escapeHtml(carte.libelle)}</span></li>`;
    }
    const choisie = carte.id === this.selection;
    return safeHtml`<li class="fp-cardsort__place"><button type="button" class="fp-carte fp-cardsort__carte" data-testid="carte" data-carte="${escapeHtml(carte.id)}" draggable="true" aria-pressed="${escapeHtml(choisie)}" aria-label="${escapeHtml(enonce)}" ${this.soumis ? DESACTIVE : VIDE}>${escapeHtml(carte.libelle)}</button></li>`;
  }

  private pilote(): EscapedHtml {
    return safeHtml`
      <p class="fp-cardsort__pilote">
        <label class="fp-cardsort__etiquette" for="fp-cardsort-cible">${escapeHtml(this.texte('cardsort-destination'))}</label>
        <select class="fp-cardsort__cible" id="fp-cardsort-cible" data-testid="cible">${this.zones().map((zone) => this.choix(zone))}</select>
        <button type="button" class="fp-cardsort__deplacer" data-testid="deplacer" ${this.soumis ? DESACTIVE : VIDE}>${escapeHtml(this.texte('cardsort-deplacer'))}</button>
      </p>
    `;
  }

  private choix(zone: OptionPublique): EscapedHtml {
    return safeHtml`<option value="${escapeHtml(zone.id)}" ${zone.id === this.destination ? RETENU : VIDE}>${escapeHtml(zone.libelle)}</option>`;
  }

  private choisir(id: string): void {
    if (this.soumis) {
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
    if (this.soumis) {
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
    if (!this.soumis && carte !== null) {
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
    this.refresh();
  }

  private saisir(id: string): void {
    if (!this.soumis) {
      this.selection = id;
      this.deposee = false;
    }
  }

  private relacher(): void {
    if (this.deposee || this.selection === null || this.soumis) {
      return;
    }
    this.derniere = this.selection;
    this.foyer = 'carte';
    this.message = this.texte('cardsort-hors-cible');
    this.refresh();
  }

  private valider(): void {
    const plan = this.interne;
    if (plan === null || this.soumis) {
      return;
    }
    if (plan.cartes.length === 0 || this.placees() !== plan.cartes.length) {
      this.message = this.texte('cardsort-incomplet');
      this.foyer = null;
      this.refresh();
      return;
    }
    this.soumis = true;
    this.selection = null;
    this.foyer = null;
    this.message = this.texte('reponse-enregistree');
    this.emit('fp-cardsort-submit', {
      planId: plan.id,
      classement: { ...this.places },
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }
}
