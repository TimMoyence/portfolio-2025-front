import type { ChartDataset, ChartOptions, TooltipCallbacks, TooltipItem } from 'chart.js';

const AXIS_TICK_STYLE = { color: 'rgba(255, 255, 255, 0.6)', font: { size: 10 } } as const;
const GRID_STYLE = { color: 'rgba(255, 255, 255, 0.08)' } as const;

export function buildDarkLineChartOptions(
  tooltipCallbacks?: Partial<TooltipCallbacks<'line'>>,
): ChartOptions<'line'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(12, 9, 2, 0.85)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        ...(tooltipCallbacks ? { callbacks: tooltipCallbacks } : {}),
      },
    },
    scales: {
      x: {
        ticks: { ...AXIS_TICK_STYLE, maxRotation: 45 },
        grid: { ...GRID_STYLE },
      },
      y: {
        beginAtZero: true,
        ticks: { ...AXIS_TICK_STYLE },
        grid: { ...GRID_STYLE },
      },
    },
  };
}

export function buildReferenceLineDataset(
  label: string,
  value: number,
  pointCount: number,
  borderColor: string,
): ChartDataset<'line', number[]> {
  return {
    label,
    data: Array<number>(pointCount).fill(value),
    borderColor,
    borderWidth: 1,
    borderDash: [8, 4],
    pointRadius: 0,
    fill: false,
  };
}

export function formatBloodAlcoholTooltip(ctx: TooltipItem<'line'>): string {
  return `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toFixed(3)} g/L`;
}
