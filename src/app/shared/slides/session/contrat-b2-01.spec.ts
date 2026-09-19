import type {
  ComptesJalon,
  CorrigeEcranPresentateur,
  DerouleCours,
  Diffusion,
  EcranContent,
  EcranDeroule,
  EtatParticipant,
  FormeFormule,
  MetadonneesBrique,
  PilotageEcran,
  ProgressionEnigme,
  ResultatQuestion,
  ResultatsEnDirect,
  ResumeBareme,
  Tolerance,
  TypeQuestion,
  ValeurProduction,
  VotePhase,
} from '../../../../cours/content/types';
import type {
  CardsortPlanPublic,
  Concept4Definition,
  DonneesParBrique,
  EscapeParcoursPublic,
  ExitBilletPublic,
  NumeriquePublic,
  OptionPublique,
  PlotDefinition,
  PulseSondage,
  SheetPlanPublic,
  SpacedQuestionPublique,
  StoryRecit,
  TableBuildPlanPublic,
  TableColonneServie,
  VotePublic,
  WorkedExemple,
} from '../../../../cours/runtime/blocks/donnees-publiques';
import {
  buildConcept4Definition,
  buildExitBillet,
  buildProCas,
  buildPulseSondage,
  buildWorkedExemple,
} from '../../../../testing/factories/cours.factory';
import {
  buildDerouleCours,
  buildEcranDeroule,
  buildResultatQuestion,
  buildStatistiquesSeance,
} from '../../../../testing/factories/formations.factory';
import type { DirectEcran, EtatPulse, EvenementBrique, RetourBrique } from './contrat-hote';

const METADONNEES: MetadonneesBrique = buildPulseSondage().metadonnees;

const OPTIONS: OptionPublique[] = [
  { id: 'plus-bas-que-le-depart-1a2b3c4d', libelle: 'Plus bas que le départ' },
  { id: 'egal-au-depart-5e6f7a8b', libelle: 'Égal au départ' },
];

const VOTE = {
  id: 'b2-01-a3-vote-hausse-baisse',
  enonce: 'Le prix monte de 20 %, puis baisse de 20 %. Où arrive-t-il ?',
  options: OPTIONS,
} satisfies VotePublic;

const TOLERANCE = { type: 'absolue', valeur: 0.01 } satisfies Tolerance;

const PRODUCTION = {
  type: 'feuille',
  cellules: { B5: '=SOMME(B2:B4)', E2: '=C2/$C$5' },
} satisfies ValeurProduction;

const PILOTAGE = { phase: 'revote' } satisfies PilotageEcran;

const JALON = { perdu: 3, 'ca-va': 12, clair: 9, total: 24 } satisfies ComptesJalon;

const RESULTAT = {
  questionId: 'b2-01-a4-feuille-canaux',
  ecranId: 'B2-01-A4-02-FEUILLE-CANAUX',
  type: 'feuille',
  noteCompte: true,
  total: 24,
  correctes: 15,
  neSaitPas: 1,
  confusions: [],
  parOption: null,
  scoreMoyen: 0.71,
  parCle: { E3: { total: 24, justes: 19 } },
} satisfies ResultatQuestion;

const PARCOURS = {
  id: 'b2-01-a6-coffre',
  intitule: 'Le coffre du comité',
  delaiIndiceMs: 60000,
  budgetEnigmeMs: 150000,
  tentativesMax: 10,
  enigmes: [
    {
      id: 'enigme-1',
      intitule: 'La marge du sur-mesure',
      enonce: 'Retrouvez la marge brute du canal sur-mesure.',
      indice: 'Multipliez le CA par le taux de marge brute.',
    },
  ],
  metadonnees: METADONNEES,
} satisfies EscapeParcoursPublic;

const SPACED = {
  questionId: 'b2-01-r-compensation',
  concept: 'evolution-reciproque',
  boite: 1,
  cours: 'B2-01 · Traitement de l’information chiffrée',
  enonce: 'Après une baisse de 20 %, quelle hausse ramène au départ ?',
  options: OPTIONS,
} satisfies SpacedQuestionPublique;

describe('Contrats figés du cours B2-01 V3 côté front (§ 9, lot 0)', () => {
  describe('§ 9.3 — types miroirs', () => {
    it('titre un écran sans l’exiger d’un serveur v2', () => {
      const titre = {
        id: 'B2-01-A4-02-FEUILLE-CANAUX',
        type: 'fp-sheet',
        titre: 'Le tableau de bord par canal',
        duree: 13,
        interactif: true,
      } satisfies EcranContent;
      const sansTitre = { id: 'E-1', type: 'fp-vote', duree: 4, interactif: true };
      const ecrans: EcranContent[] = [titre, sansTitre];

      expect(ecrans.map((ecran) => ecran.titre ?? null)).toEqual([titre.titre, null]);
    });

    it('étend les résultats par question sans perdre leur forme actuelle', () => {
      const resultats = [RESULTAT, buildResultatQuestion()] satisfies ResultatQuestion[];
      const enDirect = {
        participants: 24,
        questions: resultats,
        statistiques: buildStatistiquesSeance(),
        jalons: { 'b2-01-jalon-1': JALON },
        enigmes: [
          {
            parcoursId: 'b2-01-a6-coffre',
            enigmeId: 'enigme-1',
            ouvertes: 20,
            resolues: 17,
            tentativesMoyennes: 1.6,
            epuisees: 1,
          } satisfies ProgressionEnigme,
        ],
        bareme: {
          questionsNotees: 31,
          parType: {
            vote: { notees: 19, nonNotees: 13 },
            numeric: { notees: 7, nonNotees: 0 },
            classement: { notees: 3, nonNotees: 0 },
            feuille: { notees: 1, nonNotees: 0 },
            tableau: { notees: 1, nonNotees: 0 },
            enigme: { notees: 0, nonNotees: 4 },
          },
        } satisfies ResumeBareme,
      } satisfies ResultatsEnDirect;
      const types: TypeQuestion[] = Object.keys(enDirect.bareme.parType) as TypeQuestion[];

      expect(types.length).toBe(6);
      expect(enDirect.questions[0].parCle?.['E3']?.justes).toBe(19);
    });

    it('sert au pupitre un corrigé par famille d’écran', () => {
      const formes: FormeFormule[] = ['references', { memeQue: 'E2' }];
      const corriges = [
        {
          type: 'feuille',
          attendus: [
            {
              reference: 'E3',
              formuleReference: '=C3/$C$5',
              valeur: 0.2,
              tolerance: { type: 'relative', valeur: 0.0001 },
              forme: formes[1],
            },
          ],
          seuilReussite: 0.8,
        },
        {
          type: 'tableau',
          attendus: [{ rang: 1, cle: 'prix', valeur: 20.52 }],
          tolerance: TOLERANCE,
          seuilReussite: 0.75,
        },
        {
          type: 'classement',
          attendus: [
            { carteId: 'carte-1', categorieId: 'comparable', justification: 'Même périmètre.' },
          ],
          seuilReussite: 0.75,
        },
        {
          type: 'enigmes',
          enigmes: [{ enigmeId: 'enigme-1', solution: '142 920', fragment: '7' }],
          codeFinal: '7-3-1-9',
        },
        {
          type: 'defi',
          strategies: [{ id: 'somme-des-taux', libelle: 'Additionner les taux', fausse: true }],
        },
        { type: 'revelation', titre: 'Hausse puis baisse', lignes: ['1,2 × 0,8 = 0,96'] },
      ] satisfies CorrigeEcranPresentateur[];
      const diffusions: Diffusion[] = ['catalogue', 'seance'];
      const ecran = buildEcranDeroule({
        titre: 'Le tableau de bord par canal',
        diffusion: diffusions[1],
        questions: [{ id: 'b2-01-a4-feuille-canaux', enonce: 'Feuille', options: null }],
        corrigeEcran: corriges[0],
      }) satisfies EcranDeroule;
      const deroule = buildDerouleCours({ ecrans: [ecran] }) satisfies DerouleCours;

      expect(corriges.map((corrige) => corrige.type)).toEqual([
        'feuille',
        'tableau',
        'classement',
        'enigmes',
        'defi',
        'revelation',
      ]);
      expect(deroule.ecrans[0].corrigeEcran?.type).toBe('feuille');
    });

    it('restitue au participant ses seules données de séance', () => {
      const phases: VotePhase[] = ['vote', 'discussion', 'revote', 'revele'];
      const moi = {
        sessionId: '0f6c1e02-6d0f-4a4b-8f6e-0c2f1e5b7a10',
        participantId: '9b1d0c3e-6d0f-4a4b-8f6e-0c2f1e5b7a10',
        revision: 7,
        reponses: [
          {
            questionId: 'b2-01-a4-feuille-canaux',
            valeur: PRODUCTION,
            correcte: false,
            score: 13 / 17,
            details: [{ cle: 'E3', juste: false, libelleConfusion: 'Taux et valeur confondus.' }],
            libelleConfusion: 'Taux et valeur confondus.',
          },
          {
            questionId: 'b2-01-a3-vote-hausse-baisse',
            valeur: 'plus-bas-que-le-depart-1a2b3c4d',
            correcte: true,
            score: null,
            details: null,
            libelleConfusion: null,
          },
        ],
        reponsesLibres: [{ activityId: 'b2-01-a1-diagnostic:rappel', response: 'Base de départ.' }],
        jalons: [{ sondageId: 'b2-01-jalon-1', etat: 'ca-va' }],
        enigmes: [
          {
            parcoursId: 'b2-01-a6-coffre',
            resolues: [{ enigmeId: 'enigme-1', fragment: '7' }],
            tentativesRestantes: { 'enigme-2': 9 },
          },
        ],
        defis: [{ defiId: 'b2-01-a5-defi', premiereTentative: 'Renforcer la marketplace.' }],
        rappels: { questionIds: ['b2-01-r-compensation'] },
      } satisfies EtatParticipant;

      expect(phases).toContain(PILOTAGE.phase);
      expect(moi.reponses.map((reponse) => reponse.score)).toEqual([13 / 17, null]);
    });
  });

  describe('§ 9.4 — données publiques par brique', () => {
    it('sert chaque brique sans solution, fragment ni stratégie révélée', () => {
      const colonne = {
        cle: 'coef',
        intitule: 'Coefficient appliqué',
        role: 'deduite',
        formuleInitiale: 'prix / prixInitial',
        formule: 'prix / avantPrix',
        decimales: 4,
        totalise: false,
      } satisfies TableColonneServie;
      const tableau = {
        id: 'b2-01-a4-indice-toile',
        intitule: 'Tâche de tableur 2 — Prix et indice de la toile en 2025',
        consignes: ['Arrondissez chaque prix au centime.'],
        echeances: 4,
        libellesLignes: [
          '1er mars : +8 %',
          '1er juin : −5 %',
          '1er sept. : +4 %',
          '1er déc. : −3 %',
        ],
        parametres: { prixInitial: 20 },
        colonnes: [colonne],
        synthese: [
          { libelle: 'Évolution réelle', formule: 'dernierEvolution', unite: '%', decimales: 2 },
        ],
        metadonnees: METADONNEES,
      } satisfies TableBuildPlanPublic;
      const feuille = {
        id: 'b2-01-a4-feuille-canaux',
        intitule: 'Tâche de tableur 1 — Le tableau de bord par canal',
        lignes: 7,
        colonnes: 7,
        cellules: { A1: 'Canal', C2: '397000' },
        verrouillees: ['A1', 'C2'],
        consignes: ['En B5 et C5, calculez les totaux avec SOMME.'],
        metadonnees: METADONNEES,
      } satisfies SheetPlanPublic;
      const cartes = {
        id: 'b2-01-a2-jeu-comparable',
        intitule: 'Comparable ou pas ?',
        cartes: OPTIONS,
        categories: [{ id: 'comparable', libelle: 'Comparable' }],
        dureeJeuMs: 240000,
        metadonnees: METADONNEES,
      } satisfies CardsortPlanPublic;
      const recit = {
        id: 'b2-01-a4-capsule',
        titre: 'Une formule qui se recopie, un tableau qui se contrôle',
        paragraphes: ['Une capsule de trois minutes.'],
        video: {
          src: '/assets/cours/b2-01/v3/capsule-720.webm',
          srcPoste: '/assets/cours/b2-01/v3/capsule-480.webm',
          type: 'video/webm',
          titre: 'Capsule tableur',
          transcript: 'Transcription intégrale.',
          source: '/formations/b2-01-traitement-information-chiffree',
          licence: 'CC BY-SA 4.0',
          sousTitres: {
            src: '/assets/cours/b2-01/v3/capsule.vtt',
            srclang: 'fr',
            libelle: 'Français',
          },
          preload: 'none',
        },
        metadonnees: METADONNEES,
      } satisfies StoryRecit;
      const plot = {
        id: 'B2-01-A5-04-SIMULATEUR-MIX',
        abscisse: { libelle: 'Part du sur-mesure', min: 0, max: 1 },
        ordonnee: 'Taux de marge global',
        parametres: [],
        series: [{ id: 'mix', libelle: 'Taux global', trait: 'plein', calcul: 'x' }],
        description: 'Le taux global suit la part de chaque canal.',
        metadonnees: METADONNEES,
      } satisfies PlotDefinition;
      const numerique: NumeriquePublic = {
        id: 'b2-01-a2-marge-g1',
        enonce: 'Taux d’évolution de la marge brute ?',
        unite: '%',
        metadonnees: METADONNEES,
      };
      const billet: ExitBilletPublic = buildExitBillet();
      const exemple: WorkedExemple = buildWorkedExemple();
      const concept4: Concept4Definition = buildConcept4Definition();
      const sondage: PulseSondage = buildPulseSondage();
      const donnees = {
        'fp-story': { recit },
        'fp-pro': { cas: buildProCas() },
        'fp-worked': { exemple, etayage: 2 },
        'fp-concept4': { definition: concept4 },
        'fp-plot': { definition: plot },
        'fp-challenge': {
          probleme: {
            id: 'b2-01-a5-defi',
            enonce: 'Quel canal renforcer ?',
            invite: 'Écrivez votre stratégie.',
            strategies: [],
            metadonnees: METADONNEES,
          },
        },
        'fp-cardsort': { plan: cartes },
        'fp-sheet': { plan: feuille },
        'fp-table-build': { plan: tableau },
        'fp-escape': { parcours: PARCOURS },
        'fp-pulse': { sondage },
        'fp-spaced': {
          rappel: { id: 'b2-01-rappel', intitule: 'Rappel espacé', metadonnees: METADONNEES },
        },
        'fp-numeric': { question: numerique },
        'fp-vote': { question: VOTE, questionJumelle: VOTE },
        'fp-recall': { question: { ...VOTE, metadonnees: METADONNEES }, delaiMs: 45000 },
        'fp-exit': { billet },
        questionnaire: {
          intitule: 'Atelier 1 — Comparer sans tromper',
          consigne: 'Répondez seul, sans vos notes.',
          regime: 'focus',
          ordre: 'fixe',
          questions: [
            { brique: 'fp-vote', donnees: { question: VOTE } },
            { brique: 'fp-numeric', donnees: { question: numerique } },
          ],
        },
        'ecran-verrouille': {},
      } satisfies DonneesParBrique;

      expect(Object.keys(donnees).length).toBe(18);
      expect(SPACED.boite).toBe(1);
      expect(JSON.stringify(donnees['fp-escape'])).not.toContain('fragment');
    });
  });

  describe('§ 9.7 — contrat de l’hôte', () => {
    it('traduit chaque événement de brique et chaque retour du serveur', () => {
      const etat: EtatPulse = 'clair';
      const evenements = [
        { kind: 'reponse', screenId: 'S', questionId: 'Q', valeur: 1300, dureeMs: 4000 },
        { kind: 'production', screenId: 'S', questionId: 'Q', valeur: PRODUCTION, dureeMs: 4000 },
        {
          kind: 'tentative',
          screenId: 'S',
          parcoursId: PARCOURS.id,
          enigmeId: 'enigme-1',
          reponse: '142 920',
          dureeMs: 4000,
        },
        { kind: 'libre', screenId: 'S', activityId: 'A', response: 'Texte.', dureeMs: 4000 },
        { kind: 'defi', screenId: 'S', defiId: 'D', texte: 'Tentative.', dureeMs: 4000 },
        { kind: 'jalon', screenId: 'S', sondageId: 'b2-01-jalon-1', etat },
      ] satisfies EvenementBrique[];
      const retours = [
        { kind: 'verdict-reponse', questionId: 'Q', correcte: true, libelleConfusion: null },
        {
          kind: 'verdict-production',
          questionId: 'Q',
          correcte: false,
          score: 13 / 17,
          details: [{ cle: 'E3', juste: false, libelleConfusion: null }],
        },
        {
          kind: 'tentative',
          parcoursId: PARCOURS.id,
          enigmeId: 'enigme-1',
          correcte: true,
          fragment: '7',
          tentativesRestantes: 9,
        },
        {
          kind: 'progression-enigmes',
          parcoursId: PARCOURS.id,
          resolues: [{ enigmeId: 'enigme-1', fragment: '7' }],
          tentativesRestantes: { 'enigme-2': 10 },
        },
        { kind: 'strategies', defiId: 'D', strategies: [{ id: 'coefficients', libelle: 'Coef.' }] },
        { kind: 'rappels', questions: [SPACED] },
        { kind: 'deja-repondu', questionId: 'Q' },
        { kind: 'refus', motif: 'reseau', message: 'Votre réponse n’a pas pu partir.' },
      ] satisfies RetourBrique[];
      const direct = {
        pilotage: PILOTAGE,
        resultats: [RESULTAT],
        comptesJalon: JALON,
      } satisfies DirectEcran;
      const directEtudiant: DirectEcran = { pilotage: {}, resultats: null, comptesJalon: null };

      expect(evenements.map((evenement) => evenement.kind)).toHaveSize(6);
      expect(retours.map((retour) => retour.kind)).toHaveSize(8);
      expect([direct.resultats.length, directEtudiant.resultats]).toEqual([1, null]);
    });

    it('refuse à la compilation les formes hors contrat', () => {
      const refusees = [
        {
          ...PARCOURS,
          enigmes: [
            {
              ...PARCOURS.enigmes[0],
              // @ts-expect-error une énigme publique ne porte aucun fragment
              fragment: '7',
            },
          ],
        } satisfies EscapeParcoursPublic,
        // @ts-expect-error « je ne sais pas » ne s’envoie qu’à vrai
        { type: 'tableau', neSaitPas: false } satisfies ValeurProduction,
        // @ts-expect-error la boîte de Leitner va de 1 à 3
        { ...SPACED, boite: 4 } satisfies SpacedQuestionPublique,
      ];

      expect(refusees.length).toBe(3);
    });
  });
});
