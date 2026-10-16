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
      $localize`:@@formations.automatiser-avec-ia.w1.bullets.0: Vous dictez à ChatGPT : "prestation X, durée Y, tarif horaire Z" `,
      $localize`:@@formations.automatiser-avec-ia.w1.bullets.1: L'IA produit un texte formel + un tableau récapitulatif `,
      $localize`:@@formations.automatiser-avec-ia.w1.bullets.2: Vous copiez dans votre template Word/Google Docs existant `,
      $localize`:@@formations.automatiser-avec-ia.w1.bullets.3: Gain mesuré : de 25 min à 3 min par devis `,
    ],
    w2: [
      $localize`:@@formations.automatiser-avec-ia.w2.bullets.0: Vous listez vos 5 questions clients les plus fréquentes `,
      $localize`:@@formations.automatiser-avec-ia.w2.bullets.1: ChatGPT génère une réponse type personnalisable pour chaque `,
      $localize`:@@formations.automatiser-avec-ia.w2.bullets.2: Vous les enregistrez comme "réponses standard" dans Gmail `,
      $localize`:@@formations.automatiser-avec-ia.w2.bullets.3: Chaque email traité en 30 secondes au lieu de 5 minutes `,
    ],
    w3: [
      $localize`:@@formations.automatiser-avec-ia.w3.bullets.0: Vous listez 4 thèmes de la semaine (une réalisation, une astuce, un témoignage, un behind-the-scenes) `,
      $localize`:@@formations.automatiser-avec-ia.w3.bullets.1: ChatGPT produit 4 textes + 4 idées d'images `,
      $localize`:@@formations.automatiser-avec-ia.w3.bullets.2: Vous les programmez dans Buffer ou Metricool (gratuit jusqu'à 3 réseaux) `,
      $localize`:@@formations.automatiser-avec-ia.w3.bullets.3: Publication automatique, vous reprenez la main pour répondre aux commentaires `,
    ],
    w4: [
      $localize`:@@formations.automatiser-avec-ia.w4.bullets.0: Vous glissez une photo de facture dans ChatGPT (version gratuite avec limite quotidienne) `,
      $localize`:@@formations.automatiser-avec-ia.w4.bullets.1: L'IA retourne un tableau avec montant HT, TVA, TTC, date, fournisseur `,
      $localize`:@@formations.automatiser-avec-ia.w4.bullets.2: Copie-colle dans votre tableur / logiciel de compta `,
      $localize`:@@formations.automatiser-avec-ia.w4.bullets.3: 15 factures traitées en 10 minutes au lieu d'une heure `,
    ],
    w5: [
      $localize`:@@formations.automatiser-avec-ia.w5.bullets.0: Vous définissez 3 sujets clés (ex : "réglementation artisan BTP", "nouvelles aides BPI") `,
      $localize`:@@formations.automatiser-avec-ia.w5.bullets.1: Perplexity.ai fait la recherche web live et cite ses sources `,
      $localize`:@@formations.automatiser-avec-ia.w5.bullets.2: Vous enregistrez la conversation comme "veille hebdo" `,
      $localize`:@@formations.automatiser-avec-ia.w5.bullets.3: 5 minutes le lundi = vous êtes à jour sur toute la semaine `,
    ],
  };

  protected readonly constatStats = [
    {
      value: '13h',
      label: $localize`:@@formations.automatiser-avec-ia.constat.stats.0.label:par semaine en moyenne sur des tâches automatisables (devis, emails, réseaux sociaux)`,
      source: $localize`:@@formations.automatiser-avec-ia.constat.stats.0.source:Enquête BPI France / OpinionWay, 2025`,
    },
    {
      value: '72%',
      label: $localize`:@@formations.automatiser-avec-ia.constat.stats.1.label:des dirigeants de TPE disent manquer de temps pour développer leur activité`,
      source: $localize`:@@formations.automatiser-avec-ia.constat.stats.1.source:CPME, baromètre 2025`,
    },
    {
      value: '0 €',
      label: $localize`:@@formations.automatiser-avec-ia.constat.stats.2.label:c'est le budget IA nécessaire pour démarrer — les 5 workflows montrés tournent sur du gratuit`,
      source: $localize`:@@formations.automatiser-avec-ia.constat.stats.2.source:Benchmark asilidesign.fr, 2026`,
    },
  ];

  protected readonly parOuCommencerItems = [
    {
      title: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.0.title:Photographe`,
      description: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.0.description:Commencer par le workflow devis (W1). Chaque shooting a un cahier des charges similaire — l'IA économise 20 min par demande client.`,
    },
    {
      title: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.1.title:Coach / Consultant`,
      description: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.1.description:Workflow réseaux sociaux (W3). Capitaliser sur les notes de séances pour générer des posts authentiques sans y passer le week-end.`,
    },
    {
      title: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.2.title:Artisan / BTP`,
      description: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.2.description:Workflow factures (W4) + veille réglementaire (W5). Deux heures gagnées par semaine sur l'administratif et les normes.`,
    },
    {
      title: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.3.title:Commerce de proximité`,
      description: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.3.description:Workflow emails (W2) + réseaux (W3). Maintenir la relation clientèle à fréquence constante sans exploser le temps passé.`,
    },
    {
      title: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.4.title:Conseil B2B`,
      description: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.4.description:Workflow devis (W1) + veille (W5). Réponse sous 24h aux appels d'offres, veille pour nourrir les propositions.`,
    },
    {
      title: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.5.title:Association / Solopreneur`,
      description: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.5.description:Tous les workflows en séquence : commencer par W2 (emails), le plus vite rentable. Puis W3, W1, W4, W5.`,
    },
  ];

  protected readonly faqItems = [
    {
      title: $localize`:@@formations.automatiser-avec-ia.faq.items.0.title:Et si l'IA se trompe ?`,
      description: $localize`:@@formations.automatiser-avec-ia.faq.items.0.description:Elle se trompe, c'est une donnée. Chaque workflow contient une étape de relecture explicite. La règle : l'IA accélère, vous validez.`,
    },
    {
      title: $localize`:@@formations.automatiser-avec-ia.faq.items.1.title:Mes données sont-elles réutilisées ?`,
      description: $localize`:@@formations.automatiser-avec-ia.faq.items.1.description:Oui par défaut. Désactivez l'entraînement sur vos échanges dans les réglages de ChatGPT ou de Perplexity : 2 clics. RGPD OK.`,
    },
    {
      title: $localize`:@@formations.automatiser-avec-ia.faq.items.2.title:Faut-il apprendre à coder ?`,
      description: $localize`:@@formations.automatiser-avec-ia.faq.items.2.description:Non. Zéro ligne de code, zéro API, zéro webhook. Tout passe par des interfaces graphiques standards — si vous savez utiliser Word et Gmail, vous savez déjà.`,
    },
  ];

  protected readonly fonctionneItems = [
    $localize`:@@formations.automatiser-avec-ia.erreurs.rows.0.0:Automatiser 1 tâche à la fois, mesurer, puis en ajouter`,
    $localize`:@@formations.automatiser-avec-ia.erreurs.rows.1.0:Relire systématiquement avant d'envoyer au client`,
    $localize`:@@formations.automatiser-avec-ia.erreurs.rows.2.0:Outils gratuits en phase de test (ChatGPT, Perplexity, Buffer free)`,
    $localize`:@@formations.automatiser-avec-ia.erreurs.rows.3.0:Personnaliser l'IA avec VOS exemples (3 emails, 3 posts)`,
  ];

  protected readonly aEviterItems = [
    $localize`:@@formations.automatiser-avec-ia.erreurs.rows.0.1:Vouloir tout automatiser en une semaine — abandon garanti`,
    $localize`:@@formations.automatiser-avec-ia.erreurs.rows.1.1:Confier des emails sensibles à l'IA sans relecture`,
    $localize`:@@formations.automatiser-avec-ia.erreurs.rows.2.1:Payer un abonnement avant d'avoir validé le workflow`,
    $localize`:@@formations.automatiser-avec-ia.erreurs.rows.3.1:Accepter le ton robotique par défaut — on perd la personnalité`,
  ];

  protected readonly erreursColumns: ComparisonColumn[] = [
    {
      label: $localize`:@@formations.automatiser-avec-ia.erreurs.headers.0:Ce qui fonctionne`,
      tone: 'success',
      items: this.fonctionneItems,
    },
    {
      label: $localize`:@@formations.automatiser-avec-ia.erreurs.headers.1:À éviter au départ`,
      tone: 'danger',
      items: this.aEviterItems,
    },
  ];
}
