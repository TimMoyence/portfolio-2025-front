import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { SebastianAppComponent } from "./sebastian-app.component";

describe("SebastianAppComponent", () => {
  let component: SebastianAppComponent;
  let fixture: ComponentFixture<SebastianAppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SebastianAppComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SebastianAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait afficher le titre Sebastian", () => {
    // Arrange & Act
    const h1: HTMLHeadingElement | null =
      fixture.nativeElement.querySelector("h1");

    // Assert
    expect(h1).toBeTruthy();
    expect(h1!.textContent!.trim()).toBe("Sebastian");
  });

  it("devrait afficher le message en construction", () => {
    // Arrange & Act
    const content = fixture.nativeElement.textContent as string;

    // Assert
    expect(content).toContain("En construction");
  });

  it("devrait avoir une section centree avec hauteur minimum", () => {
    // Arrange & Act
    const section: HTMLElement | null =
      fixture.nativeElement.querySelector("section");

    // Assert
    expect(section).toBeTruthy();
    expect(section!.classList).toContain("min-h-[60vh]");
  });
});
