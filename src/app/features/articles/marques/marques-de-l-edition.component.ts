import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ItemDeSection } from '../../../core/models/article.model';
import { JourDuSitePipe } from '../../../shared/pipes/date-du-site.pipe';
import type { AnatomieDeLEdition, PartDeRubrique } from '../edition/anatomie-de-l-edition';
import { identiteDeRubrique } from '../edition/identite-des-rubriques';
import { siteDe } from '../edition/lecture-de-l-edition';

@Component({
  selector: 'app-picto-de-rubrique',
  standalone: true,
  template: `
    <span class="picto" [style.background-color]="identite().couleur" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false"><path [attr.d]="identite().picto" /></svg>
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    .picto {
      display: inline-grid;
      place-items: center;
      width: var(--taille-du-picto, 1.75rem);
      height: var(--taille-du-picto, 1.75rem);
      border-radius: 0.5rem;
    }
    svg {
      width: 62%;
      height: 62%;
      fill: none;
      stroke: var(--cream);
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PictoDeRubriqueComponent {
  readonly id = input.required<string>();
  protected readonly identite = computed(() => identiteDeRubrique(this.id(), ''));
}

@Component({
  selector: 'app-bande-des-rubriques',
  standalone: true,
  template: `
    <div
      class="bande"
      [class.bande--fine]="fine()"
      role="img"
      [attr.aria-label]="description()"
      data-testid="bande-des-rubriques"
    >
      @for (part of parts(); track part.id) {
        <span
          class="bande__segment"
          [style.flex-grow]="part.nombre"
          [style.background-color]="couleur(part)"
        ></span>
      }
    </div>
    @if (legende()) {
      <ul class="legende" data-testid="legende-des-rubriques">
        @for (part of parts(); track part.id) {
          <li>
            <span class="legende__pastille" [style.background-color]="couleur(part)"></span>
            <span class="legende__libelle">{{ libelle(part) }}</span>
            <span class="legende__nombre">{{ part.nombre }}</span>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .bande {
      display: flex;
      gap: 2px;
      height: 8px;
    }
    .bande--fine {
      height: 4px;
    }
    .bande__segment {
      flex-basis: 0;
      min-width: 4px;
    }
    .bande__segment:first-child {
      border-radius: 4px 0 0 4px;
    }
    .bande__segment:last-child {
      border-radius: 0 4px 4px 0;
    }
    .bande__segment:only-child {
      border-radius: 4px;
    }
    .legende {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1.25rem;
      margin: 0.85rem 0 0;
      padding: 0;
      list-style: none;
      color: var(--text);
      font-size: 0.875rem;
    }
    .legende li {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
    }
    .legende__pastille {
      width: 0.6rem;
      height: 0.6rem;
      border-radius: 50%;
    }
    .legende__nombre {
      color: var(--text-mute);
      font-variant-numeric: tabular-nums;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BandeDesRubriquesComponent {
  readonly parts = input.required<readonly PartDeRubrique[]>();
  readonly legende = input(false);
  readonly fine = input(false);

  protected readonly description = computed(() => {
    const liste = this.parts()
      .map((part) => `${this.libelle(part)} ${part.nombre}`)
      .join(', ');
    return $localize`:@@articlesBandeDescription:Informations par rubrique : ${liste}:liste:`;
  });

  protected couleur(part: PartDeRubrique): string {
    return identiteDeRubrique(part.id, part.titre).couleur;
  }

  protected libelle(part: PartDeRubrique): string {
    return identiteDeRubrique(part.id, part.titre).libelle;
  }
}

@Component({
  selector: 'app-compteurs-de-l-edition',
  standalone: true,
  template: `
    <span class="compteur" i18n="@@articlesCompteurInformations">{anatomie().informations, plural,
      =0 {0 information}
      =1 {1 information}
      other {{{ anatomie().informations }} informations}
    }</span>
    &ngsp;<span class="separateur" aria-hidden="true">·</span>&ngsp;
    <span class="compteur" i18n="@@articlesCompteurSources">{anatomie().publications, plural,
      =0 {0 source}
      =1 {1 source}
      other {{{ anatomie().publications }} sources}
    }</span>
    @if (anatomie().minutes; as minutes) {
      &ngsp;<span class="separateur" aria-hidden="true">·</span>&ngsp;
      <span class="compteur" i18n="@@articlesCompteurMinutes">{{ minutes }} min de lecture</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 0 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompteursDeLEditionComponent {
  readonly anatomie = input.required<AnatomieDeLEdition>();
}

@Component({
  selector: 'app-provenance',
  standalone: true,
  imports: [JourDuSitePipe],
  template: `
    <a class="provenance" [href]="item().url" rel="noopener noreferrer" data-testid="provenance">
      <span class="provenance__publication">{{ item().source }}</span
      >&ngsp;
      @if (!courte()) {
        @if (site(); as site) {
          <span class="provenance__site">{{ site }}</span
          >&ngsp;
        }
        @if (item().published_at; as date) {
          <time class="provenance__date" [attr.datetime]="date">{{
            date | jourDuSite: 'court'
          }}</time
          >&ngsp;
        }
      }
      <span class="provenance__fleche" aria-hidden="true">↗</span>
    </a>
  `,
  styles: `
    .provenance {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0 0.4rem;
      color: var(--teal-ink);
      font-size: 0.8125rem;
      text-decoration: none;
    }
    .provenance:hover .provenance__publication,
    .provenance:focus-visible .provenance__publication {
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    .provenance__publication {
      font-weight: 600;
    }
    .provenance__site,
    .provenance__date {
      color: var(--text-mute);
    }
    .provenance__site::before,
    .provenance__date::before {
      content: '·';
      margin-right: 0.4rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProvenanceComponent {
  readonly item = input.required<ItemDeSection>();
  readonly courte = input(false);
  protected readonly site = computed(() => siteDe(this.item().url));
}
