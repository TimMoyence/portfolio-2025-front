import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { FooterComponent } from "./footer.component";

describe("FooterComponent", () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render all navigation columns and links", () => {
    const columns = fixture.nativeElement.querySelectorAll(
      '[data-testid="footer-column"]',
    );
    expect(columns.length).toBe(component.navColumns.length);

    component.navColumns.forEach((column, index) => {
      const renderedLinks = columns[index].querySelectorAll("li");
      expect(renderedLinks.length).toBe(column.links.length);
    });
  });

  // it('should display the address and contact information', () => {
  //   const compiled: HTMLElement = fixture.nativeElement;

  //   expect(compiled.textContent).toContain(component.address.city);
  //   expect(compiled.textContent).toContain(component.address.phone);
  //   expect(compiled.textContent).toContain(component.address.email);
  // });

  it("should point the « Projets » work link to /projets", () => {
    const workColumn = component.navColumns.find(
      (column) => column.heading === "Travailler",
    );
    const projetsLink = workColumn?.links.find(
      (link) => link.label === "Projets",
    );
    expect(projetsLink?.href).toBe("/projets");
  });

  it("should expose the « L'Atelier » hub link to /atelier in its column", () => {
    const atelierColumn = component.navColumns.find(
      (column) => column.heading === "L'Atelier",
    );
    const hubLink = atelierColumn?.links.find(
      (link) => link.label === "L'Atelier",
    );
    expect(hubLink?.href).toBe("/atelier");
  });

  it("should render a social link entry for each configured link", () => {
    const socialLinks = fixture.nativeElement.querySelectorAll(
      '[data-testid="social-link"]',
    );
    expect(socialLinks.length).toBe(component.socialLinks.length);
  });

  it("should include the legal links list", () => {
    const legalList = fixture.nativeElement.querySelector(
      '[data-testid="legal-links"]',
    );
    expect(legalList).toBeTruthy();
    expect(legalList.querySelectorAll("li").length).toBe(
      component.legalLinks.length,
    );
  });

  it("should render the Asili brand logo with name and teal dot", () => {
    const compiled: HTMLElement = fixture.nativeElement;
    const logo = compiled.querySelector(".asili-logo");
    expect(logo).toBeTruthy();
    expect(logo?.querySelector(".asili-logo__name")?.textContent).toContain(
      "Asili",
    );
    expect(logo?.querySelector(".asili-logo__dot")).toBeTruthy();
  });

  it("should render the brand baseline", () => {
    const baseline = fixture.nativeElement.querySelector(
      ".asili-footer__baseline",
    );
    expect(baseline?.textContent?.trim()).toBe(component.brandBaseline);
  });

  it("should render the freshness chip with a live dot, label and <time>", () => {
    const fresh = fixture.nativeElement.querySelector(".asili-footer__fresh");
    expect(fresh).toBeTruthy();
    expect(fresh.querySelector(".asili-footer__live-dot")).toBeTruthy();
    expect(fresh.querySelector(".asili-footer__fresh-label")?.textContent).toBe(
      component.freshLabel,
    );
  });

  // P2.10 : signal de fraicheur SEO/IA — le <time datetime> doit rester dans le DOM.
  it("should expose a <time datetime> bound to siteLastUpdated for SEO", () => {
    const time: HTMLTimeElement | null =
      fixture.nativeElement.querySelector("time[datetime]");
    expect(time).toBeTruthy();
    expect(time?.getAttribute("datetime")).toBe(component.siteLastUpdated);
    expect(time?.textContent?.trim()).toBe(component.siteLastUpdated);
  });

  // P2.11 : adresse postale structuree visible pour SEO local Bordeaux.
  it("should keep the structured <address> with postal address microdata", () => {
    const address = fixture.nativeElement.querySelector("address[itemscope]");
    expect(address).toBeTruthy();
    expect(
      address.querySelector('[itemprop="address"][itemscope]'),
    ).toBeTruthy();
    expect(
      address.querySelector('[itemprop="addressLocality"]')?.textContent,
    ).toContain("Bordeaux");
  });
});
