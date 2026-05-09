import { ComponentRef } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { buildBudgetMember } from "../../../../../testing/factories/budget.factory";
import { BudgetMembersPanelComponent } from "./budget-members-panel.component";

describe("BudgetMembersPanelComponent", () => {
  let componentRef: ComponentRef<BudgetMembersPanelComponent>;

  const ownerMember = buildBudgetMember({
    userId: "owner-1",
    email: "owner@example.com",
    displayName: "Alice",
    isOwner: true,
  });

  const regularMember = buildBudgetMember({
    userId: "user-2",
    email: "bob@example.com",
    displayName: "Bob",
    isOwner: false,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetMembersPanelComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(BudgetMembersPanelComponent);
    componentRef = fixture.componentRef;
    componentRef.setInput("members", [ownerMember, regularMember]);
    componentRef.setInput("currentUserId", "owner-1");
    fixture.detectChanges();
  });

  it("doit afficher le displayName et email de chaque membre", () => {
    const fixture = TestBed.createComponent(BudgetMembersPanelComponent);
    const cmpRef = fixture.componentRef;
    cmpRef.setInput("members", [ownerMember, regularMember]);
    cmpRef.setInput("currentUserId", "owner-1");
    fixture.detectChanges();

    const nativeEl: HTMLElement = fixture.nativeElement;
    expect(nativeEl.textContent).toContain("Alice");
    expect(nativeEl.textContent).toContain("owner@example.com");
    expect(nativeEl.textContent).toContain("Bob");
    expect(nativeEl.textContent).toContain("bob@example.com");
  });

  it("doit afficher le bouton Inviter si current user est owner, masque sinon", () => {
    const fixture = TestBed.createComponent(BudgetMembersPanelComponent);
    const cmpRef = fixture.componentRef;
    cmpRef.setInput("members", [ownerMember, regularMember]);
    cmpRef.setInput("currentUserId", "owner-1");
    fixture.detectChanges();

    let nativeEl: HTMLElement = fixture.nativeElement;
    // Cherche par contenu si attribut i18n non visible
    let buttons = nativeEl.querySelectorAll("button");
    const inviteBtnByText = Array.from(buttons).find((b) =>
      b.textContent?.includes("Inviter"),
    );
    expect(inviteBtnByText).toBeTruthy();

    // Maintenant non-owner
    const fixture2 = TestBed.createComponent(BudgetMembersPanelComponent);
    const cmpRef2 = fixture2.componentRef;
    cmpRef2.setInput("members", [ownerMember, regularMember]);
    cmpRef2.setInput("currentUserId", "user-2");
    fixture2.detectChanges();

    nativeEl = fixture2.nativeElement;
    buttons = nativeEl.querySelectorAll("button");
    const inviteBtnByText2 = Array.from(buttons).find((b) =>
      b.textContent?.includes("Inviter"),
    );
    expect(inviteBtnByText2).toBeFalsy();
  });

  it("doit afficher le bouton Retirer uniquement pour les membres non-owner si current est owner", () => {
    const fixture = TestBed.createComponent(BudgetMembersPanelComponent);
    const cmpRef = fixture.componentRef;
    cmpRef.setInput("members", [ownerMember, regularMember]);
    cmpRef.setInput("currentUserId", "owner-1");
    fixture.detectChanges();

    const nativeEl: HTMLElement = fixture.nativeElement;
    const buttons = nativeEl.querySelectorAll("button");
    const retirerBtns = Array.from(buttons).filter((b) =>
      b.textContent?.includes("Retirer"),
    );
    // Seul Bob (user-2, non-owner) doit avoir un bouton Retirer
    expect(retirerBtns.length).toBe(1);
  });

  it("doit emettre removeMember quand on clique Retirer et que confirm retourne true", () => {
    const fixture = TestBed.createComponent(BudgetMembersPanelComponent);
    const cmpRef = fixture.componentRef;
    cmpRef.setInput("members", [ownerMember, regularMember]);
    cmpRef.setInput("currentUserId", "owner-1");
    fixture.detectChanges();

    spyOn(window, "confirm").and.returnValue(true);
    const emitted: string[] = [];
    fixture.componentInstance.removeMember.subscribe((id: string) =>
      emitted.push(id),
    );

    const nativeEl: HTMLElement = fixture.nativeElement;
    const buttons = nativeEl.querySelectorAll("button");
    const retirerBtn = Array.from(buttons).find((b) =>
      b.textContent?.includes("Retirer"),
    );
    retirerBtn?.click();

    expect(window.confirm).toHaveBeenCalled();
    expect(emitted).toContain("user-2");
  });
});
