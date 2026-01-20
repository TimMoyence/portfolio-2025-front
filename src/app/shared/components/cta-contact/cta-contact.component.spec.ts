import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ContactCtaComponent } from "./cta-contact.component";

describe("ContactCtaComponent", () => {
  let component: ContactCtaComponent;
  let fixture: ComponentFixture<ContactCtaComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactCtaComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactCtaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display the heading and lead paragraph when provided", () => {
    component.leadParagraphs = ["Première phrase"];
    fixture.detectChanges();
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain(component.title);
    expect(compiled.textContent).toContain("Première phrase");
  });

  it("should render each contact method", () => {
    component.contactMethods.forEach((_: any, index: number) => {
      const method = fixture.nativeElement.querySelector(
        `[data-testid="contact-method-${index}"]`,
      );
      expect(method)
        .withContext(`Missing method at index ${index}`)
        .not.toBeNull();
    });
  });

  it("should set href attributes for linkable methods", () => {
    fixture.detectChanges();
    const compiled: HTMLElement = fixture.nativeElement;
    const links = compiled.querySelectorAll("a[href]");
    expect(links.length).toBeGreaterThan(0);
    component.contactMethods
      .filter((method: any) => !!method.href)
      .forEach((method) => {
        const match = Array.from(links).find((link) =>
          (link as HTMLAnchorElement).href.includes(method.href!),
        );
        expect(match).withContext(`Missing href for ${method.label}`).toBeTruthy();
      });
  });

  it("should render the contact map image", () => {
    const image = fixture.nativeElement.querySelector("img");
    expect(image).toBeTruthy();
    expect(image.getAttribute("src")).toBe(component.map.imageSrc);
    expect(image.getAttribute("alt")).toBe(component.map.alt);
  });
});
