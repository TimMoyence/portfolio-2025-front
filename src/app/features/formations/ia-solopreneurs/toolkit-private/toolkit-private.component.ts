import { isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  PLATFORM_ID,
  signal,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { LEAD_MAGNET_PORT } from "../../../../core/ports/lead-magnet.port";
import type { ToolkitPageData } from "../../../../core/models/toolkit-page.model";

type PageState = "loading" | "loaded" | "error";

/**
 * Page privee du toolkit personnalise — refonte Asili (Lot 3e).
 *
 * Accessible via un token unique envoye par email. Affiche un en-tete
 * « Accès débloqué » (wording maquette `AsiliNewDesign/toolkit.html`) puis les
 * 5 sections personnalisees reellement resolues par token : cheatsheet,
 * prompts, workflows, templates et le prompt Gamma.
 *
 * Le restyle est purement visuel (markup + tokens Asili) : la resolution de
 * token et la machine d'etat (constructeur, `getToolkitByToken`, signaux
 * `state`/`data`, `copyToClipboard`) sont INCHANGEES.
 */
@Component({
  selector: "app-toolkit-private",
  standalone: true,
  imports: [],
  templateUrl: "./toolkit-private.component.html",
  styleUrl: "./toolkit-private.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolkitPrivateComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly port = inject(LEAD_MAGNET_PORT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly state = signal<PageState>("loading");
  readonly data = signal<ToolkitPageData | null>(null);
  /** Texte qui vient d'etre copie, pour le feedback visuel. */
  readonly copiedText = signal<string | null>(null);

  /** Libelle du bouton « copier » au repos. */
  protected readonly copyLabel = $localize`:@@formations.toolkitPrivate.copy:Copier`;

  /** Libelle du bouton « copier » apres copie reussie. */
  protected readonly copiedLabel = $localize`:@@formations.toolkitPrivate.copied:Copié !`;

  /** Vrai si les donnees sont chargees — raccourci pour le template. */
  readonly isLoaded = computed(
    () => this.state() === "loaded" && this.data() !== null,
  );

  constructor() {
    const token = this.route.snapshot.paramMap.get("token");
    if (!token) {
      this.state.set("error");
      return;
    }
    this.port.getToolkitByToken(token).subscribe({
      next: (pageData) => {
        this.data.set(pageData);
        this.state.set("loaded");
      },
      error: () => {
        this.state.set("error");
      },
    });
  }

  /**
   * Copie un texte dans le presse-papier avec feedback temporaire.
   * Protege par un guard SSR (Clipboard API indisponible cote serveur).
   */
  copyToClipboard(text: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    navigator.clipboard?.writeText(text).then(() => {
      this.copiedText.set(text);
      setTimeout(() => this.copiedText.set(null), 2000);
    });
  }
}
