import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skip-link',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!--
      Skip link:
      - Visible only when focused
      - Jumps directly to the main content landmark
    -->
    <a class="skip-link" href="#main-content"> Passer au contenu principal </a>
  `,
  styles: [
    `
      .skip-link {
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        padding: 0.5rem 1rem;
        background: #ffffff;
        color: #000;
        border-radius: 999px;
        z-index: 9999;
        font-weight: 600;
        text-decoration: none;
        box-shadow: 0 0 0 2px #000;
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
})
export class SkipLinkComponent {}
