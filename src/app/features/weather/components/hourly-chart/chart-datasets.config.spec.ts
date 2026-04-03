import { CHART_PARAMETERS } from "./chart-datasets.config";

describe("CHART_PARAMETERS", () => {
  it("devrait contenir 5 parametres", () => {
    expect(CHART_PARAMETERS.length).toBe(5);
  });

  it("devrait avoir temperature et precipitation visibles par defaut", () => {
    const defaults = CHART_PARAMETERS.filter((p) => p.defaultVisible).map(
      (p) => p.id,
    );
    expect(defaults).toEqual(["temperature", "precipitation"]);
  });

  it("devrait avoir des dataKey valides correspondant a HourlyForecast", () => {
    const validKeys = [
      "time",
      "temperature_2m",
      "weather_code",
      "wind_speed_10m",
      "precipitation",
      "relative_humidity_2m",
      "dew_point_2m",
      "pressure_msl",
      "uv_index",
      "wind_direction_10m",
      "wind_gusts_10m",
      "cloud_cover",
      "visibility",
    ];
    for (const param of CHART_PARAMETERS) {
      expect(validKeys).toContain(param.dataKey);
    }
  });

  it("devrait avoir des ids uniques", () => {
    const ids = CHART_PARAMETERS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("devrait avoir des yAxisID uniques", () => {
    const axisIds = CHART_PARAMETERS.map((p) => p.yAxisID);
    expect(new Set(axisIds).size).toBe(axisIds.length);
  });
});
