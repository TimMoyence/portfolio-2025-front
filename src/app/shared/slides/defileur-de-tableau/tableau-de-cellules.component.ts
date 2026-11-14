import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'table[appTableauDeCellules]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <thead>
      <tr>
        @for (cellule of entete(); track $index) {
          <th scope="col">{{ cellule }}</th>
        }
      </tr>
    </thead>
    <tbody>
      @for (ligne of lignes(); track $index) {
        <tr>
          @for (cellule of ligne; track $index) {
            <td>{{ cellule }}</td>
          }
        </tr>
      }
    </tbody>
  `,
})
export class TableauDeCellulesComponent {
  readonly entete = input.required<readonly string[]>();
  readonly lignes = input.required<readonly (readonly string[])[]>();
}
