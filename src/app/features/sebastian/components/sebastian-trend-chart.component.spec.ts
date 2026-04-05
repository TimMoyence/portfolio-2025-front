import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { Component, signal } from "@angular/core";
import type { SebastianTrendData } from "../../../core/models/sebastian.model";
import { buildSebastianTrendData } from "../../../../testing/factories/sebastian.factory";
import { SebastianTrendChartComponent } from "./sebastian-trend-chart.component";

/**
 * Hote de test pour fournir l'input requis via un signal.
 */
@Component({
  standalone: true,
  imports: [SebastianTrendChartComponent],
  template: `<app-sebastian-trend-chart [data]="data()" />`,
})
class TestHostComponent {
  readonly data = signal<SebastianTrendData>(buildSebastianTrendData());
}

describe("SebastianTrendChartComponent", () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    const chart = fixture.nativeElement.querySelector(
      "app-sebastian-trend-chart",
    );
    expect(chart).toBeTruthy();
  });

  it("devrait rendre un element canvas", () => {
    const canvas: HTMLCanvasElement | null =
      fixture.nativeElement.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("devrait appliquer la classe w-full au canvas", () => {
    const canvas: HTMLCanvasElement | null =
      fixture.nativeElement.querySelector("canvas");
    expect(canvas).toBeTruthy();
    expect(canvas!.classList).toContain("w-full");
  });
});
