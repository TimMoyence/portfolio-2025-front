import type { ActivatedRoute } from '@angular/router';

export function jetonDuLien(route: ActivatedRoute): string | null {
  return route.snapshot.queryParamMap.get('token')?.trim() || null;
}
