import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { APP_CONFIG } from "../../core/config/app-config.token";
import { CONTACT_PORT } from "../../core/ports/contact.port";
import { ContactComponent } from "./contact.component";
import { environment } from "../../../environments/environment";
import { createContactPortStubWithDefault } from "../../../testing/factories/contact.factory";

describe("ContactComponent", () => {
  let component: ContactComponent;
  let fixture: ComponentFixture<ContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: APP_CONFIG,
          useValue: environment,
        },
        {
          provide: CONTACT_PORT,
          useValue: createContactPortStubWithDefault(),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render main title", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('[data-testid="hero-title"]');
    expect(heading?.textContent).toContain(component.hero.title);
  });

  // --- Presence du formulaire ---

  it("devrait afficher le formulaire de contact avec les champs texte", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const form = compiled.querySelector("form");
    expect(form).not.toBeNull();

    // Les 4 champs sont rendus via @for sur contactFields
    const inputs = form?.querySelectorAll(
      "input:not([type=radio]):not([type=checkbox])",
    );
    expect(inputs?.length).toBeGreaterThanOrEqual(
      component.contactFields.length,
    );

    // Verifie la presence de chaque champ par son id
    for (const field of component.contactFields) {
      const input = compiled.querySelector(`#${field.key}`);
      expect(input).withContext(`champ ${field.key} attendu`).not.toBeNull();
    }
  });

  it("devrait afficher le selecteur de sujet", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const subjectSelect = compiled.querySelector('select[name="subject"]');
    expect(subjectSelect).not.toBeNull();

    // Verifie que les options de sujet sont presentes (+ l'option placeholder)
    const options = subjectSelect?.querySelectorAll("option");
    // 1 placeholder + 3 sujets = 4 options
    expect(options?.length).toBeGreaterThanOrEqual(4);
  });

  it("devrait afficher les boutons radio de role", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const roleRadios = compiled.querySelectorAll('input[name="role"]');
    // 6 roles definis dans le composant
    expect(roleRadios.length).toBe(component.contactInfo.roles.length);
  });

  it("devrait afficher le champ message (textarea)", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const textarea = compiled.querySelector('textarea[name="message"]');
    expect(textarea).not.toBeNull();
  });

  it("devrait afficher la case a cocher des conditions", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const termsCheckbox = compiled.querySelector(
      'input[name="terms"][type="checkbox"]',
    );
    expect(termsCheckbox).not.toBeNull();
  });

  it("devrait afficher le bouton d'envoi", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const submitButton = compiled.querySelector('button[type="submit"]');
    expect(submitButton).not.toBeNull();
  });

  // --- Etat initial ---

  it("devrait initialiser le formulaire avec isContactLoading a false", () => {
    expect(component.isContactLoading).toBeFalse();
    expect(component.isContactSubmitted).toBeFalse();
  });

  it("devrait initialiser le formulaire avec les champs vides", () => {
    expect(component.contactForm.email).toBe("");
    expect(component.contactForm.firstName).toBe("");
    expect(component.contactForm.message).toBe("");
    expect(component.contactForm.terms).toBeFalse();
  });
});
