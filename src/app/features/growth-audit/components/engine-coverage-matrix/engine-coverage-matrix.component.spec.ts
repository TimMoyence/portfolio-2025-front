import { TestBed } from "@angular/core/testing";
import { buildClientReport } from "../../../../../testing/factories/audit-request.factory";
import { EngineCoverageMatrixComponent } from "./engine-coverage-matrix.component";

describe("EngineCoverageMatrixComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EngineCoverageMatrixComponent],
    }).compileComponents();
  });

  it("devrait afficher les deux scores Google et IA", () => {
    const fixture = TestBed.createComponent(EngineCoverageMatrixComponent);
    fixture.componentInstance.matrix = buildClientReport().googleVsAiMatrix;
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain("72");
    expect(text).toContain("34");
    expect(text).toContain("Visibilité Google");
    expect(text).toContain("Visibilité IA");
  });

  it("devrait afficher les summaries Google et IA", () => {
    const fixture = TestBed.createComponent(EngineCoverageMatrixComponent);
    fixture.componentInstance.matrix = {
      googleVisibility: { score: 80, summary: "Summary Google ici" },
      aiVisibility: { score: 45, summary: "Summary IA ici" },
    };
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain("Summary Google ici");
    expect(text).toContain("Summary IA ici");
  });

  it("devrait rendre exactement deux cards moteur", () => {
    const fixture = TestBed.createComponent(EngineCoverageMatrixComponent);
    fixture.componentInstance.matrix = buildClientReport().googleVsAiMatrix;
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll(
      "[data-testid='engine-card']",
    );
    expect(cards.length).toBe(2);
  });
});
