// import { ComponentFixture, TestBed } from '@angular/core/testing';

// import { NavbarComponent } from './navbar.component';

// describe('NavbarComponent', () => {
//   let component: NavbarComponent;
//   let fixture: ComponentFixture<NavbarComponent>;
//   let mockMatches = false;

//   const createMediaQueryList = (matches: boolean): MediaQueryList =>
//     ({
//       matches,
//       media: '',
//       onchange: null,
//       addListener: () => undefined,
//       removeListener: () => undefined,
//       addEventListener: () => undefined,
//       removeEventListener: () => undefined,
//       dispatchEvent: () => false,
//     } as MediaQueryList);

//   beforeEach(async () => {
//     mockMatches = false;

//     await TestBed.configureTestingModule({
//       imports: [NavbarComponent],
//     }).compileComponents();

//     if (!window.matchMedia) {
//       (window as any).matchMedia = () => createMediaQueryList(false);
//     }

//     spyOn(window, 'matchMedia').and.callFake(() =>
//       createMediaQueryList(mockMatches),
//     );

//     fixture = TestBed.createComponent(NavbarComponent);
//     component = fixture.componentInstance;
//   });

//   it('should create', () => {
//     fixture.detectChanges();

//     expect(component).toBeTruthy();
//   });

//   // it('should render the expected navigation links', () => {
//   //   fixture.detectChanges();

//   //   const linkTexts = Array.from(
//   //     fixture.nativeElement.querySelectorAll('nav a'),
//   //   ).map((link: Element) => link.textContent?.trim());

//   //   expect(linkTexts).toEqual(['Accueil', 'Cours', 'Présentation']);
//   // });

//   it('should toggle the mobile menu visibility', () => {
//     mockMatches = true;
//     fixture.detectChanges();

//     const toggleButton = fixture.nativeElement.querySelector(
//       '[data-testid="mobile-toggle"]',
//     ) as HTMLButtonElement;
//     const navContainer = fixture.nativeElement.querySelector(
//       '#navbar-links',
//     ) as HTMLElement;

//     toggleButton.click();
//     fixture.detectChanges();

//     expect(component.isMobileMenuOpen).toBeTrue();
//     expect(navContainer.classList.contains('hidden')).toBeFalse();

//     toggleButton.click();
//     fixture.detectChanges();

//     expect(component.isMobileMenuOpen).toBeFalse();
//     expect(navContainer.classList.contains('hidden')).toBeTrue();
//   });

//   it('should open and close dropdowns on desktop hover', () => {
//     fixture.detectChanges();

//     const dropdownContainer = fixture.nativeElement.querySelector(
//       '[data-testid="dropdown-container-0"]',
//     ) as HTMLElement;

//     dropdownContainer.dispatchEvent(new Event('mouseenter'));
//     fixture.detectChanges();

//     expect(component.isDropdownOpen).toBeTrue();
//     expect(dropdownContainer.textContent).toContain('PresQ');

//     dropdownContainer.dispatchEvent(new Event('mouseleave'));
//     fixture.detectChanges();

//     expect(component.isDropdownOpen).toBeFalse();
//   });

//   it('should toggle the dropdown on mobile via button click', () => {
//     mockMatches = true;
//     fixture.detectChanges();

//     const mobileToggle = fixture.nativeElement.querySelector(
//       '[data-testid="mobile-toggle"]',
//     ) as HTMLButtonElement;
//     mobileToggle.click();
//     fixture.detectChanges();

//     const dropdownButton = fixture.nativeElement.querySelector(
//       '[data-testid="dropdown-button-0"]',
//     ) as HTMLButtonElement;

//     dropdownButton.click();
//     fixture.detectChanges();
//     expect(component.isDropdownOpen).toBeTrue();

//     dropdownButton.click();
//     fixture.detectChanges();
//     expect(component.isDropdownOpen).toBeFalse();
//   });
// });
