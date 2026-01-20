import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all navigation columns and links', () => {
    const columns = fixture.nativeElement.querySelectorAll(
      '[data-testid="footer-column"]',
    );
    expect(columns.length).toBe(component.navColumns.length);

    component.navColumns.forEach((column, index) => {
      const renderedLinks = columns[index].querySelectorAll('li');
      expect(renderedLinks.length).toBe(column.links.length);
    });
  });

  it('should display the address and contact information', () => {
    const compiled: HTMLElement = fixture.nativeElement;

    expect(compiled.textContent).toContain(component.address.city);
    expect(compiled.textContent).toContain(component.address.phone);
    expect(compiled.textContent).toContain(component.address.email);
  });

  it('should render a social link entry for each configured link', () => {
    const socialLinks = fixture.nativeElement.querySelectorAll(
      '[data-testid="social-link"]',
    );
    expect(socialLinks.length).toBe(component.socialLinks.length);
  });

  it('should include the legal links list', () => {
    const legalList = fixture.nativeElement.querySelector(
      '[data-testid="legal-links"]',
    );
    expect(legalList).toBeTruthy();
    expect(legalList.querySelectorAll('li').length).toBe(
      component.legalLinks.length,
    );
  });
});
