export function isolateAnimReady(): void {
  const clearAnimReadyOnDocumentElement = (): void => {
    document.documentElement.classList.remove('anim-ready');
  };

  beforeEach(clearAnimReadyOnDocumentElement);
  afterEach(clearAnimReadyOnDocumentElement);
}
