import { Directive } from '@angular/core';

@Directive({
  selector: 'input[appHoneypot]',
  standalone: true,
  host: {
    type: 'text',
    tabindex: '-1',
    autocomplete: 'off',
    'aria-hidden': 'true',
    class: 'absolute -left-[10000px] h-px w-px overflow-hidden',
  },
})
export class HoneypotDirective {}
