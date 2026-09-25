export function sousHorlogeSimulee(preparer: () => void = () => undefined): void {
  beforeEach(() => {
    jasmine.clock().install();
    preparer();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });
}
