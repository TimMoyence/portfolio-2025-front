import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AsiliCtaBandComponent,
  type AsiliCta,
  AsiliHeroComponent,
  AsiliManifestoComponent,
  type AsiliManifestoLine,
  AsiliMethodComponent,
  type AsiliMethodStep,
  AsiliPillarsComponent,
  type AsiliPillar,
  AsiliProjectsGridComponent,
  type AsiliProject,
} from '../../shared/sections';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    AsiliHeroComponent,
    AsiliMethodComponent,
    AsiliPillarsComponent,
    AsiliManifestoComponent,
    AsiliProjectsGridComponent,
    AsiliCtaBandComponent,
  ],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly heroChip = $localize`:@@homeHeroChip:Studio digital & IA · Bordeaux`;

  protected readonly heroTitlePre = $localize`:@@homeHeroTitlePre:Clarifier`;

  protected readonly heroTitleAccent = $localize`:@@homeHeroTitleAccent:avant`;

  protected readonly heroTitlePost = $localize`:@@homeHeroTitlePost:de construire.`;

  protected readonly heroLead = $localize`:@@homeHeroLead:Développeur & consultant spécialisé Angular, NestJS et IA. Je structure les usages avant de déployer la techno — pour des TPE, PME et solopreneurs qui veulent des leviers concrets, pas du jargon.`;

  protected readonly heroScrollHint = $localize`:@@homeHeroScrollHint:Défiler`;

  protected readonly heroStat1Num = $localize`:@@homeHeroStat1Num:2`;
  protected readonly heroStat1Label = $localize`:@@homeHeroStat1Label:piliers : services & formations`;

  protected readonly heroStat2Num = $localize`:@@homeHeroStat2Num:4`;
  protected readonly heroStat2Label = $localize`:@@homeHeroStat2Label:formats d'intervention`;

  protected readonly heroCtaPrimary = $localize`:@@homeHeroCtaPrimary:Voir comment je travaille`;
  protected readonly heroCtaSecondary = $localize`:@@homeHeroCtaSecondary:Voir les projets`;

  protected readonly methodKicker = $localize`:@@homeMethodKicker:La méthode`;
  protected readonly methodIntro = $localize`:@@homeMethodIntro:Le digital et l'IA sont des leviers, jamais des finalités. On commence par comprendre, on déploie ensuite — et on garde ce qui marche.`;

  protected readonly methodSteps: readonly AsiliMethodStep[] = [
    {
      num: '01',
      index: $localize`:@@homeMethodStep1Index:— Clarifier`,
      title: $localize`:@@homeMethodStep1Title:Comprendre`,
      desc: $localize`:@@homeMethodStep1Desc:On cartographie le besoin réel et les usages avant la moindre ligne de code.`,
    },
    {
      num: '02',
      index: $localize`:@@homeMethodStep2Index:— Construire`,
      title: $localize`:@@homeMethodStep2Title:Déployer`,
      desc: $localize`:@@homeMethodStep2Desc:Des outils robustes et lisibles, dimensionnés sur le périmètre réel.`,
    },
    {
      num: '03',
      index: $localize`:@@homeMethodStep3Index:— Tester`,
      title: $localize`:@@homeMethodStep3Title:Éprouver`,
      desc: $localize`:@@homeMethodStep3Desc:On confronte à l'usage, on mesure, on ajuste sans dogme.`,
    },
    {
      num: '04',
      index: $localize`:@@homeMethodStep4Index:— Évoluer`,
      title: $localize`:@@homeMethodStep4Title:Faire durer`,
      desc: $localize`:@@homeMethodStep4Desc:Continuité humaine : l'outil grandit avec vous, pas contre vous.`,
    },
  ];

  protected readonly pillarsKicker = $localize`:@@homePillarsKicker:Deux façons de travailler ensemble`;

  protected readonly pillars: readonly AsiliPillar[] = [
    {
      variant: 'services',
      tag: $localize`:@@homePillarServicesTag:01 — Services premium`,
      title: $localize`:@@homePillarServicesTitle:On bâtit exactement ce qu'il vous faut.`,
      desc: $localize`:@@homePillarServicesDesc:Interventions ciblées, projets structurants, accompagnement dans la durée. Un périmètre défini sur votre situation réelle — pas un catalogue de prix figés.`,
      items: [
        $localize`:@@homePillarServicesItem1:Audit & cadrage avant tout chantier`,
        $localize`:@@homePillarServicesItem2:Développement Angular / NestJS sur-mesure`,
        $localize`:@@homePillarServicesItem3:Intégration d'IA utile, mesurée, maîtrisée`,
      ],
      link: {
        label: $localize`:@@homePillarServicesLink:Découvrir l'offre`,
        href: '/offer',
      },
    },
    {
      variant: 'formations',
      tag: $localize`:@@homePillarFormationsTag:02 — Formations premium`,
      title: $localize`:@@homePillarFormationsTitle:On vous rend autonome, pour de bon.`,
      desc: $localize`:@@homePillarFormationsDesc:Des formations qui font monter en gamme : de l'usage flou à un système qui travaille pour vous. Le gratuit reste un point d'entrée — le premium va au fond des choses.`,
      items: [
        $localize`:@@homePillarFormationsItem1:IA pour solopreneurs`,
        $localize`:@@homePillarFormationsItem2:Automatiser avec l'IA`,
        $localize`:@@homePillarFormationsItem3:Audit SEO DIY — diagnostiquer soi-même`,
      ],
      link: {
        label: $localize`:@@homePillarFormationsLink:Voir les formations`,
        href: '/formations',
      },
    },
  ];

  protected readonly manifestoLines: readonly AsiliManifestoLine[] = [
    {
      step: $localize`:@@homeManifestoStep1:Le problème`,
      html: $localize`:@@homeManifestoLine1:La technologie promet beaucoup,`,
    },
    {
      html: $localize`:@@homeManifestoLine2:et laisse souvent un <span class="t">flou</span>.`,
    },
    {
      step: $localize`:@@homeManifestoStep2:La clarté`,
      html: $localize`:@@homeManifestoLine3:Mon métier commence là :`,
    },
    {
      html: $localize`:@@homeManifestoLine4:comprendre <span class="t">avant</span> de construire.`,
    },
    {
      step: $localize`:@@homeManifestoStep3:La preuve`,
      html: $localize`:@@homeManifestoLine5:Et le prouver en le rendant <span class="t">jouable</span>.`,
    },
  ];

  protected readonly projectsKicker = $localize`:@@homeProjectsKicker:Preuve de savoir-faire`;
  protected readonly projectsHeadLink = $localize`:@@homeProjectsHeadLink:Voir tous les projets`;

  protected readonly projects: readonly AsiliProject[] = [
    {
      size: 'big',
      tags: [
        { label: $localize`:@@homeProjectMorningBriefTag1:En production`, prod: true },
        { label: $localize`:@@homeProjectMorningBriefTag2:Raspberry Pi` },
        { label: $localize`:@@homeProjectMorningBriefTag3:Newsletter IA` },
      ],
      title: $localize`:@@homeProjectMorningBriefTitle:Morning-Brief`,
      desc: $localize`:@@homeProjectMorningBriefDesc:Une veille IA collectée, synthétisée et livrée chaque matin, bientôt publiée comme une collection d'articles utiles.`,
      image: '/assets/images/projects/morning-brief.webp',
      imageAlt: $localize`:@@homeProjectMorningBriefImageAlt:illustration — Morning-Brief`,
    },
    {
      size: 'small',
      tags: [
        { label: $localize`:@@homeProjectAuditTag1:Audit` },
        { label: $localize`:@@homeProjectAuditTag2:SSE` },
        { label: $localize`:@@homeProjectAuditTag3:IA` },
      ],
      title: $localize`:@@homeProjectAuditTitle:Audit de visibilité web`,
      desc: $localize`:@@homeProjectAuditDesc:Un diagnostic technique et IA qui transforme les signaux d'un site en actions priorisées.`,
      href: '/growth-audit',
      image: '/assets/images/projects/growth-audit.webp',
      imageAlt: $localize`:@@homeProjectAuditImageAlt:capture — Audit de visibilité web`,
    },
    {
      size: 'small',
      tags: [
        { label: $localize`:@@homeProject4Tag1:Automatisation` },
        { label: $localize`:@@homeProject4Tag2:IA` },
      ],
      title: $localize`:@@homeProject4Title:Un système qui travaille en silence`,
      desc: $localize`:@@homeProject4Desc:Des tâches répétitives remplacées par une automatisation lisible, mesurée, sous contrôle humain.`,
      href: '/offer',
      image: '/assets/images/projects/project-automation-validation-diplomas.webp',
      imageAlt: $localize`:@@homeProject4ImageAlt:capture — automatisation IA`,
    },
    {
      size: 'big',
      tags: [
        { label: $localize`:@@homeProjectFormationsTag1:Formation` },
        { label: $localize`:@@homeProjectFormationsTag2:IA` },
      ],
      title: $localize`:@@homeProjectFormationsTitle:Formations actionnables`,
      desc: $localize`:@@homeProjectFormationsDesc:Des formats courts pour comprendre l'IA, tester un workflow et repartir avec un toolkit concret.`,
      href: '/formations',
      image: '/assets/images/projects/Automation-validation.webp',
      imageAlt: $localize`:@@homeProjectFormationsImageAlt:illustration — formations IA`,
    },
  ];

  protected readonly cta: AsiliCta = {
    kicker: $localize`:@@homeCtaKicker:Parlons de votre situation`,
    title: $localize`:@@homeCtaTitle:Et si on clarifiait, ensemble, avant de construire ?`,
    lead: $localize`:@@homeCtaLead:Décrivez votre contexte en quelques lignes. Je reviens vers vous avec un regard honnête — pas un devis générique.`,
    actions: [
      {
        libelle: $localize`:@@homeCtaPrimary:Démarrer la conversation`,
        lien: '/contact',
        variante: 'principale',
      },
      {
        libelle: $localize`:@@homeCtaSecondary:Voir les projets`,
        lien: '/projets',
        variante: 'secondaire',
      },
    ],
  };
}
