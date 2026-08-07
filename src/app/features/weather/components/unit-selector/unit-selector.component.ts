import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BottomSheetComponent } from '../../../../shared/components/bottom-sheet/bottom-sheet.component';
import { UnitPreferencesService } from '../../services/unit-preferences.service';

interface UnitOption<T extends string> {
  value: T;
  label: string;
}

@Component({
  selector: 'app-unit-selector',
  standalone: true,
  imports: [CommonModule, BottomSheetComponent],
  template: `
    <button
      type="button"
      class="flex h-11 w-11 items-center justify-center rounded-full border border-teal/15 bg-white/5 backdrop-blur-xl transition-colors hover:border-teal/40"
      (click)="toggleOpen()"
      aria-label="Paramètres d'unités"
      i18n-aria-label="weather.units.button.aria|@@weatherUnitsButtonAria"
      data-testid="unit-selector-button"
    >
      <svg
        class="h-5 w-5 text-white/70"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    </button>

    <app-bottom-sheet [open]="isOpen()" [title]="sheetTitle" (openChange)="onOpenChange($event)">
      <div class="space-y-5">
        <div>
          <p
            class="mb-2 text-sm font-medium text-white/70"
            i18n="weather.units.temperature|@@weatherUnitsTemperature"
          >
            Température
          </p>
          <nav
            class="inline-flex rounded-full border border-teal/15 bg-white/5 p-0.5 font-mono"
            role="tablist"
          >
            @for (opt of temperatureOptions; track opt.value) {
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="unitService.temperatureUnit() === opt.value"
                class="rounded-full px-4 py-1.5 text-sm font-medium transition-all"
                [ngClass]="
                  unitService.temperatureUnit() === opt.value
                    ? 'bg-teal font-semibold text-[#06231f]'
                    : 'text-white/55 hover:text-white'
                "
                (click)="unitService.setTemperatureUnit(opt.value)"
              >
                {{ opt.label }}
              </button>
            }
          </nav>
        </div>

        <div>
          <p
            class="mb-2 text-sm font-medium text-white/70"
            i18n="weather.units.speed|@@weatherUnitsSpeed"
          >
            Vitesse
          </p>
          <nav
            class="inline-flex rounded-full border border-teal/15 bg-white/5 p-0.5 font-mono"
            role="tablist"
          >
            @for (opt of speedOptions; track opt.value) {
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="unitService.speedUnit() === opt.value"
                class="rounded-full px-4 py-1.5 text-sm font-medium transition-all"
                [ngClass]="
                  unitService.speedUnit() === opt.value
                    ? 'bg-teal font-semibold text-[#06231f]'
                    : 'text-white/55 hover:text-white'
                "
                (click)="unitService.setSpeedUnit(opt.value)"
              >
                {{ opt.label }}
              </button>
            }
          </nav>
        </div>

        <div>
          <p
            class="mb-2 text-sm font-medium text-white/70"
            i18n="weather.units.pressure|@@weatherUnitsPressure"
          >
            Pression
          </p>
          <nav
            class="inline-flex rounded-full border border-teal/15 bg-white/5 p-0.5 font-mono"
            role="tablist"
          >
            @for (opt of pressureOptions; track opt.value) {
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="unitService.pressureUnit() === opt.value"
                class="rounded-full px-4 py-1.5 text-sm font-medium transition-all"
                [ngClass]="
                  unitService.pressureUnit() === opt.value
                    ? 'bg-teal font-semibold text-[#06231f]'
                    : 'text-white/55 hover:text-white'
                "
                (click)="unitService.setPressureUnit(opt.value)"
              >
                {{ opt.label }}
              </button>
            }
          </nav>
        </div>
      </div>
    </app-bottom-sheet>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitSelectorComponent {
  readonly unitService = inject(UnitPreferencesService);

  readonly isOpen = signal(false);

  readonly sheetTitle = $localize`:weather.units.title|@@weatherUnitsTitle:Unités de mesure`;

  readonly temperatureOptions: UnitOption<'celsius' | 'fahrenheit'>[] = [
    { value: 'celsius', label: '\u00B0C' },
    { value: 'fahrenheit', label: '\u00B0F' },
  ];

  readonly speedOptions: UnitOption<'kmh' | 'mph'>[] = [
    { value: 'kmh', label: 'km/h' },
    { value: 'mph', label: 'mph' },
  ];

  readonly pressureOptions: UnitOption<'hpa' | 'inhg'>[] = [
    { value: 'hpa', label: 'hPa' },
    { value: 'inhg', label: 'inHg' },
  ];

  toggleOpen(): void {
    this.isOpen.update((v) => !v);
  }

  onOpenChange(open: boolean): void {
    this.isOpen.set(open);
  }
}
