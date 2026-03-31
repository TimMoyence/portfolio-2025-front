import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { SpaghettiPlotComponent } from "./spaghetti-plot.component";

describe("SpaghettiPlotComponent", () => {
  let component: SpaghettiPlotComponent;
  let fixture: ComponentFixture<SpaghettiPlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpaghettiPlotComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpaghettiPlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait avoir des donnees ensemble nulles par defaut", () => {
    expect(component.ensemble()).toBeNull();
  });
});
