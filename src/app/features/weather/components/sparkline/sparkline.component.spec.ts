import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { PLATFORM_ID } from "@angular/core";
import { SparklineComponent } from "./sparkline.component";

describe("SparklineComponent", () => {
  let component: SparklineComponent;
  let fixture: ComponentFixture<SparklineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SparklineComponent],
      providers: [{ provide: PLATFORM_ID, useValue: "browser" }],
    }).compileComponents();

    fixture = TestBed.createComponent(SparklineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("ne devrait rien afficher pour un tableau vide", () => {
    fixture.componentRef.setInput("data", []);
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector("svg");
    expect(svg).toBeNull();
  });

  it("ne devrait rien afficher pour moins de 2 points", () => {
    fixture.componentRef.setInput("data", [42]);
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector("svg");
    expect(svg).toBeNull();
  });

  it("devrait afficher un SVG pour un tableau de donnees valides", () => {
    fixture.componentRef.setInput("data", [10, 20, 15, 25, 18]);
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg.querySelector("polyline")).toBeTruthy();
    expect(svg.querySelector("path")).toBeTruthy();
  });

  it("devrait generer les points polyline corrects", () => {
    fixture.componentRef.setInput("data", [0, 10]);
    fixture.detectChanges();
    const polylinePoints = component.polylinePoints();
    // 2 points : x=0,y=30 (min en bas) et x=100,y=0 (max en haut)
    expect(polylinePoints).toBe("0,30 100,0");
  });

  it("devrait utiliser la couleur fournie", () => {
    fixture.componentRef.setInput("data", [10, 20, 30]);
    fixture.componentRef.setInput("color", "rgba(250, 204, 21, 0.8)");
    fixture.detectChanges();
    const polyline = fixture.nativeElement.querySelector("polyline");
    expect(polyline.getAttribute("stroke")).toBe("rgba(250, 204, 21, 0.8)");
    const path = fixture.nativeElement.querySelector("path");
    expect(path.getAttribute("fill")).toBe("rgba(250, 204, 21, 0.8)");
  });
});
