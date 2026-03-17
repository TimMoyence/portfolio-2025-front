import { HttpClientTestingModule } from "@angular/common/http/testing";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import type { ContactMethod } from "../../models/contact.model";
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
    component.contactMethods.forEach((_: ContactMethod, index: number) => {
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
    const links = Array.from(
      compiled.querySelectorAll("a[href]"),
    ) as HTMLAnchorElement[];
    expect(links.length).toBeGreaterThan(0);
    component.contactMethods
      .filter((method: ContactMethod) => !!method.href)
      .forEach((method) => {
        const match = links.find(
          (link) =>
            link.getAttribute("href") === method.href ||
            link.textContent?.includes(method.value),
        );
        expect(match)
          .withContext(`Missing href for ${method.label}`)
          .toBeTruthy();
      });
  });

  it("should render the contact section heading", () => {
    const heading = fixture.nativeElement.querySelector("#contact-heading");
    expect(heading?.textContent).toContain(component.title);
  });
});
