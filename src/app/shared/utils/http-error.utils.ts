export interface ExtractErrorMessageOptions {
  includeTopLevelMessage?: boolean;
}

export function extractErrorMessage(
  error: unknown,
  options?: ExtractErrorMessageOptions,
): string | undefined {
  const nested = (
    error as {
      error?: { message?: string | string[]; detail?: unknown };
    }
  )?.error;

  const detail = nested?.detail;
  if (typeof detail === 'string') {
    return detail;
  }

  const nestedMessage = nested?.message;
  if (Array.isArray(nestedMessage)) {
    return nestedMessage.join(' ');
  }
  if (typeof nestedMessage === 'string') {
    return nestedMessage;
  }

  if (options?.includeTopLevelMessage !== false) {
    const topLevelMessage = (error as { message?: string })?.message;
    if (typeof topLevelMessage === 'string') {
      return topLevelMessage;
    }
  }

  return undefined;
}
