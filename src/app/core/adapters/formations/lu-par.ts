import type { OperatorFunction } from 'rxjs';
import { map } from 'rxjs/operators';
import type { z } from 'zod';

export function luPar<T>(schema: z.ZodType<T>): OperatorFunction<unknown, T> {
  return map((corps: unknown) => schema.parse(corps));
}
