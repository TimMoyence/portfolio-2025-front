import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientProjectComponent } from './client-project.component';

describe('ClientProjectComponent', () => {
  let component: ClientProjectComponent;
  let fixture: ComponentFixture<ClientProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientProjectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render main title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('[data-testid="hero-title"]');
    expect(heading?.textContent).toContain('Mes projets web réalisés');
  });
});
