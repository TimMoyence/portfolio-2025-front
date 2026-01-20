import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { CONTACT_PORT } from '../../core/ports/contact.port';
import { ContactComponent } from './contact.component';

describe('ContactComponent', () => {
  let component: ContactComponent;
  let fixture: ComponentFixture<ContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        {
          provide: CONTACT_PORT,
          useValue: {
            contact: () => of({ message: 'ok' }),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render main title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('[data-testid=\"hero-title\"]');
    expect(heading?.textContent).toContain(component.hero.title);
  });
});
