import { ComponentFixture, TestBed } from "@angular/core/testing";
import type { PendingInvitation } from "../../../../core/ports/budget.port";
import { BudgetPendingInvitationsComponent } from "./budget-pending-invitations.component";

describe("BudgetPendingInvitationsComponent", () => {
  let fixture: ComponentFixture<BudgetPendingInvitationsComponent>;
  let component: BudgetPendingInvitationsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetPendingInvitationsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetPendingInvitationsComponent);
    component = fixture.componentInstance;
  });

  function setInvitations(invitations: PendingInvitation[]) {
    fixture.componentRef.setInput("invitations", invitations);
    fixture.detectChanges();
  }

  it("ne rend rien quand la liste est vide", () => {
    setInvitations([]);
    const el = fixture.nativeElement as HTMLElement;
    expect(
      el.querySelector('[data-testid="budget-pending-invitations"]'),
    ).toBeNull();
  });

  it("rend chaque invitation avec son email", () => {
    setInvitations([
      {
        id: "i1",
        targetEmail: "a@test.com",
        expiresAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: "i2",
        targetEmail: "b@test.com",
        expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ]);

    const items = (fixture.nativeElement as HTMLElement).querySelectorAll("li");
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain("a@test.com");
    expect(items[1].textContent).toContain("b@test.com");
  });

  it("calcule daysLeft (arrondi a la hausse) — 3 jours restants", () => {
    setInvitations([
      {
        id: "i1",
        targetEmail: "a@test.com",
        // +2.5 jours -> ceil = 3
        expiresAt: new Date(Date.now() + 2.5 * 86_400_000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ]);

    expect(component.enriched()[0].daysLeft).toBe(3);
  });

  it("clamp daysLeft a 0 quand l'invitation est expiree", () => {
    setInvitations([
      {
        id: "i1",
        targetEmail: "expired@test.com",
        expiresAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ]);

    expect(component.enriched()[0].daysLeft).toBe(0);
  });
});
