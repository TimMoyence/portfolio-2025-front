import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ItemDeSection } from '../../../core/models/article.model';
import { JourDuSitePipe } from '../../../shared/pipes/date-du-site.pipe';
import type { AnatomieDeLEdition } from '../edition/anatomie-de-l-edition';
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
