import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { SebastianPresentationComponent } from "./sebastian-presentation.component";

describe("SebastianPresentationComponent", () => {
  let component: SebastianPresentationComponent;
  let fixture: ComponentFixture<SebastianPresentationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SebastianPresentationComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SebastianPresentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });
});
