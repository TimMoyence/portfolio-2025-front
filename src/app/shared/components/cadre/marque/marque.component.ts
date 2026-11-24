import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-marque',
  standalone: true,
  template: `
    <img
      class="asili-logo_img"
      aria-hidden="true"
      src="/assets/images/logo.webp"
      srcset="
        /assets/images/logo/64.webp   64w,
        /assets/images/logo/128.webp 128w,
        /assets/images/logo/192.webp 192w
      "
      sizes="4rem"
      alt="Logo Asili Design"
      i18n-alt="@@navLogoAlt"
    />
    <span class="asili-logo__texte">
      <span class="asili-logo__name" i18n="@@NavbarCompanyTitle">Asili Design</span>
      <small class="asili-logo__metier" i18n="@@marqueMetier">Sites web & apps mobiles</small>
    </span>
  `,
  styleUrl: './marque.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarqueComponent {}
