import { ComponentFixture, TestBed } from "@angular/core/testing";
import { QrCodeComponent } from "./qr-code.component";

describe("QrCodeComponent", () => {
  let component: QrCodeComponent;
  let fixture: ComponentFixture<QrCodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrCodeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QrCodeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("data", "https://asilidesign.fr/test");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render a container div", () => {
    const container = fixture.nativeElement.querySelector(
      "[data-qr-container]",
    );
    expect(container).toBeTruthy();
  });

  it("should accept custom size input", () => {
    fixture.componentRef.setInput("size", 300);
    fixture.detectChanges();
    expect(component.size()).toBe(300);
  });

  it("should accept custom color input", () => {
    fixture.componentRef.setInput("color", "#ff0000");
    fixture.detectChanges();
    expect(component.color()).toBe("#ff0000");
  });
});
