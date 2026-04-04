/** Definition d'un parametre affichable sur le graphique horaire. */
export interface ChartParameter {
  id: string;
  label: string;
  dataKey: keyof import("../../../../core/models/weather.model").HourlyForecast;
  type: "line" | "bar";
  yAxisID: string;
  borderColor: string;
  backgroundColor: string;
  unit: string;
  defaultVisible: boolean;
}

/** Parametres disponibles pour le graphique horaire. */
export const CHART_PARAMETERS: ChartParameter[] = [
  {
    id: "temperature",
    label: "Température",
    dataKey: "temperature_2m",
    type: "line",
    yAxisID: "y",
    borderColor: "rgba(255, 255, 255, 0.9)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    unit: "°",
    defaultVisible: true,
  },
  {
    id: "precipitation",
    label: "Précipitations",
    dataKey: "precipitation",
    type: "bar",
    yAxisID: "y1",
    borderColor: "rgba(96, 165, 250, 0.8)",
    backgroundColor: "rgba(96, 165, 250, 0.5)",
    unit: "mm",
    defaultVisible: true,
  },
  {
    id: "wind",
    label: "Vent",
    dataKey: "wind_speed_10m",
    type: "line",
    yAxisID: "y2",
    borderColor: "rgba(74, 222, 128, 0.9)",
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    unit: "km/h",
    defaultVisible: false,
  },
  {
    id: "humidity",
    label: "Humidité",
    dataKey: "relative_humidity_2m",
    type: "line",
    yAxisID: "y3",
    borderColor: "rgba(147, 197, 253, 0.9)",
    backgroundColor: "rgba(147, 197, 253, 0.1)",
    unit: "%",
    defaultVisible: false,
  },
  {
    id: "uv",
    label: "UV",
    dataKey: "uv_index",
    type: "line",
    yAxisID: "y4",
    borderColor: "rgba(250, 204, 21, 0.9)",
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    unit: "",
    defaultVisible: false,
  },
];
