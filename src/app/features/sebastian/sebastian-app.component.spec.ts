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
});
