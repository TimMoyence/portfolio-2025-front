import type { Provider } from '@angular/core';
import type { Data, Params } from '@angular/router';
import { ActivatedRoute, convertToParamMap, PRIMARY_OUTLET } from '@angular/router';
import type { Observable } from 'rxjs';
import { map, of } from 'rxjs';

export function fournirLaRoute({
  parametres = {},
  parametresSuccessifs,
  requete = {},
  donnees = of({}),
  donneesFigees = {},
}: {
  readonly parametres?: Params;
  readonly parametresSuccessifs?: Observable<Params>;
  readonly requete?: Params;
  readonly donnees?: Observable<Data>;
  readonly donneesFigees?: Data;
} = {}): Provider {
  return {
    provide: ActivatedRoute,
    useValue: {
      snapshot: {
        paramMap: convertToParamMap(parametres),
        queryParamMap: convertToParamMap(requete),
        data: donneesFigees,
      },
      paramMap: (parametresSuccessifs ?? of(parametres)).pipe(map(convertToParamMap)),
      firstChild: null,
      outlet: PRIMARY_OUTLET,
      data: donnees,
    },
  };
}
