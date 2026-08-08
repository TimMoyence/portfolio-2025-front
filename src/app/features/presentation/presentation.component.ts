import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import {
  AsiliAiMethodComponent,
  type AsiliAiMethodStep,
  AsiliCtaBandComponent,
  AsiliFaqComponent,
  type AsiliFaqItem,
  AsiliHeroComponent,
} from '../../shared/sections';

interface PresentationSkill {
  title: string;
  desc: string;
  stack: readonly string[];
  icon: 'code' | 'ai' | 'chart';
  revealDelay: 1 | 2 | 3 | 4 | null;
}

interface PresentationMilestone {
  year: string;
  title: string;
  descHtml: string;
  tags: readonly string[];
}

@Component({
  selector: 'app-presentation',
  standalone: true,
  imports: [
    RouterLink,
    RevealOnScrollDirective,
    AsiliHeroComponent,
    AsiliAiMethodComponent,
    AsiliCtaBandComponent,
    AsiliFaqComponent,
  ],
  templateUrl: './presentation.component.html',
  styleUrl: './presentation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PresentationComponent {
  protected readonly heroKicker = $localize`:@@presentationHeroKicker:Le fondateur`;

  protected readonly heroTitlePre = $localize`:@@presentationHeroTitlePre:Développeur full-stack & IA.`;

  protected readonly heroTitleAccent = $localize`:@@presentationHeroTitleAccent:Manager`;

  protected readonly heroTitlePost = $localize`:@@presentationHeroTitlePost:avant tout.`;

  protected readonly heroLead = $localize`:@@presentationHeroLead:Je m'appelle Tim Moyence — développeur full-stack & IA, freelance à Bordeaux (remote). Six ans manager chez Decathlon avant de me reconvertir au code. J'aide TPE, PME et solopreneurs à transformer un besoin flou en outils nets, robustes et durables — avec une exigence d'ingénierie forte.`;

  protected readonly heroMeta: readonly { key: string; value: string }[] = [
    {
      key: $localize`:@@presentationHeroMeta1Key:Basé à`,
      value: $localize`:@@presentationHeroMeta1Value:Bordeaux · France`,
    },
    {
      key: $localize`:@@presentationHeroMeta2Key:Stack`,
      value: $localize`:@@presentationHeroMeta2Value:Angular · NestJS · .NET · IA`,
    },
    {
      key: $localize`:@@presentationHeroMeta3Key:Exigence`,
      value: $localize`:@@presentationHeroMeta3Value:DDD · Clean Archi · TDD`,
    },
    {
      key: $localize`:@@presentationHeroMeta4Key:Aussi`,
      value: $localize`:@@presentationHeroMeta4Value:Formateur · Ipac & EPSI`,
    },
    {
      key: $localize`:@@presentationHeroMeta5Key:Disponibilité`,
      value: $localize`:@@presentationHeroMeta5Value:Nouveaux projets · 2026`,
    },
  ];

  protected readonly portraitPlaceholder = $localize`:@@presentationPortraitPlaceholder:portrait — photo du fondateur`;

  protected readonly portraitImage = '/assets/images/portrait-tim-asili-design.webp';

  protected readonly portraitAlt = $localize`:@@presentationPortraitAlt:Tim Moyence, fondateur d'Asili Design`;

  protected readonly introSignature = $localize`:@@presentationIntroSignature:— Tim Moyence, Asili Design`;

  protected readonly skillsKicker = $localize`:@@presentationSkillsKicker:Compétences & approche`;

  protected readonly skills: readonly PresentationSkill[] = [
    {
      icon: 'code',
      revealDelay: null,
      title: $localize`:@@presentationSkill1Title:Développement produit`,
      desc: $localize`:@@presentationSkill1Desc:Des applications web robustes, lisibles et maintenables. De l'architecture front à l'API, avec une obsession pour la clarté du code et de l'usage.`,
      stack: [
        $localize`:@@presentationSkill1Stack1:Angular 19`,
        $localize`:@@presentationSkill1Stack2:NestJS`,
        $localize`:@@presentationSkill1Stack3:.NET / C#`,
        $localize`:@@presentationSkill1Stack4:React Native`,
        $localize`:@@presentationSkill1Stack5:PostgreSQL`,
        $localize`:@@presentationSkill1Stack6:Docker`,
      ],
    },
    {
      icon: 'ai',
      revealDelay: 1,
      title: $localize`:@@presentationSkill2Title:IA utile & mesurée`,
      desc: $localize`:@@presentationSkill2Desc:L'IA comme levier, pas comme gadget. J'intègre des automatisations et des assistants qui font gagner du temps réel — sous contrôle humain, toujours.`,
      stack: [
        $localize`:@@presentationSkill2Stack1:LangChain`,
        $localize`:@@presentationSkill2Stack2:Agents autonomes`,
        $localize`:@@presentationSkill2Stack3:Claude Code`,
        $localize`:@@presentationSkill2Stack4:Multi-LLM`,
      ],
    },
    {
      icon: 'chart',
      revealDelay: 2,
      title: $localize`:@@presentationSkill3Title:Conseil & stratégie`,
      desc: $localize`:@@presentationSkill3Desc:Avant la technique, la direction. Audit, cadrage, priorisation : je vous aide à décider quoi construire — et surtout quoi ne pas construire.`,
      stack: [
        $localize`:@@presentationSkill3Stack1:Audit`,
        $localize`:@@presentationSkill3Stack2:Cadrage`,
        $localize`:@@presentationSkill3Stack3:SEO`,
      ],
    },
  ];

  protected readonly aiMethodKicker = $localize`:@@presentationAiMethodKicker:Ma manière de travailler avec l'IA`;

  protected readonly aiMethodLead = $localize`:@@presentationAiMethodLead:Je travaille en orchestration multi-agents : un agent par tâche, revue croisée, vérification adversariale avant de valider. Chaque changement commence par un test qui échoue (TDD), et l'architecture est pensée pour durer (DDD, clean architecture) — même sur mes projets perso.`;

  protected readonly aiMethodSteps: readonly AsiliAiMethodStep[] = [
    {
      num: '01',
      title: $localize`:@@presentationAiMethodStep1Title:Un agent par tâche`,
      desc: $localize`:@@presentationAiMethodStep1Desc:Découpage clair, chaque agent a un rôle précis.`,
    },
    {
      num: '02',
      title: $localize`:@@presentationAiMethodStep2Title:Revue croisée`,
      desc: $localize`:@@presentationAiMethodStep2Desc:Les agents se relisent ; rien ne passe sans contrôle.`,
    },
    {
      num: '03',
      title: $localize`:@@presentationAiMethodStep3Title:Vérification adversariale`,
      desc: $localize`:@@presentationAiMethodStep3Desc:On cherche activement à casser avant de valider.`,
    },
    {
      num: '04',
      title: $localize`:@@presentationAiMethodStep4Title:TDD + architecture durable`,
      desc: $localize`:@@presentationAiMethodStep4Desc:Un test qui échoue d'abord ; DDD & clean archi ensuite.`,
    },
  ];

  protected readonly aiMethodRule = $localize`:@@presentationAiMethodRule:« L'IA génère du contenu.<br/><em>Un expert génère des résultats.</em> »`;

  protected readonly aiMethodRuleWho = $localize`:@@presentationAiMethodRuleWho:La règle d'or — la même que dans mes formations`;

  protected readonly timelineKicker = $localize`:@@presentationTimelineKicker:Le parcours`;

  protected readonly timelineHeadLink = $localize`:@@presentationTimelineHeadLink:Voir les projets`;

  protected readonly milestones: readonly PresentationMilestone[] = [
    {
      year: $localize`:@@presentationMilestone1Year:2026 →`,
      title: $localize`:@@presentationMilestone1Title:Asili Design & projets actifs`,
      descHtml: $localize`:@@presentationMilestone1Desc:Le studio sous sa forme actuelle, plus un chantier très actif : <strong>Musaium / InnovMind</strong> (médiation culturelle IA pour musées).`,
      tags: [
        $localize`:@@presentationMilestone1Tag1:Monorepo`,
        $localize`:@@presentationMilestone1Tag2:Multi-LLM`,
        $localize`:@@presentationMilestone1Tag3:React 19`,
      ],
    },
    {
      year: $localize`:@@presentationMilestone2Year:2025`,
      title: $localize`:@@presentationMilestone2Title:Plateforme SaaS multi-apps`,
      descHtml: $localize`:@@presentationMilestone2Desc:Un socle Angular 19 SSR + NestJS 11 réunissant plusieurs apps en production : Weather, Sebastian, Growth Audit, Formations — avec auth, RGPD et lead-magnets.`,
      tags: [
        $localize`:@@presentationMilestone2Tag1:Angular 19 SSR`,
        $localize`:@@presentationMilestone2Tag2:NestJS 11`,
      ],
    },
    {
      year: $localize`:@@presentationMilestone3Year:2023`,
      title: $localize`:@@presentationMilestone3Title:Reconversion au code`,
      descHtml: $localize`:@@presentationMilestone3Desc:Du management au développement, avec d'emblée une exigence d'ingénierie : DDD, Clean Architecture, TDD obligatoire, CI/CD complet. Aussi formateur à l'Ipac et l'EPSI.`,
      tags: [
        $localize`:@@presentationMilestone3Tag1:DDD`,
        $localize`:@@presentationMilestone3Tag2:TDD`,
        $localize`:@@presentationMilestone3Tag3:Formateur`,
      ],
    },
    {
      year: $localize`:@@presentationMilestone4Year:2017–23`,
      title: $localize`:@@presentationMilestone4Title:Manager chez Decathlon`,
      descHtml: $localize`:@@presentationMilestone4Desc:Six ans sur le terrain : leadership, équipes, priorités, décisions concrètes. La matière première de ma façon de cadrer un projet aujourd'hui.`,
      tags: [
        $localize`:@@presentationMilestone4Tag1:Leadership`,
        $localize`:@@presentationMilestone4Tag2:Terrain`,
      ],
    },
  ];

  protected readonly faqKicker = $localize`:@@presentationFaqKicker:Questions fréquentes`;

  protected readonly faqTitle = $localize`:@@presentationFaqTitle:Ce qu'on me demande souvent.`;

  protected readonly faqItems: readonly AsiliFaqItem[] = [
    {
      q: $localize`:@@presentationFaq1Q:Travaillez-vous avec des non-techniciens ?`,
      a: $localize`:@@presentationFaq1A:Absolument — c'est même mon terrain de prédilection. Je traduis le technique en décisions claires, sans jargon. Vous n'avez pas besoin de comprendre le code pour piloter un bon projet.`,
    },
    {
      q: $localize`:@@presentationFaq2Q:Quels types de projets prenez-vous ?`,
      a: $localize`:@@presentationFaq2A:Des interventions ciblées aux projets structurants, en passant par l'accompagnement dans la durée. Le périmètre est défini sur votre besoin réel, pas sur un catalogue figé.`,
    },
    {
      q: $localize`:@@presentationFaq3Q:L'IA est-elle obligatoire dans vos projets ?`,
      a: $localize`:@@presentationFaq3A:Jamais. L'IA est un levier parmi d'autres. Si elle apporte une valeur mesurable, on l'intègre proprement. Sinon, on s'en passe — la sobriété est une qualité.`,
    },
    {
      q: $localize`:@@presentationFaq4Q:Comment démarre-t-on ?`,
      a: $localize`:@@presentationFaq4A:Par une conversation. Décrivez votre situation via la page contact ; je reviens vers vous avec un regard honnête et une proposition de cadrage — pas un devis générique.`,
    },
  ];

  protected readonly ctaKicker = $localize`:@@presentationCtaKicker:On en parle ?`;

  protected readonly ctaTitle = $localize`:@@presentationCtaTitle:Votre projet mérite d'être clarifié avant d'être construit.`;

  protected readonly ctaPrimary = $localize`:@@presentationCtaPrimary:Démarrer la conversation`;

  protected readonly ctaSecondary = $localize`:@@presentationCtaSecondary:Voir les services`;
}
