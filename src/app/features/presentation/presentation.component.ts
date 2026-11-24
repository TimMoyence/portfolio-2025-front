import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { nomCourtServi } from '../../core/seo/site-servi';
import { FiletDeSectionDirective } from '../../shared/directives/filet-de-section.directive';
import { phasesDeLaMethode } from '../../shared/offre/socle-et-elan';
import {
  AsiliAiMethodComponent,
  type AsiliAiMethodStep,
  type AsiliClosing,
  AsiliClosingComponent,
  AsiliHeroComponent,
  type AsiliHeroMetaRow,
  type MorceauDeTitre,
  AsiliSectionTeteComponent,
  PortraitComponent,
} from '../../shared/sections';

interface PresentationSkill {
  title: string;
  desc: string;
  stack: readonly string[];
  icon: 'code' | 'ai' | 'chart';
}

interface IconeCompetence {
  cercle: boolean;
  traits: readonly { d: string; jointureArrondie: boolean }[];
}

const ICONES_COMPETENCES: Readonly<Record<PresentationSkill['icon'], IconeCompetence>> = {
  code: {
    cercle: false,
    traits: [{ d: 'm8 6-6 6 6 6M16 6l6 6-6 6', jointureArrondie: true }],
  },
  ai: {
    cercle: true,
    traits: [
      {
        d: 'M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
        jointureArrondie: false,
      },
    ],
  },
  chart: {
    cercle: false,
    traits: [
      { d: 'M3 3v18h18', jointureArrondie: false },
      { d: 'm7 14 3-3 3 3 5-6', jointureArrondie: true },
    ],
  },
};

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
    FiletDeSectionDirective,
    AsiliHeroComponent,
    AsiliAiMethodComponent,
    AsiliSectionTeteComponent,
    AsiliClosingComponent,
    PortraitComponent,
  ],
  templateUrl: './presentation.component.html',
  styleUrl: './presentation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PresentationComponent {
  protected readonly heroKicker = $localize`:@@presentationHeroKicker:Le fondateur`;

  protected readonly titre: readonly MorceauDeTitre[] = [
    { texte: $localize`:@@presentationHeroTitreDebut:Votre site, pensé avec vous, ` },
    {
      texte: $localize`:@@presentationHeroTitreAccent:prouvé avant d’être promis.`,
      aLaLigne: true,
      accent: true,
    },
  ];

  protected readonly heroLead = $localize`:@@presentationHeroLead:Je m'appelle Tim Moyence — développeur full-stack & IA, freelance à Bordeaux (remote). Six ans manager chez Decathlon avant de me reconvertir au code. J'aide TPE, PME et solopreneurs à transformer un besoin flou en outils nets, robustes et durables — avec une exigence d'ingénierie forte.`;

  protected readonly heroMeta: readonly AsiliHeroMetaRow[] = [
    {
      key: $localize`:@@presentationHeroMeta1Key:Basé à`,
      value: $localize`:@@presentationHeroMeta1Value:Bordeaux · France`,
    },
    {
      key: $localize`:@@presentationHeroMeta2Key:Métier`,
      value: $localize`:@@presentationHeroMeta2Value:Sites web · apps mobiles · outils sur mesure`,
    },
    {
      key: $localize`:@@presentationHeroMeta3Key:Méthode`,
      value: phasesDeLaMethode()
        .map(({ titre }) => titre)
        .join(' · '),
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

  protected readonly introSignature = $localize`:@@presentationIntroSignature:— Tim Moyence, Asili Design`;

  protected readonly skillsKicker = $localize`:@@presentationSkillsKicker:Compétences & approche`;

  protected readonly icones = ICONES_COMPETENCES;

  protected readonly skills: readonly PresentationSkill[] = [
    {
      icon: 'code',
      title: $localize`:@@presentationSkill1Title:Sites et applications`,
      desc: $localize`:@@presentationSkill1Desc:Des sites rapides et clairs, des apps mobiles et des outils sur mesure. Construits pour durer, faciles à faire évoluer.`,
      stack: [
        $localize`:@@presentationSkill1Stack1:Sites vitrines`,
        $localize`:@@presentationSkill1Stack2:Réservation en ligne`,
        $localize`:@@presentationSkill1Stack3:Apps mobiles`,
        $localize`:@@presentationSkill1Stack4:Outils sur mesure`,
      ],
    },
    {
      icon: 'ai',
      title: $localize`:@@presentationSkill2Title:IA utile & mesurée`,
      desc: $localize`:@@presentationSkill2Desc:L'IA comme levier, pas comme gadget. J'intègre des automatisations et des assistants qui font gagner du temps réel — sous contrôle humain, toujours.`,
      stack: [
        $localize`:@@presentationSkill2Stack1:Automatisations`,
        $localize`:@@presentationSkill2Stack2:Agents autonomes`,
        $localize`:@@presentationSkill2Stack3:Assistants`,
      ],
    },
    {
      icon: 'chart',
      title: $localize`:@@presentationSkill3Title:Conseil & stratégie`,
      desc: $localize`:@@presentationSkill3Desc:Avant la technique, la direction. Diagnostic, cadrage, priorisation : je vous aide à décider quoi construire — et surtout quoi ne pas construire.`,
      stack: [
        $localize`:@@presentationSkill3Stack1:Diagnostic`,
        $localize`:@@presentationSkill3Stack2:Cadrage`,
        $localize`:@@presentationSkill3Stack3:Référencement`,
      ],
    },
  ];

  protected readonly aiMethodKicker = $localize`:@@presentationAiMethodKicker:Ma manière de travailler avec l'IA`;

  protected readonly aiMethodLead = $localize`:@@presentationAiMethodLead:Je travaille avec plusieurs agents IA : un agent par tâche, une relecture croisée, une vérification qui cherche la faille avant de valider. Chaque changement commence par un test qui échoue, et le code est pensé pour durer — même sur mes projets perso.`;

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
      title: $localize`:@@presentationAiMethodStep4Title:Test d’abord, code qui dure`,
      desc: $localize`:@@presentationAiMethodStep4Desc:Un test qui échoue d’abord ; une architecture qui tient ensuite.`,
    },
  ];

  protected readonly aiMethodRule = $localize`:@@presentationAiMethodRule:« L'IA génère du contenu.<br/><em>Un expert génère des résultats.</em> »`;

  protected readonly aiMethodRuleWho = $localize`:@@presentationAiMethodRuleWho:La règle d'or — la même que dans mes formations`;

  protected readonly timelineKicker = $localize`:@@presentationTimelineKicker:Le parcours`;

  protected readonly timelineHeadLink = $localize`:@@presentationTimelineHeadLink:Voir mes réalisations`;

  protected readonly milestones: readonly PresentationMilestone[] = [
    {
      year: $localize`:@@presentationMilestone1Year:2026 →`,
      title: $localize`:@@presentationMilestone1Title:Asili Design & projets actifs`,
      descHtml: $localize`:@@presentationMilestone1Desc:Le studio sous sa forme actuelle, plus un chantier très actif : <strong>Musaium / InnovMind</strong> (médiation culturelle IA pour musées).`,
      tags: [
        $localize`:@@presentationMilestone1Tag2:Musées`,
        $localize`:@@presentationMilestone1Tag3:IA`,
      ],
    },
    {
      year: $localize`:@@presentationMilestone2Year:2025`,
      title: $localize`:@@presentationMilestone2Title:Plateforme SaaS multi-apps`,
      descHtml: $localize`:@@presentationMilestone2Desc:Un socle commun qui réunit plusieurs apps en production : le diagnostic gratuit, les formations — avec comptes, RGPD et ressources offertes.`,
      tags: [
        $localize`:@@presentationMilestone2Tag1:Plusieurs apps`,
        $localize`:@@presentationMilestone2Tag2:En production`,
      ],
    },
    {
      year: $localize`:@@presentationMilestone3Year:2023`,
      title: $localize`:@@presentationMilestone3Title:Reconversion au code`,
      descHtml: $localize`:@@presentationMilestone3Desc:Du management au développement, avec d’emblée une exigence forte : un test avant chaque changement, des mises en ligne automatisées. Aussi formateur à l’Ipac et l’EPSI.`,
      tags: [
        $localize`:@@presentationMilestone3Tag1:Exigence`,
        $localize`:@@presentationMilestone3Tag2:Tests`,
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

  protected readonly closing: AsiliClosing = {
    faq: {
      kicker: $localize`:@@presentationFaqKicker:Questions fréquentes`,
      title: $localize`:@@presentationFaqTitle:Ce qu'on me demande souvent.`,
      items: [
        {
          question: $localize`:@@presentationFaq1Q:Travaillez-vous avec des non-techniciens ?`,
          reponse: $localize`:@@presentationFaq1A:Absolument — c'est même mon terrain de prédilection. Je traduis le technique en décisions claires, sans jargon. Vous n'avez pas besoin de comprendre le code pour piloter un bon projet.`,
        },
        {
          question: $localize`:@@presentationFaq2Q:Quels types de projets prenez-vous ?`,
          reponse: $localize`:@@presentationFaq2A:Des interventions ciblées aux projets structurants, en passant par l'accompagnement dans la durée. Le périmètre est défini sur votre besoin réel, pas sur un catalogue figé.`,
        },
        {
          question: $localize`:@@presentationFaq3Q:L'IA est-elle obligatoire dans vos projets ?`,
          reponse: $localize`:@@presentationFaq3A:Jamais. L'IA est un levier parmi d'autres. Si elle apporte une valeur mesurable, on l'intègre proprement. Sinon, on s'en passe — la sobriété est une qualité.`,
        },
        {
          question: $localize`:@@presentationFaq4Q:Comment démarre-t-on ?`,
          reponse: $localize`:@@presentationFaq4A:Par une conversation. Décrivez votre situation via la page contact ; je reviens vers vous avec un regard honnête et une proposition de cadrage — pas un devis générique.`,
        },
      ],
    },
    cta: {
      kicker: $localize`:@@presentationCtaKicker:On en parle ?`,
      title: $localize`:@@presentationCtaTitle:Votre projet mérite d'être clarifié avant d'être construit.`,
      actions: [
        {
          libelle: $localize`:@@presentationCtaPrimary:Démarrer la conversation`,
          lien: '/contact',
          variante: 'principale',
        },
        {
          libelle: nomCourtServi('/offer'),
          lien: '/offer',
          variante: 'secondaire',
        },
      ],
    },
  };
}
