interface ToolkitGateItem {
  label: string;
}

interface ToolkitGateFaq {
  question: string;
  answer: string;
}

export interface ToolkitGatePageData {
  lead: string;
  items: readonly ToolkitGateItem[];
  foot: string;
  contentsTitle: string;
  contents: readonly string[];
  faqTitle: string;
  faq: readonly ToolkitGateFaq[];
  brand: string;
  privacyLabel: string;
}
