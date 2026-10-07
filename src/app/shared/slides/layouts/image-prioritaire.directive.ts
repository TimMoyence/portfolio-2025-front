import { Directive, input } from '@angular/core';

@Directive({
  selector: 'img[appImagePrioritaire]',
  standalone: true,
  host: {
    '[attr.loading]': "appImagePrioritaire() ? 'eager' : 'lazy'",
    '[attr.fetchpriority]': "appImagePrioritaire() ? 'high' : null",
    decoding: 'async',
  },
})
export class ImagePrioritaireDirective {
  readonly appImagePrioritaire = input(false);
}
