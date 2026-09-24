import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  AsiliCtaBandComponent,
  type AsiliCtaAction,
  AsiliHeroComponent,
  AsiliMethodComponent,
  type AsiliMethodStep,
  type AsiliProject,
  AsiliProjectsGridComponent,
} from '../../shared/sections';

@Component({
  selector: 'app-projets',
  standalone: true,
  imports: [
    AsiliHeroComponent,
    AsiliProjectsGridComponent,
    AsiliMethodComponent,
    AsiliCtaBandComponent,
  ],
  templateUrl: './projets.component.html',
  styleUrl: './projets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjetsComponent {
  protected readonly heroKicker = $localize`:@@projetsHeroKicker:Réalisations`;

  protected readonly heroLead = $localize`:@@projetsHeroLead:Chaque projet part d'un besoin réel et finit par un outil qui tient dans le temps. Voici des réalisations web, métier et IA construites sur des situations concrètes.`;

  protected readonly projects: readonly AsiliProject[] = [
    {
      size: 'small',
      tags: [
        { label: $localize`:@@projetsProject4Tag1:En production`, prod: true },
        { label: $localize`:@@projetsProject4Tag2:Raspberry Pi` },
      ],
      title: $localize`:@@projetsProject4Title:Morning-Brief`,
      desc: $localize`:@@projetsProject4Desc:Newsletter IA : 50+ sources agrégées, dédupliquées, synthétisées, livrées chaque matin par Telegram. 24/7 sur un Raspberry Pi.`,
      caseStudy: {
        context: $localize`:@@projetsProject4CaseContext:Une veille technique quotidienne devait fonctionner sans surveillance sur un Raspberry Pi.`,
        problem: $localize`:@@projetsProject4CaseProblem:Les sources étaient nombreuses, redondantes et trop longues à trier manuellement.`,
        solution: $localize`:@@projetsProject4CaseSolution:Une chaîne collecte, déduplique, synthétise et livre une édition sourcée par Telegram.`,
        role: $localize`:@@projetsProject4CaseRole:Conception du produit, du pipeline éditorial et de son exploitation.`,
        result: $localize`:@@projetsProject4CaseResult:50+ sources sont traitées et une édition arrive chaque matin sans intervention.`,
      },
      image: '/assets/images/projects/morning-brief.webp',
      imageAlt: $localize`:@@projetsProject4ImageAlt:illustration — Morning-Brief`,
    },
    {
      size: 'big',
      tags: [
        { label: $localize`:@@projetsProject5Tag1:En production`, prod: true },
        { label: $localize`:@@projetsProject5Tag2:Automatisation` },
        { label: $localize`:@@projetsProject5Tag3:Telegram` },
      ],
      title: $localize`:@@projetsProject5Title:IFS Academy`,
      desc: $localize`:@@projetsProject5Desc:Audit d'appartenance aux groupes, relances automatiques, liens d'invitation signés, parcours d'onboarding multi-étapes et récap quotidien par email. Accueille des centaines d'élèves sans intervention manuelle.`,
      caseStudy: {
        context: $localize`:@@projetsProject5CaseContext:Une académie accueillait des centaines d’élèves dans plusieurs groupes Telegram.`,
        problem: $localize`:@@projetsProject5CaseProblem:Les vérifications d’accès et les relances consommaient du temps et créaient des oublis.`,
        solution: $localize`:@@projetsProject5CaseSolution:Un parcours signé vérifie les groupes, relance les inscrits et consolide les états par email.`,
        role: $localize`:@@projetsProject5CaseRole:Architecture, développement backend, automatisations et intégration Telegram.`,
        result: $localize`:@@projetsProject5CaseResult:L’onboarding multi-étapes fonctionne sans intervention manuelle au quotidien.`,
      },
      image: '/assets/images/projects/IFS-Academy.webp',
      imageAlt: $localize`:@@projetsProject5ImageAlt:capture — Onboarding Telegram IFS`,
    },
    {
      size: 'small',
      tags: [
        { label: $localize`:@@projetsProject6Tag1:Mobile` },
        { label: $localize`:@@projetsProject6Tag2:Multi-LLM` },
      ],
      title: $localize`:@@projetsProject6Title:InnovMind`,
      desc: $localize`:@@projetsProject6Desc:Produit de médiation culturelle par l'IA : reconnaissance d'œuvres par photo, chat contextuel et réponses multilingues.`,
      caseStudy: {
        context: $localize`:@@projetsProject6CaseContext:Un parcours culturel mobile devait rendre une œuvre compréhensible sur place.`,
        problem: $localize`:@@projetsProject6CaseProblem:Une notice statique ne répondait ni au contexte de la photo ni aux questions du visiteur.`,
        solution: $localize`:@@projetsProject6CaseSolution:Une reconnaissance visuelle ouvre un chat contextualisé et multilingue autour de l’œuvre.`,
        role: $localize`:@@projetsProject6CaseRole:Co-conception du produit InnovMind, intégration des modèles et développement mobile/web.`,
        result: $localize`:@@projetsProject6CaseResult:Le visiteur passe de la photo à une médiation personnalisée en quelques secondes.`,
      },
      image: '/assets/images/projects/Assistant-mediation-culturelle.webp',
      imageAlt: $localize`:@@projetsProject6ImageAlt:illustration — InnovMind`,
    },
    {
      size: 'big',
      tags: [
        { label: $localize`:@@projetsProject7Tag1:En production`, prod: true },
        { label: $localize`:@@projetsProject7Tag2:Outil métier` },
        { label: $localize`:@@projetsProject7Tag3:Traçabilité` },
      ],
      title: $localize`:@@projetsProject7Title:Gestion de chais`,
      desc: $localize`:@@projetsProject7Desc:Suivi de la production de la vigne à la mise en bouteille : centralisation des informations, traçabilité complète, accompagnement des usages métier au quotidien.`,
      caseStudy: {
        context: $localize`:@@projetsProject7CaseContext:Un producteur devait suivre ses opérations de la vigne à la mise en bouteille.`,
        problem: $localize`:@@projetsProject7CaseProblem:Les informations métier dispersées rendaient la traçabilité difficile à maintenir.`,
        solution: $localize`:@@projetsProject7CaseSolution:Un outil métier centralise les étapes, les données de production et les historiques.`,
        role: $localize`:@@projetsProject7CaseRole:Cadrage des usages, conception produit et développement de la plateforme.`,
        result: $localize`:@@projetsProject7CaseResult:La traçabilité devient exploitable au quotidien et accompagne les pratiques terrain.`,
      },
      image: '/assets/images/projects/GDC-presentation.webp',
      imageAlt: $localize`:@@projetsProject7ImageAlt:capture — Gestion de chais de Cognac`,
    },
    {
      size: 'small',
      tags: [
        { label: $localize`:@@projetsProject8Tag1:En production`, prod: true },
        { label: $localize`:@@projetsProject8Tag2:Web sur-mesure` },
      ],
      title: $localize`:@@projetsProject8Title:Slide-Shot`,
      desc: $localize`:@@projetsProject8Desc:Outil local qui transforme un PDF de présentation en images PNG haute définition, avec sélection de slides, export 300 DPI et nommage sans écrasement.`,
      caseStudy: {
        context: $localize`:@@projetsProject8CaseContext:La préparation d’un support demandait de convertir et renommer les slides manuellement.`,
        problem: $localize`:@@projetsProject8CaseProblem:Les exports ponctuels perdaient du temps et risquaient d’écraser des fichiers existants.`,
        solution: $localize`:@@projetsProject8CaseSolution:Une interface locale permet de sélectionner les pages et d’exporter des PNG nommés de façon déterministe.`,
        role: $localize`:@@projetsProject8CaseRole:Conception du produit, orchestration du rendu PDF et sécurisation du flux local.`,
        result: $localize`:@@projetsProject8CaseResult:Un support devient exploitable en quelques clics sans envoyer le document sur un serveur.`,
      },
      image: '/assets/images/projects/Automation-validation.webp',
      imageAlt: $localize`:@@projetsProject8ImageAlt:illustration — Slide-Shot`,
    },
    {
      size: 'small',
      tags: [
        { label: $localize`:@@projetsProject9Tag1:MMO web` },
        { label: $localize`:@@projetsProject9Tag2:Simulation` },
      ],
      title: $localize`:@@projetsProject9Title:Fourmizzz Suite`,
      desc: $localize`:@@projetsProject9Desc:Suite de conception d'un MMO myrmécologique : simulation persistante, espèces asymétriques, météo, biomes et territoires sur une carte réelle.`,
      caseStudy: {
        context: $localize`:@@projetsProject9CaseContext:Fourmizzz Suite devait transformer une simulation myrmécologique en produit web réellement jouable.`,
        problem: $localize`:@@projetsProject9CaseProblem:Une simulation riche risquait de devenir illisible sans monde vivant ni règles visibles.`,
        solution: $localize`:@@projetsProject9CaseSolution:Un MMO web combine espèces asymétriques, météo, biomes et territoires temps réel.`,
        role: $localize`:@@projetsProject9CaseRole:Conception des mécaniques, architecture web et développement de la simulation.`,
        result: $localize`:@@projetsProject9CaseResult:Le périmètre produit relie simulation, monde persistant et choix stratégiques différenciés.`,
      },
      image: '/assets/images/projects/jeu-des-fourmis.webp',
      imageAlt: $localize`:@@projetsProject9ImageAlt:illustration — Fourmizzz Suite`,
    },
    {
      size: 'small',
      tags: [
        { label: $localize`:@@projetsProject10Tag1:SSE` },
        { label: $localize`:@@projetsProject10Tag2:LangChain` },
      ],
      title: $localize`:@@projetsProject10Title:Schema-Atlas`,
      desc: $localize`:@@projetsProject10Desc:Produit qui rend un schéma de base de données lisible : domaines, relations, diagrammes déterministes et détail des tables.`,
      caseStudy: {
        context: $localize`:@@projetsProject10CaseContext:Une équipe devait comprendre un schéma de données sans parcourir seule des centaines de lignes.`,
        problem: $localize`:@@projetsProject10CaseProblem:Un diagramme unique devenait illisible et perdait les commentaires métier du schéma.`,
        solution: $localize`:@@projetsProject10CaseSolution:Schema-Atlas dérive une carte des domaines, des diagrammes par domaine et le détail d’une table.`,
        role: $localize`:@@projetsProject10CaseRole:Conception produit, noyau déterministe et architecture API/web.`,
        result: $localize`:@@projetsProject10CaseResult:Le modèle devient navigable, diffable et exploitable par une équipe produit.`,
      },
      image: '/assets/images/projects/growth-audit.webp',
      imageAlt: $localize`:@@projetsProject10ImageAlt:illustration — Schema-Atlas`,
    },
    {
      size: 'big',
      tags: [{ label: $localize`:@@projetsProject11Tag1:NestJS 11` }],
      title: $localize`:@@projetsProject11Title:ZenFirst Renta`,
      desc: $localize`:@@projetsProject11Desc:Module de rentabilité pour cabinets d'expertise-gestion : analyse métier, calculs structurés et parcours web sécurisé.`,
      caseStudy: {
        context: $localize`:@@projetsProject11CaseContext:Un cabinet devait rendre une analyse de rentabilité complexe accessible dans un outil métier.`,
        problem: $localize`:@@projetsProject11CaseProblem:Les hypothèses, charges et financements devaient rester cohérents et auditables.`,
        solution: $localize`:@@projetsProject11CaseSolution:Un monorepo structure les contrats, le calcul métier, le web et les contrôles de sécurité.`,
        role: $localize`:@@projetsProject11CaseRole:Architecture produit, conception des contrats et développement du socle métier.`,
        result: $localize`:@@projetsProject11CaseResult:Le calcul devient explicable, testable et prêt à évoluer par domaines.`,
      },
      image: '/assets/images/projects/voice-ia.webp',
      imageAlt: $localize`:@@projetsProject11ImageAlt:illustration — ZenFirst Renta`,
    },
    {
      size: 'small',
      tags: [
        { label: $localize`:@@projetsProject12Tag1:Refonte en cours` },
        { label: $localize`:@@projetsProject12Tag2:Réservation en ligne` },
        { label: $localize`:@@projetsProject12Tag3:Migration SEO` },
      ],
      title: $localize`:@@projetsProject12Title:AtlanticBike`,
      desc: $localize`:@@projetsProject12Desc:Loueur-réparateur sur la côte atlantique : présenter l'activité, structurer l'offre et permettre la réservation en ligne. Demande en 6 étapes dont le devis est recalculé côté serveur uniquement, back-office du parc et de l'atelier, reprise des URL indexées.`,
      caseStudy: {
        context: $localize`:@@projetsProject12CaseContext:Un loueur-réparateur devait clarifier son offre et faire entrer la réservation en ligne.`,
        problem: $localize`:@@projetsProject12CaseProblem:Le parcours de demande devait rester simple tout en protégeant le calcul du devis.`,
        solution: $localize`:@@projetsProject12CaseSolution:Une refonte relie offre, réservation en six étapes, back-office et migration SEO.`,
        role: $localize`:@@projetsProject12CaseRole:Cadrage, architecture full-stack, sécurité du calcul serveur et migration des URL.`,
        result: $localize`:@@projetsProject12CaseResult:Le parcours couvre réservation, parc, atelier et continuité des pages indexées.`,
      },
      image: '/assets/images/projects/Atlanticbike.webp',
      imageAlt: $localize`:@@projetsProject12ImageAlt:capture — AtlanticBike`,
    },
    {
      size: 'small',
      tags: [
        { label: $localize`:@@projetsProject13Tag1:Prototype` },
        { label: $localize`:@@projetsProject13Tag2:Analyse de contenu` },
      ],
      title: $localize`:@@projetsProject13Title:Portail-EG`,
      desc: $localize`:@@projetsProject13Desc:Portail métier pour cabinets d'expertise-gestion : comptes, rôles, rentabilité, audit et parcours sécurisés.`,
      caseStudy: {
        context: $localize`:@@projetsProject13CaseContext:Un portail d’entreprise devait réunir plusieurs usages métier dans une base sécurisée.`,
        problem: $localize`:@@projetsProject13CaseProblem:Les parcours d’accès, de rôles et de données sensibles devaient rester cohérents.`,
        solution: $localize`:@@projetsProject13CaseSolution:Un monorepo web/API structure les contrats, l’authentification, les rôles et les parcours métier.`,
        role: $localize`:@@projetsProject13CaseRole:Architecture full-stack, conception des garde-fous et développement des flux critiques.`,
        result: $localize`:@@projetsProject13CaseResult:Le produit dispose d’un socle lisible pour ajouter des fonctionnalités sans diluer les règles.`,
      },
      image: '/assets/images/projects/Assistant-IA-Geev.webp',
      imageAlt: $localize`:@@projetsProject13ImageAlt:illustration — Portail-EG`,
    },
  ];

  protected readonly methodKicker = $localize`:@@projetsMethodKicker:Le fil rouge`;

  protected readonly methodSteps: readonly AsiliMethodStep[] = [
    {
      num: '01',
      index: $localize`:@@projetsMethodStep1Index:— Clarifier`,
      title: $localize`:@@projetsMethodStep1Title:Comprendre`,
      desc: $localize`:@@projetsMethodStep1Desc:Cartographier le besoin réel avant tout.`,
    },
    {
      num: '02',
      index: $localize`:@@projetsMethodStep2Index:— Construire`,
      title: $localize`:@@projetsMethodStep2Title:Déployer`,
      desc: $localize`:@@projetsMethodStep2Desc:Des outils robustes, dimensionnés juste.`,
    },
    {
      num: '03',
      index: $localize`:@@projetsMethodStep3Index:— Tester`,
      title: $localize`:@@projetsMethodStep3Title:Éprouver`,
      desc: $localize`:@@projetsMethodStep3Desc:Confronter à l'usage, mesurer, ajuster.`,
    },
    {
      num: '04',
      index: $localize`:@@projetsMethodStep4Index:— Évoluer`,
      title: $localize`:@@projetsMethodStep4Title:Faire durer`,
      desc: $localize`:@@projetsMethodStep4Desc:L'outil grandit avec vous.`,
    },
  ];

  protected readonly ctaKicker = $localize`:@@projetsCtaKicker:Un projet en tête ?`;

  protected readonly ctaTitle = $localize`:@@projetsCtaTitle:Racontez-moi votre situation. On verra ce qui mérite d'être construit.`;

  protected readonly ctaActions: readonly AsiliCtaAction[] = [
    {
      libelle: $localize`:@@projetsCtaPrimary:Démarrer la conversation`,
      lien: '/contact',
      variante: 'principale',
    },
    {
      libelle: $localize`:@@projetsCtaSecondary:Découvrir l'audit`,
      lien: '/growth-audit',
      variante: 'secondaire',
    },
  ];
}
