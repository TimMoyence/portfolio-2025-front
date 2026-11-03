export function faqRendue(racine: HTMLElement, questionsAttendues: number): HTMLElement {
  const faq = racine.querySelector<HTMLElement>('.faq[itemtype="https://schema.org/FAQPage"]');
  expect(faq).not.toBeNull();
  expect(racine.querySelectorAll('.faq details.faq-item').length).toBe(questionsAttendues);
  return faq!;
}
