import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactComponent } from './contact.component';

describe('ContactComponent', () => {
  let component: ContactComponent;
  let fixture: ComponentFixture<ContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the heading and subtitle', () => {
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain(component.title);
    expect(compiled.textContent).toContain(component.subtitle);
  });

  it('should render each contact method', () => {
    component.contactMethods.forEach((_, index) => {
      const method = fixture.nativeElement.querySelector(
        `[data-testid="contact-method-${index}"]`,
      );
      expect(method).withContext(`Missing method at index ${index}`).not.toBeNull();
    });
  });

  it('should set href attributes for linkable methods', () => {
    const compiled: HTMLElement = fixture.nativeElement;
    const links = compiled.querySelectorAll('a.underline');
    const expectedLinkCount = component.contactMethods.filter(
      (method) => !!method.href,
    ).length;
    expect(links.length).toBe(expectedLinkCount);
  });

  it('should render the contact map image', () => {
    const image = fixture.nativeElement.querySelector('img');
    expect(image).toBeTruthy();
    expect(image.getAttribute('src')).toBe(component.map.imageSrc);
    expect(image.getAttribute('alt')).toBe(component.map.alt);
  });
});
