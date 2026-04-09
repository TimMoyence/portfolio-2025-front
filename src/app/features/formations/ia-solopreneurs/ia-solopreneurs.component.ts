import { ChangeDetectionStrategy, Component } from "@angular/core";
import { SlideViewerComponent } from "../../../shared/components/slide-viewer/slide-viewer.component";
import { IA_SOLOPRENEURS_SLIDES } from "./ia-solopreneurs.data";

@Component({
  selector: "app-ia-solopreneurs",
  standalone: true,
  imports: [SlideViewerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<app-slide-viewer [slides]="slides" />',
})
export class IaSolopreneursComponent {
  readonly slides = IA_SOLOPRENEURS_SLIDES;
}
