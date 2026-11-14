import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { PresentationServie } from '../../../../../../../contrat';
import { DefileurDeTableauComponent } from '../../../defileur-de-tableau/defileur-de-tableau.component';
import { TableauDeCellulesComponent } from '../../../defileur-de-tableau/tableau-de-cellules.component';
import { SlideEnTeteComponent } from '../../texte/slide-en-tete/slide-en-tete.component';

type ProprietesDeLaPage = Extract<PresentationServie, { renderer: 'page' }>['props'];
type PageServie = ProprietesDeLaPage['page'];
type BlocDePage = PageServie['blocks'][number];

interface ZoneDeLaPage {
  readonly zone: 'en-tete' | 'corps' | 'pied';
  readonly blocs: readonly BlocDePage[];
}

@Component({
  selector: 'app-slide-page',
  standalone: true,
  imports: [
    DefileurDeTableauComponent,
    NgTemplateOutlet,
    SlideEnTeteComponent,
    TableauDeCellulesComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-page.component.html',
  styleUrl: './slide-page.component.scss',
})
export class SlidePageComponent {
  readonly title = input.required<ProprietesDeLaPage['title']>();
  readonly subtitle = input<ProprietesDeLaPage['subtitle']>();
  readonly page = input.required<PageServie>();
  readonly pageAlt = input.required<ProprietesDeLaPage['pageAlt']>();
  readonly paragraphs = input.required<ProprietesDeLaPage['paragraphs']>();
  readonly items = input.required<ProprietesDeLaPage['items']>();

  protected readonly zones = computed<readonly ZoneDeLaPage[]>(() => {
    const { header, blocks, footer } = this.page();
    return [
      { zone: 'en-tete', blocs: header === undefined ? [] : [header] },
      { zone: 'corps', blocs: blocks },
      { zone: 'pied', blocs: footer === undefined ? [] : [footer] },
    ];
  });
}
