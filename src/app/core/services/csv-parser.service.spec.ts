import { CsvParserService } from "./csv-parser.service";

describe("CsvParserService", () => {
  let service: CsvParserService;

  beforeEach(() => {
    service = new CsvParserService();
  });

  it("devrait etre cree", () => {
    expect(service).toBeTruthy();
  });

  describe("parseCsv", () => {
    it("devrait parser un CSV simple", () => {
      const csv = "A,B\n1,2\n3,4";
      const result = service.parseCsv(csv);

      expect(result.length).toBe(2);
      expect(result[0]).toEqual({ A: "1", B: "2" });
    });

    it("devrait gerer les guillemets et virgules dans les champs", () => {
      const csv = 'Name,Value\n"Doe, John",100';
      const result = service.parseCsv(csv);

      expect(result[0]["Name"]).toBe("Doe, John");
    });
  });

  describe("toTransactions", () => {
    it("devrait convertir des lignes CSV en transactions", () => {
      const rows = service.parseCsv(
        "Started Date,Completed Date,Description,Type,State,Amount\n" +
          "2025-03-01,2025-03-02,Courses,CARD_PAYMENT,COMPLETED,-42.50",
      );

      const transactions = service.toTransactions(rows);

      expect(transactions.length).toBe(1);
      expect(transactions[0].description).toBe("Courses");
      expect(transactions[0].amount).toBe(-42.5);
      expect(transactions[0].category).toBe("Autres");
    });
  });
});
