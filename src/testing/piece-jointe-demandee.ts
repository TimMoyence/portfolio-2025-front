import type { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CoursPresentationComponent } from '../app/shared/slides/session/cours-presentation.component';

export function demanderLaPieceJointe(fixture: ComponentFixture<unknown>, ecranId: string): void {
  const presentation = fixture.debugElement.query(By.directive(CoursPresentationComponent))
    .componentInstance as CoursPresentationComponent;
  const telechargement = presentation.telechargement();
  if (telechargement === null) {
    throw new Error('Aucun téléchargement de pièce jointe confié à la présentation');
  }
  telechargement(ecranId).subscribe();
}
