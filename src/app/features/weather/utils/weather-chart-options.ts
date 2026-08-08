import type { ChartOptions } from 'chart.js';

const AXIS_TICK_COLOR = 'rgba(255, 255, 255, 0.6)';
const GRID_COLOR = 'rgba(255, 255, 255, 0.1)';

export function buildTimeAxisScale() {
  return {
    ticks: {
      color: AXIS_TICK_COLOR,
      maxRotation: 45,
      font: { size: 10 },
    },
    grid: { color: GRID_COLOR },
  };
}

export function buildChartLegend() {
  return {
    labels: {
      color: 'rgba(255, 255, 255, 0.7)',
      font: { size: 11 },
    },
  };
}

export function buildTemperatureLineChartOptions(): ChartOptions<'line'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: buildChartLegend(),
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleColor: 'white',
        bodyColor: 'white',
      },
    },
    scales: {
      x: buildTimeAxisScale(),
      y: {
        ticks: {
          color: AXIS_TICK_COLOR,
          callback: (value) => `${value}°`,
        },
        grid: { color: GRID_COLOR },
      },
    },
  };
}
