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

  it("devrait partager le budget", () => {
    adapter
      .shareBudget({ groupId: "g1", targetEmail: "maria@test.com" })
      .subscribe((r) => {
        expect(r.shared).toBeTrue();
      });

    const req = httpMock.expectOne(`${baseUrl}/budget/share`);
    expect(req.request.method).toBe("POST");
    req.flush({ shared: true, userId: "u2" });
  });
});
