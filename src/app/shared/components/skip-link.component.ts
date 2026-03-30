import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-skip-link",
  standalone: true,
  imports: [CommonModule],
  template: `
    <!--
      Skip link:
      - Visible only when focused
      - Jumps directly to the main content landmark
    -->
    <a
      class="skip-link"
      href="#main-content"
      i18n="skipLink.label|Skip to main content@@skipLinkLabel"
    >
      Passer au contenu principal
    </a>
  `,
  styles: [
    `
      :host {
        --skip-bg: theme("colors.scheme-surface");
        --skip-text: theme("colors.scheme-text");
        --skip-ring: theme("colors.scheme-accent");
      }

      .skip-link {
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        padding: 0.5rem 1rem;
        background: var(--skip-bg);
        color: var(--skip-text);
        border-radius: 999px;
        z-index: 9999;
        font-weight: 600;
        text-decoration: none;
        box-shadow: 0 0 0 2px var(--skip-ring);
        /* Hidden by default */
        transform: translateY(-200%);
        transition: transform 0.15s ease-out;
      }

      .skip-link:focus-visible {
        transform: translateY(0);
        outline: none;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkipLinkComponent {}
