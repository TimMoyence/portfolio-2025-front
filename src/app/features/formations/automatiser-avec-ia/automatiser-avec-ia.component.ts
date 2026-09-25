import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { ComparisonColumn } from '../../../shared/slides';
import { DECK_FORMATION } from '../shared/deck-formation';

@Component({
  selector: 'app-automatiser-avec-ia',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DECK_FORMATION],
  templateUrl: './automatiser-avec-ia.component.html',
  styleUrl: './automatiser-avec-ia.component.scss',
})
export class AutomatiserAvecIaComponent {
  protected readonly puces = {
    w1: [
      $localize`:@@formations.automatiser-avec-ia.w1.bullets.0: Vous dictez a ChatGPT : "prestation X, duree Y, tarif horaire Z" `,
      $localize`:@@formations.automatiser-avec-ia.w1.bullets.1: L'IA produit un texte formel + un tableau recapitulatif `,
      $localize`:@@formations.automatiser-avec-ia.w1.bullets.2: Vous copiez dans votre template Word/Google Docs existant `,
      $localize`:@@formations.automatiser-avec-ia.w1.bullets.3: Gain mesure : de 25 min a 3 min par devis `,
    ],
    w2: [
      $localize`:@@formations.automatiser-avec-ia.w2.bullets.0: Vous listez vos 5 questions clients les plus frequentes `,
      $localize`:@@formations.automatiser-avec-ia.w2.bullets.1: ChatGPT genere une reponse type personnalisable pour chaque `,
      $localize`:@@formations.automatiser-avec-ia.w2.bullets.2: Vous les enregistrez comme "reponses standard" dans Gmail `,
      $localize`:@@formations.automatiser-avec-ia.w2.bullets.3: Chaque email traite en 30 secondes au lieu de 5 minutes `,
    ],
    w3: [
      $localize`:@@formations.automatiser-avec-ia.w3.bullets.0: Vous listez 4 themes de la semaine (une realisation, une astuce, un temoignage, un behind-the-scenes) `,
      $localize`:@@formations.automatiser-avec-ia.w3.bullets.1: ChatGPT produit 4 textes + 4 idees d'images `,
      $localize`:@@formations.automatiser-avec-ia.w3.bullets.2: Vous les programmez dans Buffer ou Metricool (gratuit jusqu'a 3 reseaux) `,
      $localize`:@@formations.automatiser-avec-ia.w3.bullets.3: Publication automatique, vous reprenez la main pour repondre aux commentaires `,
    ],
    w4: [
      $localize`:@@formations.automatiser-avec-ia.w4.bullets.0: Vous glissez une photo de facture dans ChatGPT (version gratuite avec limite quotidienne) `,
      $localize`:@@formations.automatiser-avec-ia.w4.bullets.1: L'IA retourne un tableau avec montant HT, TVA, TTC, date, fournisseur `,
      $localize`:@@formations.automatiser-avec-ia.w4.bullets.2: Copie-colle dans votre tableur / logiciel de compta `,
      $localize`:@@formations.automatiser-avec-ia.w4.bullets.3: 15 factures traitees en 10 minutes au lieu d'une heure `,
    ],
    w5: [
      $localize`:@@formations.automatiser-avec-ia.w5.bullets.0: Vous definissez 3 sujets cles (ex : "reglementation artisan BTP", "nouvelles aides BPI") `,
      $localize`:@@formations.automatiser-avec-ia.w5.bullets.1: Perplexity.ai fait la recherche web live et cite ses sources `,
      $localize`:@@formations.automatiser-avec-ia.w5.bullets.2: Vous enregistrez la conversation comme "veille hebdo" `,
      $localize`:@@formations.automatiser-avec-ia.w5.bullets.3: 5 minutes le lundi = vous etes a jour sur toute la semaine `,
    ],
  };

  protected readonly constatStats = [
    {
      value: '13h',
      label: $localize`:@@formations.automatiser-avec-ia.constat.stats.0.label:par semaine en moyenne sur des taches automatisables (devis, emails, reseaux sociaux)`,
      source: $localize`:@@formations.automatiser-avec-ia.constat.stats.0.source:Enquete BPI France / OpinionWay, 2025`,
    },
    {
      value: '72%',
      label: $localize`:@@formations.automatiser-avec-ia.constat.stats.1.label:des dirigeants de TPE disent manquer de temps pour developper leur activite`,
      source: $localize`:@@formations.automatiser-avec-ia.constat.stats.1.source:CPME, barometre 2025`,
    },
    {
      value: '0 €',
      label: $localize`:@@formations.automatiser-avec-ia.constat.stats.2.label:c'est le budget IA necessaire pour demarrer — les 5 workflows montres tournent sur du gratuit`,
      source: $localize`:@@formations.automatiser-avec-ia.constat.stats.2.source:Benchmark asilidesign.fr, 2026`,
    },
  ];

  protected readonly parOuCommencerItems = [
    {
      title: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.0.title:Photographe`,
      description: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.0.description:Commencer par le workflow devis (W1). Chaque shooting a un cahier des charges similaire — l'IA economise 20 min par demande client.`,
    },
    {
      title: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.1.title:Coach / Consultant`,
      description: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.1.description:Workflow reseaux sociaux (W3). Capitaliser sur les notes de seances pour generer des posts authentiques sans y passer le week-end.`,
    },
    {
      title: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.2.title:Artisan / BTP`,
      description: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.2.description:Workflow factures (W4) + veille reglementaire (W5). Deux heures gagnees par semaine sur l'administratif et les normes.`,
    },
    {
      title: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.3.title:Commerce de proximite`,
      description: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.3.description:Workflow emails (W2) + reseaux (W3). Maintenir la relation clientele a frequence constante sans exploser le temps passe.`,
    },
    {
      title: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.4.title:Conseil B2B`,
      description: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.4.description:Workflow devis (W1) + veille (W5). Reponse sous 24h aux appels d'offres, veille pour nourrir les propositions.`,
    },
    {
      title: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.5.title:Association / Solopreneur`,
      description: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.5.description:Tous les workflows en sequence : commencer par W2 (emails), le plus vite rentable. Puis W3, W1, W4, W5.`,
    },
  ];

  protected readonly faqItems = [
    {
      title: $localize`:@@formations.automatiser-avec-ia.faq.items.0.title:Et si l'IA se trompe ?`,
      description: $localize`:@@formations.automatiser-avec-ia.faq.items.0.description:Elle se trompe, c'est une donnee. Chaque workflow contient une etape de relecture explicite. La regle : l'IA accelere, vous validez.`,
    },
    {
      title: $localize`:@@formations.automatiser-avec-ia.faq.items.1.title:Mes donnees sont-elles reutilisees ?`,
      description: $localize`:@@formations.automatiser-avec-ia.faq.items.1.description:Oui par defaut. Le toolkit indique comment desactiver l'entrainement sur vos echanges (ChatGPT, Perplexity) en 2 clics. RGPD OK.`,
    },
    {
      title: $localize`:@@formations.automatiser-avec-ia.faq.items.2.title:Faut-il apprendre a coder ?`,
      description: $localize`:@@formations.automatiser-avec-ia.faq.items.2.description:Non. Zero ligne de code, zero API, zero webhook. Tout passe par des interfaces graphiques standards — si vous savez utiliser Word et Gmail, vous savez deja.`,
    },
  ];

  protected readonly fonctionneItems = [
    $localize`:@@formations.automatiser-avec-ia.erreurs.rows.0.0:Automatiser 1 tache a la fois, mesurer, puis en ajouter`,
    $localize`:@@formations.automatiser-avec-ia.erreurs.rows.1.0:Relire systematiquement avant d'envoyer au client`,
    $localize`:@@formations.automatiser-avec-ia.erreurs.rows.2.0:Outils gratuits en phase de test (ChatGPT, Perplexity, Buffer free)`,
    $localize`:@@formations.automatiser-avec-ia.erreurs.rows.3.0:Personnaliser l'IA avec VOS exemples (3 emails, 3 posts)`,
  ];

  protected readonly aEviterItems = [
    $localize`:@@formations.automatiser-avec-ia.erreurs.rows.0.1:Vouloir tout automatiser en une semaine — abandon garanti`,
    $localize`:@@formations.automatiser-avec-ia.erreurs.rows.1.1:Confier des emails sensibles a l'IA sans relecture`,
    $localize`:@@formations.automatiser-avec-ia.erreurs.rows.2.1:Payer un abonnement avant d'avoir valide le workflow`,
    $localize`:@@formations.automatiser-avec-ia.erreurs.rows.3.1:Accepter le ton robotique par defaut — on perd la personnalite`,
  ];

  protected readonly erreursColumns: ComparisonColumn[] = [
    {
      label: $localize`:@@formations.automatiser-avec-ia.erreurs.headers.0:Ce qui fonctionne`,
      tone: 'success',
      items: this.fonctionneItems,
    },
    {
      label: $localize`:@@formations.automatiser-avec-ia.erreurs.headers.1:A eviter au depart`,
      tone: 'danger',
      items: this.aEviterItems,
    },
  ];
}
