import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "../config/app-config.token";
import {
  buildSebastianBadgeStatus,
  buildSebastianEntry,
  buildSebastianGoal,
  buildSebastianHealthScore,
  buildSebastianPeriodReport,
  buildSebastianStats,
  buildSebastianTrendData,
} from "../../../testing/factories/sebastian.factory";
import { SebastianHttpAdapter } from "./sebastian-http.adapter";

describe("SebastianHttpAdapter", () => {
  let adapter: SebastianHttpAdapter;
  let httpMock: HttpTestingController;
  const sebastianUrl = "http://localhost:3000/api/v1/portfolio25/sebastian";

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SebastianHttpAdapter,
        {
          provide: APP_CONFIG,
          useValue: {
            apiBaseUrl: "http://localhost:3000/api/v1/portfolio25",
            external: { sebastianUrl },
          },
        },
      ],
    });

    adapter = TestBed.inject(SebastianHttpAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("devrait envoyer un POST a l'endpoint entries pour ajouter une entree", () => {
    const entry = buildSebastianEntry();
    const payload = {
      category: "coffee" as const,
      quantity: 1,
      date: "2026-04-04",
    };

    adapter.addEntry(payload).subscribe((result) => {
      expect(result).toEqual(entry);
    });

    const req = httpMock.expectOne(`${sebastianUrl}/entries`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(payload);
    req.flush(entry);
  });

  it("devrait envoyer un GET a l'endpoint entries sans parametres", () => {
    const entries = [buildSebastianEntry()];

    adapter.getEntries().subscribe((result) => {
      expect(result).toEqual(entries);
    });

    const req = httpMock.expectOne(`${sebastianUrl}/entries`);
    expect(req.request.method).toBe("GET");
    req.flush(entries);
  });

  it("devrait envoyer un GET a l'endpoint entries avec les filtres", () => {
    const entries = [buildSebastianEntry()];

    adapter
      .getEntries({ from: "2026-04-01", to: "2026-04-04", category: "coffee" })
      .subscribe((result) => {
        expect(result).toEqual(entries);
      });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${sebastianUrl}/entries` &&
        r.params.get("from") === "2026-04-01" &&
        r.params.get("to") === "2026-04-04" &&
        r.params.get("category") === "coffee",
    );
    expect(req.request.method).toBe("GET");
    req.flush(entries);
  });

  it("devrait envoyer un DELETE a l'endpoint entries/:id", () => {
    adapter.deleteEntry("entry-1").subscribe();

    const req = httpMock.expectOne(`${sebastianUrl}/entries/entry-1`);
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });

  it("devrait envoyer un GET a l'endpoint stats avec la periode", () => {
    const stats = buildSebastianStats();

    adapter.getStats("week").subscribe((result) => {
      expect(result).toEqual(stats);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${sebastianUrl}/stats` && r.params.get("period") === "week",
    );
    expect(req.request.method).toBe("GET");
    req.flush(stats);
  });

  it("devrait envoyer un POST a l'endpoint goals pour definir un objectif", () => {
    const goal = buildSebastianGoal();
    const payload = {
      category: "coffee" as const,
      targetQuantity: 3,
      period: "daily" as const,
    };

    adapter.setGoal(payload).subscribe((result) => {
      expect(result).toEqual(goal);
    });

    const req = httpMock.expectOne(`${sebastianUrl}/goals`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(payload);
    req.flush(goal);
  });

  it("devrait envoyer un GET a l'endpoint goals", () => {
    const goals = [buildSebastianGoal()];

    adapter.getGoals().subscribe((result) => {
      expect(result).toEqual(goals);
    });

    const req = httpMock.expectOne(`${sebastianUrl}/goals`);
    expect(req.request.method).toBe("GET");
    req.flush(goals);
  });

  it("devrait envoyer un DELETE a l'endpoint goals/:id", () => {
    adapter.deleteGoal("goal-1").subscribe();

    const req = httpMock.expectOne(`${sebastianUrl}/goals/goal-1`);
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });

  it("devrait envoyer un GET a l'endpoint stats/trends avec la periode", () => {
    const trendData = buildSebastianTrendData();

    adapter.getTrends("7d").subscribe((result) => {
      expect(result).toEqual(trendData);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${sebastianUrl}/stats/trends` &&
        r.params.get("period") === "7d",
    );
    expect(req.request.method).toBe("GET");
    req.flush(trendData);
  });

  it("devrait envoyer un GET a l'endpoint stats/health-score", () => {
    const healthScore = buildSebastianHealthScore();

    adapter.getHealthScore().subscribe((result) => {
      expect(result).toEqual(healthScore);
    });

    const req = httpMock.expectOne(`${sebastianUrl}/stats/health-score`);
    expect(req.request.method).toBe("GET");
    req.flush(healthScore);
  });

  it("devrait envoyer un GET a l'endpoint badges", () => {
    const badges = [buildSebastianBadgeStatus()];

    adapter.getBadges().subscribe((result) => {
      expect(result).toEqual(badges);
    });

    const req = httpMock.expectOne(`${sebastianUrl}/badges`);
    expect(req.request.method).toBe("GET");
    req.flush(badges);
  });

  it("devrait envoyer un GET a l'endpoint stats/report avec les parametres", () => {
    const report = buildSebastianPeriodReport();

    adapter.getPeriodReport("week", "2026-03-30").subscribe((result) => {
      expect(result).toEqual(report);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${sebastianUrl}/stats/report` &&
        r.params.get("period") === "week" &&
        r.params.get("startDate") === "2026-03-30",
    );
    expect(req.request.method).toBe("GET");
    req.flush(report);
  });

  it("devrait propager les erreurs HTTP", () => {
    adapter.getEntries().subscribe({
      next: () => fail("devrait echouer"),
      error: (error) => {
        expect(error.status).toBe(500);
      },
    });

    const req = httpMock.expectOne(`${sebastianUrl}/entries`);
    req.flush("Erreur serveur", {
      status: 500,
      statusText: "Internal Server Error",
    });
  });
});
