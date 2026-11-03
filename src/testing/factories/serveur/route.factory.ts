import type { Provider } from '@angular/core';
import type { Data, Params } from '@angular/router';
import { ActivatedRoute, convertToParamMap, PRIMARY_OUTLET } from '@angular/router';
import type { Observable } from 'rxjs';
import { of } from 'rxjs';

export function fournirLaRoute({
  parametres = {},
  requete = {},
  donnees = of({}),
  donneesFigees = {},
}: {
  readonly parametres?: Params;
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
      firstChild: null,
      outlet: PRIMARY_OUTLET,
      data: donnees,
    },
  };
}
