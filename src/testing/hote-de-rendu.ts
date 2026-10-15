export function hoteDeRendu(
  style: Partial<CSSStyleDeclaration> = {},
): (html: string) => HTMLElement {
  let hote: HTMLElement;

  beforeEach(() => {
    hote = document.createElement('div');
    Object.assign(hote.style, style);
    document.body.append(hote);
  });

  afterEach(() => hote.remove());

  return (html) => {
    hote.innerHTML = html;
    return hote;
  };
}
