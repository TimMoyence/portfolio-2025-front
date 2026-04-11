import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FragmentDirective } from "./fragment.directive";
import { FragmentService } from "../services/fragment.service";

@Component({
  template: `
    <div [appFragment]="0" data-testid="frag-0">Premier</div>
    <div [appFragment]="1" data-testid="frag-1">Deuxieme</div>
    <div [appFragment]="2" data-testid="frag-2">Troisieme</div>
  `,
  standalone: true,
  imports: [FragmentDirective],
  providers: [FragmentService],
})
class TestHostComponent {
  constructor(readonly fragmentService: FragmentService) {}
}

describe("FragmentDirective", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let service: FragmentService;

  function getFragment(index: number): HTMLElement {
    return fixture.nativeElement.querySelector(
      `[data-testid="frag-${index}"]`,
    ) as HTMLElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    service = fixture.componentInstance.fragmentService;
    service.reset(3);
    fixture.detectChanges();
  });

  it("devrait marquer tous les fragments comme hidden au demarrage", () => {
    const frag0 = getFragment(0);
    const frag1 = getFragment(1);
    const frag2 = getFragment(2);

    expect(frag0.classList.contains("fragment-hidden")).toBeTrue();
    expect(frag1.classList.contains("fragment-hidden")).toBeTrue();
    expect(frag2.classList.contains("fragment-hidden")).toBeTrue();
  });

  it("devrait rendre le fragment 0 visible quand visibleCount >= 1", () => {
    service.next();
    fixture.detectChanges();

    const frag0 = getFragment(0);
    expect(frag0.classList.contains("fragment-visible")).toBeTrue();
    expect(frag0.classList.contains("fragment-hidden")).toBeFalse();
  });

  it("devrait garder le fragment 2 hidden quand visibleCount < 3", () => {
    service.next();
    service.next();
    fixture.detectChanges();

    const frag2 = getFragment(2);
    expect(frag2.classList.contains("fragment-hidden")).toBeTrue();
    expect(frag2.classList.contains("fragment-visible")).toBeFalse();
  });

  it("devrait rendre tous les fragments visibles apres showAll", () => {
    service.showAll();
    fixture.detectChanges();

    expect(getFragment(0).classList.contains("fragment-visible")).toBeTrue();
    expect(getFragment(1).classList.contains("fragment-visible")).toBeTrue();
    expect(getFragment(2).classList.contains("fragment-visible")).toBeTrue();
  });

  it("devrait appliquer les styles inline de transition", () => {
    const frag0 = getFragment(0);

    expect(frag0.style.transition).toContain("opacity");
    expect(frag0.style.transition).toContain("transform");
  });

  it("devrait avoir opacity 0 et translateY(12px) quand hidden", () => {
    const frag0 = getFragment(0);

    expect(frag0.style.opacity).toBe("0");
    expect(frag0.style.transform).toBe("translateY(12px)");
  });

  it("devrait avoir opacity 1 et translateY(0) quand visible", () => {
    service.next();
    fixture.detectChanges();

    const frag0 = getFragment(0);
    expect(frag0.style.opacity).toBe("1");
    expect(frag0.style.transform).toContain("translateY(0");
  });

  it("devrait basculer la classe CSS quand on revient en arriere avec prev", () => {
    service.next();
    service.next();
    fixture.detectChanges();
    expect(getFragment(1).classList.contains("fragment-visible")).toBeTrue();

    service.prev();
    fixture.detectChanges();
    expect(getFragment(1).classList.contains("fragment-hidden")).toBeTrue();
    expect(getFragment(1).classList.contains("fragment-visible")).toBeFalse();
  });
});
