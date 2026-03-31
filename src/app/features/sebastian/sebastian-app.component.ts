import { ChangeDetectionStrategy, Component } from "@angular/core";

/**
 * Composant applicatif du majordome Sebastian.
 * Placeholder en attente de l'implementation complete.
 */
@Component({
  selector: "app-sebastian-app",
  standalone: true,
  template: `
    <section
      class="flex min-h-[60vh] items-center justify-center bg-scheme-background px-[5%]"
    >
      <div class="text-center">
        <h1
          class="font-heading heading-h3 text-h3 md:heading-h2 md:text-h2 mb-4"
        >
          Sebastian
        </h1>
        <p class="text-scheme-text-muted">En construction</p>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianAppComponent {}
