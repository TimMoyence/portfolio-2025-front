/** Definition d'un parametre affichable sur le graphique horaire. */
export interface ChartParameter {
  id: string;
  label: string;
  dataKey: keyof import('../../../../core/models/weather.model').HourlyForecast;
  type: 'line' | 'bar';
  yAxisID: string;
  borderColor: string;
  backgroundColor: string;
  unit: string;
  defaultVisible: boolean;
}

/**
 * Parametres disponibles pour le graphique horaire.
 *
 * Palette Asili (AsiliNewDesign/asili.css) :
 *  - température : glow #5b8cff (rgb 91,140,255) — ligne principale ;
 *  - précipitations : glow-soft #8fb0ff (rgb 143,176,255) — barres ;
 *  - vent : teal #4fb3a2 (rgb 79,179,162) ;
 *  - humidité : glow-soft assombri (rgb 110,150,235) ;
 *  - UV : ambre conservé (couleur sémantique d'alerte).
 *
 * Les alphas `0.9`/`0.8` des `borderColor` sont volontairement preserves :
 * `hourly-chart.component` les remplace par `0.7` pour deriver la couleur des ticks.
 */
export const CHART_PARAMETERS: ChartParameter[] = [
  {
    id: 'temperature',
    label: 'Température',
    dataKey: 'temperature_2m',
    type: 'line',
    yAxisID: 'y',
    borderColor: 'rgba(91, 140, 255, 0.9)',
    backgroundColor: 'rgba(91, 140, 255, 0.12)',
    unit: '°',
    defaultVisible: true,
  },
  {
    id: 'precipitation',
    label: 'Précipitations',
    dataKey: 'precipitation',
    type: 'bar',
    yAxisID: 'y1',
    borderColor: 'rgba(143, 176, 255, 0.8)',
    backgroundColor: 'rgba(143, 176, 255, 0.4)',
    unit: 'mm',
    defaultVisible: true,
  },
  {
    id: 'wind',
    label: 'Vent',
    dataKey: 'wind_speed_10m',
    type: 'line',
    yAxisID: 'y2',
    borderColor: 'rgba(79, 179, 162, 0.9)',
    backgroundColor: 'rgba(79, 179, 162, 0.12)',
    unit: 'km/h',
    defaultVisible: false,
  },
  {
    id: 'humidity',
    label: 'Humidité',
    dataKey: 'relative_humidity_2m',
    type: 'line',
    yAxisID: 'y3',
    borderColor: 'rgba(110, 150, 235, 0.9)',
    backgroundColor: 'rgba(110, 150, 235, 0.1)',
    unit: '%',
    defaultVisible: false,
  },
  {
    id: 'uv',
    label: 'UV',
    dataKey: 'uv_index',
    type: 'line',
    yAxisID: 'y4',
    borderColor: 'rgba(230, 198, 79, 0.9)',
    backgroundColor: 'rgba(230, 198, 79, 0.1)',
    unit: '',
    defaultVisible: false,
  },
];
