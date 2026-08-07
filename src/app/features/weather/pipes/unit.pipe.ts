import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({ name: 'unit', standalone: true, pure: true })
export class UnitPipe implements PipeTransform {
  transform(value: number | null | undefined, unit: string): string {
    if (value == null) return '\u2014';
    switch (unit) {
      case 'celsius':
        return `${Math.round(value)}\u00B0C`;
      case 'fahrenheit':
        return `${Math.round(value * (9 / 5) + 32)}\u00B0F`;
      case 'kmh':
        return `${Math.round(value)} km/h`;
      case 'mph':
        return `${Math.round(value * 0.621371)} mph`;
      case 'hpa':
        return `${Math.round(value)} hPa`;
      case 'inhg':
        return `${(value * 0.02953).toFixed(2)} inHg`;
      default:
        return String(Math.round(value));
    }
  }
}
