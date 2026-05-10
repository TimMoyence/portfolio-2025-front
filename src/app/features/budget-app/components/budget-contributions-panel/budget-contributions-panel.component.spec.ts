import { ComponentRef } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  buildBudgetMember,
  buildBudgetMemberContribution,
} from "../../../../../testing/factories/budget.factory";
import { BudgetContributionsPanelComponent } from "./budget-contributions-panel.component";

describe("BudgetContributionsPanelComponent", () => {
  const member1 = buildBudgetMember({
    userId: "user-1",
    displayName: "Alice",
    isOwner: true,
  });
  const member2 = buildBudgetMember({
    userId: "user-2",
    displayName: "Bob",
    isOwner: false,
  });

  const contrib1 = buildBudgetMemberContribution({
    userId: "user-1",
    monthlySalary: 3000,
  });
  const contrib2 = buildBudgetMemberContribution({
    id: "contrib-2",
    userId: "user-2",
    monthlySalary: 2000,
  });

  async function createFixture(
    overrides: Partial<{
      members: (typeof member1)[];
      contributions: (typeof contrib1)[];
      currentUserId: string;
      previousMonthContributions: (typeof contrib1)[];
    }> = {},
  ) {
    await TestBed.configureTestingModule({
      imports: [BudgetContributionsPanelComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(BudgetContributionsPanelComponent);
    const cmpRef: ComponentRef<BudgetContributionsPanelComponent> =
      fixture.componentRef;
    cmpRef.setInput("members", overrides.members ?? [member1, member2]);
    cmpRef.setInput("contributions", overrides.contributions ?? []);
    cmpRef.setInput("currentUserId", overrides.currentUserId ?? "user-1");
    if (overrides.previousMonthContributions !== undefined) {
      cmpRef.setInput(
        "previousMonthContributions",
        overrides.previousMonthContributions,
      );
    }
    fixture.detectChanges();
    return fixture;
  }

  it("doit afficher le displayName de chaque membre", async () => {
    const fixture = await createFixture({
      contributions: [contrib1, contrib2],
    });
    const nativeEl: HTMLElement = fixture.nativeElement;
    expect(nativeEl.textContent).toContain("Alice");
    expect(nativeEl.textContent).toContain("Bob");
  });

  it("doit afficher le placeholder du mois precedent si pas de contribution courante", async () => {
    const prevContrib = buildBudgetMemberContribution({
      userId: "user-2",
      monthlySalary: 1800,
    });
    const fixture = await createFixture({
      contributions: [],
      previousMonthContributions: [prevContrib],
    });
    const nativeEl: HTMLElement = fixture.nativeElement;
    // Bob n'a pas de contribution courante -> affiche 1800 en placeholder
    expect(nativeEl.textContent).toContain("1,800");
    expect(nativeEl.textContent).toContain("mois préc.");
  });

  it("doit calculer les parts correctement (60% / 40% pour 3000 / 2000)", async () => {
    const fixture = await createFixture({
      contributions: [contrib1, contrib2],
    });
    const nativeEl: HTMLElement = fixture.nativeElement;
    // Total = 5000, Alice 3000 -> 60%, Bob 2000 -> 40%
    expect(nativeEl.textContent).toContain("60");
    expect(nativeEl.textContent).toContain("40");
  });

  it("doit emettre mySalaryChange quand l'input du current user change", async () => {
    const fixture = await createFixture({
      currentUserId: "user-1",
      contributions: [contrib1, contrib2],
    });
    const emitted: number[] = [];
    fixture.componentInstance.mySalaryChange.subscribe((v: number) =>
      emitted.push(v),
    );

    const nativeEl: HTMLElement = fixture.nativeElement;
    const input = nativeEl.querySelector(
      "input[type=number]",
    ) as HTMLInputElement;
    input.value = "3500";
    input.dispatchEvent(new Event("change"));

    expect(emitted).toContain(3500);
  });
});
