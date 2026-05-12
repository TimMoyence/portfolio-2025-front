import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "../config/app-config.token";
import { BudgetHttpAdapter } from "./budget-http.adapter";

describe("BudgetHttpAdapter", () => {
  let adapter: BudgetHttpAdapter;
  let httpMock: HttpTestingController;
  const baseUrl = "http://localhost:3000/api/v1/portfolio25";

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BudgetHttpAdapter,
        { provide: APP_CONFIG, useValue: { apiBaseUrl: baseUrl } },
      ],
    });
    adapter = TestBed.inject(BudgetHttpAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("devrait recuperer les groupes", () => {
    adapter.getGroups().subscribe((groups) => {
      expect(groups.length).toBe(1);
    });

    const req = httpMock.expectOne(`${baseUrl}/budget/groups`);
    expect(req.request.method).toBe("GET");
    req.flush([{ id: "g1", name: "Budget T&M", ownerId: "u1", createdAt: "" }]);
  });

  it("devrait creer un groupe", () => {
    adapter.createGroup("Budget T&M").subscribe((g) => {
      expect(g.name).toBe("Budget T&M");
    });

    const req = httpMock.expectOne(`${baseUrl}/budget/groups`);
    expect(req.request.method).toBe("POST");
    req.flush({ id: "1", name: "Budget T&M", ownerId: "u1", createdAt: "" });
  });

  it("devrait recuperer les entrees", () => {
    adapter.getEntries("g1", { month: 3, year: 2026 }).subscribe((entries) => {
      expect(entries.length).toBe(1);
    });

    const req = httpMock.expectOne(
      `${baseUrl}/budget/entries?groupId=g1&month=3&year=2026`,
    );
    expect(req.request.method).toBe("GET");
    req.flush([{ id: "e1" }]);
  });

  it("devrait recuperer le resume", () => {
    adapter.getSummary("g1", 3, 2026).subscribe((s) => {
      expect(s.totalExpenses).toBe(100);
    });

    const req = httpMock.expectOne(
      `${baseUrl}/budget/summary?groupId=g1&month=3&year=2026`,
    );
    req.flush({ totalExpenses: 100, totalIncoming: 200, byCategory: [] });
  });

  it("devrait supprimer une entree", () => {
    adapter.deleteEntry("e1").subscribe();

    const req = httpMock.expectOne(`${baseUrl}/budget/entries/e1`);
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });

  it("shareBudget — POST /budget/share retourne {status: 'shared'} pour un email existant", () => {
    adapter
      .shareBudget({ groupId: "g1", targetEmail: "maria@test.com" })
      .subscribe((r) => {
        expect(r.status).toBe("shared");
      });

    const req = httpMock.expectOne(`${baseUrl}/budget/share`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({
      groupId: "g1",
      targetEmail: "maria@test.com",
    });
    req.flush({ status: "shared" });
  });

  it("shareBudget — propage le statut 'invited' (compte inexistant)", () => {
    adapter
      .shareBudget({ groupId: "g1", targetEmail: "newuser@test.com" })
      .subscribe((r) => {
        expect(r.status).toBe("invited");
      });

    const req = httpMock.expectOne(`${baseUrl}/budget/share`);
    req.flush({ status: "invited" });
  });

  it("shareBudget — propage le statut 'already-member'", () => {
    adapter
      .shareBudget({ groupId: "g1", targetEmail: "already@test.com" })
      .subscribe((r) => {
        expect(r.status).toBe("already-member");
      });

    const req = httpMock.expectOne(`${baseUrl}/budget/share`);
    req.flush({ status: "already-member" });
  });

  it("listPendingInvitations — GET /budget/groups/:groupId/invitations", () => {
    const expected = {
      invitations: [
        {
          id: "inv-1",
          targetEmail: "pending@test.com",
          expiresAt: "2026-05-18T15:00:00.000Z",
          createdAt: "2026-05-11T15:00:00.000Z",
        },
      ],
    };

    adapter.listPendingInvitations("g1").subscribe((res) => {
      expect(res).toEqual(expected);
    });

    const req = httpMock.expectOne(`${baseUrl}/budget/groups/g1/invitations`);
    expect(req.request.method).toBe("GET");
    req.flush(expected);
  });

  it("previewInvitation — GET /auth/invitations/by-token/:token et encode le token", () => {
    const expected = {
      inviterFirstName: "Tim",
      groupName: "Budget couple T&M",
      targetEmail: "maria@test.com",
      expiresAt: "2026-05-18T15:00:00.000Z",
    };
    const rawToken = "a/b+c=";

    adapter.previewInvitation(rawToken).subscribe((res) => {
      expect(res).toEqual(expected);
    });

    const req = httpMock.expectOne(
      `${baseUrl}/auth/invitations/by-token/${encodeURIComponent(rawToken)}`,
    );
    expect(req.request.method).toBe("GET");
    req.flush(expected);
  });

  it("getMembers — GET /budget/groups/:groupId/members", () => {
    const expected = [
      {
        userId: "u1",
        email: "u1@x.fr",
        displayName: "Alice",
        isOwner: true,
        joinedAt: "2026-01-01",
      },
    ];
    adapter.getMembers("g1").subscribe((r) => expect(r).toEqual(expected));
    const req = httpMock.expectOne(`${baseUrl}/budget/groups/g1/members`);
    expect(req.request.method).toBe("GET");
    req.flush(expected);
  });

  it("removeMember — DELETE /budget/groups/:groupId/members/:userId", () => {
    adapter.removeMember("g1", "u2").subscribe();
    const req = httpMock.expectOne(`${baseUrl}/budget/groups/g1/members/u2`);
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });

  it("getContributions — GET /budget/contributions", () => {
    const expected = [
      {
        id: "c1",
        groupId: "g1",
        userId: "u1",
        month: 5,
        year: 2026,
        monthlySalary: 2500,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    adapter
      .getContributions("g1", 5, 2026)
      .subscribe((r) => expect(r).toEqual(expected));
    const req = httpMock.expectOne(
      `${baseUrl}/budget/contributions?groupId=g1&month=5&year=2026`,
    );
    expect(req.request.method).toBe("GET");
    req.flush(expected);
  });

  it("upsertMyContribution — PUT /budget/contributions", () => {
    const payload = {
      groupId: "g1",
      month: 5,
      year: 2026,
      monthlySalary: 2500,
    };
    const expected = {
      id: "c1",
      groupId: "g1",
      userId: "u1",
      month: 5,
      year: 2026,
      monthlySalary: 2500,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    adapter
      .upsertMyContribution(payload)
      .subscribe((r) => expect(r).toEqual(expected));
    const req = httpMock.expectOne(`${baseUrl}/budget/contributions`);
    expect(req.request.method).toBe("PUT");
    expect(req.request.body).toEqual(payload);
    req.flush(expected);
  });

  it("getGoals — GET /budget/goals avec params", () => {
    const expected = [
      {
        id: "goal-1",
        groupId: "g1",
        createdByUserId: "u1",
        name: "Epargne vacances",
        kind: "SAVINGS" as const,
        targetAmount: 1000,
        categoryId: null,
        deadline: null,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        currentAmount: 0,
        progressPercent: 0,
      },
    ];
    adapter
      .getGoals("g1", 5, 2026)
      .subscribe((r) => expect(r).toEqual(expected));
    const req = httpMock.expectOne(
      `${baseUrl}/budget/goals?groupId=g1&month=5&year=2026`,
    );
    expect(req.request.method).toBe("GET");
    req.flush(expected);
  });

  it("createGoal — POST /budget/goals", () => {
    const payload = {
      groupId: "g1",
      name: "Epargne vacances",
      kind: "SAVINGS" as const,
      targetAmount: 1000,
    };
    const expected = {
      ...payload,
      id: "goal-1",
      createdByUserId: "u1",
      categoryId: null,
      deadline: null,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      currentAmount: 0,
      progressPercent: 0,
    };
    adapter.createGoal(payload).subscribe((r) => expect(r).toEqual(expected));
    const req = httpMock.expectOne(`${baseUrl}/budget/goals`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(payload);
    req.flush(expected);
  });

  it("updateGoal — PATCH /budget/goals/:id", () => {
    const updatePayload = { targetAmount: 2000, isActive: false };
    const expected = {
      id: "goal-1",
      groupId: "g1",
      createdByUserId: "u1",
      name: "Epargne vacances",
      kind: "SAVINGS" as const,
      targetAmount: 2000,
      categoryId: null,
      deadline: null,
      isActive: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-05-01T00:00:00.000Z",
      currentAmount: 500,
      progressPercent: 25,
    };
    adapter
      .updateGoal("goal-1", updatePayload)
      .subscribe((r) => expect(r).toEqual(expected));
    const req = httpMock.expectOne(`${baseUrl}/budget/goals/goal-1`);
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual(updatePayload);
    req.flush(expected);
  });

  it("deleteGoal — DELETE /budget/goals/:id", () => {
    adapter.deleteGoal("goal-1").subscribe();
    const req = httpMock.expectOne(`${baseUrl}/budget/goals/goal-1`);
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });

  it("getEntriesMonths — GET /budget/entries/months", () => {
    const expected = [
      { month: 3, year: 2026 },
      { month: 4, year: 2026 },
    ];
    adapter
      .getEntriesMonths("g1")
      .subscribe((r) => expect(r).toEqual(expected));
    const req = httpMock.expectOne(
      `${baseUrl}/budget/entries/months?groupId=g1`,
    );
    expect(req.request.method).toBe("GET");
    req.flush(expected);
  });
});
