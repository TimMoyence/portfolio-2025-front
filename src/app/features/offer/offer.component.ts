import { ChangeDetectionStrategy, Component, LOCALE_ID, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FiletDeSectionDirective } from '../../shared/directives/filet-de-section.directive';
import type { BesoinDeContact } from '../../shared/offre/besoins';
import { delaiDeMiseEnLigne, faqDuSite, prixPlancher } from '../../shared/offre/prix-et-delai';
import { ENGAGEMENTS_INCLUS } from '../../shared/offre/socle-et-elan';
import {
  type AsiliClosing,
  AsiliClosingComponent,
  AsiliHeroComponent,
  type AsiliProject,
  AsiliProjectsGridComponent,
  IllustrationDuHerosComponent,
  type MorceauDeTitre,
  SocleEtElanComponent,
} from '../../shared/sections';
import { carteDeRealisation, REALISATIONS } from '../projets/realisations.data';

interface Formule {
  readonly titre: string;
  readonly promesse: string;
  readonly prix: readonly string[];
  readonly besoin: BesoinDeContact;
}

@Component({
  selector: 'app-offer',
  standalone: true,
  imports: [
    RouterLink,
    AsiliHeroComponent,
    IllustrationDuHerosComponent,
    SocleEtElanComponent,
    AsiliProjectsGridComponent,
    AsiliClosingComponent,
    FiletDeSectionDirective,
  ],
  templateUrl: './offer.component.html',
  styleUrl: './offer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferComponent {
  private readonly locale = inject(LOCALE_ID);

  protected readonly titre: readonly MorceauDeTitre[] = [
    { texte: $localize`:@@offreTitre:Créer mon site` },
  ];

  protected readonly heroKicker = $localize`:@@offreKicker:Votre site, de A à Z`;

  protected readonly heroLead = $localize`:@@offreAccroche:Un site qui dit ce que vous faites, qu’on trouve sur Google et dans les réponses des IA, et qui fait appeler. Je l’écris avec vous, je le construis, puis je vous apprends à le faire vivre.`;

  private readonly surDevis = $localize`:@@offreSurDevis:Sur devis`;

  protected readonly formules: readonly Formule[] = [
    {
      titre: $localize`:@@offreVitrineTitre:Site vitrine`,
      promesse: $localize`:@@offreVitrinePromesse:Quelques pages claires qui présentent votre métier et font appeler.`,
      prix: [prixPlancher(this.locale), delaiDeMiseEnLigne()],
      besoin: 'creer',
    },
    {
      titre: $localize`:@@offreReservationTitre:Site + réservation`,
      promesse: $localize`:@@offreReservationPromesse:Votre site, avec la prise de rendez-vous ou la réservation en ligne.`,
      prix: [this.surDevis],
      besoin: 'creer',
    },
    {
      titre: $localize`:@@offreAppTitre:App mobile`,
      promesse: $localize`:@@offreAppPromesse:Une application pour vos clients ou vos équipes, sur iPhone et Android.`,
      prix: [this.surDevis],
      besoin: 'app-mobile',
    },
  ];

  protected readonly methodeKicker = $localize`:@@offreMethodeKicker:La méthode`;

  protected readonly engagements = ENGAGEMENTS_INCLUS;

  protected readonly apercuKicker = $localize`:@@offreApercuKicker:Déjà en ligne`;

  protected readonly apercu: readonly AsiliProject[] = REALISATIONS.filter(
    ({ famille }) => famille === 'sites',
  ).map(carteDeRealisation);

  protected readonly closing: AsiliClosing = {
    faq: {
      kicker: $localize`:@@offerFaqKicker:Questions fréquentes`,
      title: $localize`:@@offerFaqTitle:Avant de se lancer.`,
      items: [
        ...faqDuSite(this.locale),
        {
          question: $localize`:@@offreFaqRepriseQuestion:Pouvez-vous reprendre mon site actuel ?`,
          reponse: $localize`:@@offreFaqRepriseReponse:Oui. Je garde ce qui fonctionne, je refais le reste, et vos visiteurs ne perdent pas leurs repères. Le diagnostic gratuit est un bon point de départ.`,
        },
        {
          question: $localize`:@@offerFaq4Q:Travaillez-vous à distance ?`,
          reponse: $localize`:@@offerFaq4A:Basé à Bordeaux, je travaille avec des clients partout en France, à distance comme en présentiel selon les besoins. La proximité humaine ne dépend pas de la géographie.`,
        },
      ],
    },
    cta: {
      kicker: $localize`:@@offreAppelKicker:Prêt à vous lancer ?`,
      title: $localize`:@@offreAppelTitre:Décrivez votre métier. Je vous réponds avec une proposition claire.`,
      actions: [
        {
          libelle: $localize`:@@offerCtaPrimary:Démarrer la conversation`,
          lien: '/contact',
          variante: 'principale',
        },
        {
          libelle: $localize`:@@offerCtaSecondary:Voir les réalisations`,
          lien: '/projets',
          variante: 'secondaire',
        },
      ],
    },
  };
}
