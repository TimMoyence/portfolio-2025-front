import { parseCsv, toTransactions } from "./budget-csv-parser.utils";

describe("parseCsv", () => {
  it("devrait parser un CSV simple sans guillemets", () => {
    const csv = "A,B,C\n1,2,3\n4,5,6";
    const result = parseCsv(csv);

    expect(result.length).toBe(2);
    expect(result[0]).toEqual({ A: "1", B: "2", C: "3" });
    expect(result[1]).toEqual({ A: "4", B: "5", C: "6" });
  });

  it("devrait gerer les guillemets et les virgules dans les champs", () => {
    const csv = 'Name,Value\n"Doe, John",100\n"Say ""hello""",200';
    const result = parseCsv(csv);

    expect(result.length).toBe(2);
    expect(result[0]["Name"]).toBe("Doe, John");
    expect(result[1]["Name"]).toBe('Say "hello"');
    expect(result[1]["Value"]).toBe("200");
  });

  it("devrait gerer les sauts de ligne CRLF", () => {
    const csv = "X,Y\r\na,b\r\nc,d";
    const result = parseCsv(csv);

    expect(result.length).toBe(2);
    expect(result[0]).toEqual({ X: "a", Y: "b" });
    expect(result[1]).toEqual({ X: "c", Y: "d" });
  });

  it("devrait ignorer les lignes vides", () => {
    const csv = "Col1,Col2\n\nval1,val2\n\n";
    const result = parseCsv(csv);

    expect(result.length).toBe(1);
    expect(result[0]).toEqual({ Col1: "val1", Col2: "val2" });
  });

  it("devrait retourner un tableau vide pour un CSV sans donnees", () => {
    const csv = "A,B,C";
    const result = parseCsv(csv);

    expect(result.length).toBe(0);
  });
});

describe("toTransactions", () => {
  it("devrait convertir les lignes CSV en transactions", () => {
    const rows = parseCsv(
      "Started Date,Completed Date,Description,Type,State,Amount\n" +
        "2025-03-01,2025-03-02,Courses,CARD_PAYMENT,COMPLETED,-42.50",
    );

    const transactions = toTransactions(rows);

    expect(transactions.length).toBe(1);
    expect(transactions[0].description).toBe("Courses");
    expect(transactions[0].startedDate).toBe("2025-03-01");
    expect(transactions[0].completedDate).toBe("2025-03-02");
    expect(transactions[0].type).toBe("CARD_PAYMENT");
    expect(transactions[0].state).toBe("COMPLETED");
    expect(transactions[0].amount).toBe(-42.5);
    expect(transactions[0].category).toBe("Autres");
  });

  it("devrait generer un identifiant deterministe", () => {
    const rows = parseCsv(
      "Started Date,Completed Date,Description,Type,State,Amount\n" +
        "2025-03-01,,Loyer,TRANSFER,COMPLETED,-900",
    );

    const transactions = toTransactions(rows);

    expect(transactions[0].id).toBe("2025-03-01|Loyer|-900|TRANSFER");
  });

  it("devrait gerer les champs manquants gracieusement", () => {
    const rows = parseCsv("Description,Amount\nTest,0");
    const transactions = toTransactions(rows);

    expect(transactions[0].startedDate).toBe("");
    expect(transactions[0].completedDate).toBe("");
    expect(transactions[0].type).toBe("");
    expect(transactions[0].state).toBe("");
    expect(transactions[0].amount).toBe(0);
  });
});
