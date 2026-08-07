import { of, throwError } from 'rxjs';
import type { LeadMagnetPort } from '../../app/core/ports/lead-magnet.port';
import type { ToolkitPageData } from '../../app/core/models/toolkit-page.model';

export function createLeadMagnetPortStub(): jasmine.SpyObj<LeadMagnetPort> {
  const stub = jasmine.createSpyObj<LeadMagnetPort>('LeadMagnetPort', [
    'requestToolkit',
    'getToolkitByToken',
  ]);
  stub.requestToolkit.and.returnValue(
    of({
      message: 'Votre boite a outils a ete envoyee a test@example.com',
      accessToken: 'fake-token-123',
    }),
  );
  return stub;
}

export function buildToolkitPageData(overrides: Partial<ToolkitPageData> = {}): ToolkitPageData {
  return {
    recap: {
      firstName: 'Tim',
      aiLevel: 'debutant',
      sector: 'conseil',
      budgetTier: '0-50',
    },
    cheatsheet: [
      {
        tool: 'ChatGPT',
        category: 'Redaction',
        price: 'Gratuit',
        url: 'https://chat.openai.com',
        tip: "Brouillons d'emails en quelques secondes",
        decision: 'Adopter',
        alreadyUsed: false,
      },
    ],
    prompts: [
      {
        category: 'Vente',
        title: 'Email de relance',
        level: 'debutant',
        prompt: 'Redige un email de relance pour un devis sans reponse.',
        tool: 'ChatGPT',
      },
    ],
    workflows: [
      {
        title: 'Devis automatise',
        description: "Generer un devis a partir d'un brief.",
        setupTime: '1h',
        monthlyCost: '0EUR',
        steps: [
          {
            step: 1,
            action: 'Capturer le brief',
            tool: 'Tally',
            detail: 'Formulaire',
          },
        ],
        tools: ['Tally', 'Make'],
      },
    ],
    templates: [
      {
        name: 'Template de devis',
        platform: 'Notion',
        url: 'https://notion.so/template',
        description: 'Un devis pret a dupliquer.',
        minBudget: '0EUR',
      },
    ],
    generatedPrompt: 'Cree une presentation Gamma pour un cabinet de conseil.',
    ...overrides,
  };
}

export function createLeadMagnetPortStubWithError(): jasmine.SpyObj<LeadMagnetPort> {
  const stub = jasmine.createSpyObj<LeadMagnetPort>('LeadMagnetPort', [
    'requestToolkit',
    'getToolkitByToken',
  ]);
  stub.requestToolkit.and.returnValue(throwError(() => new Error('Network error')));
  return stub;
}
