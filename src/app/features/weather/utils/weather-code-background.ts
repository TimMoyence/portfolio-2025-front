export function weatherCodeToBackground(code: number, isNight = false): string {
  if (isNight) return 'from-gray-900 via-blue-950 to-indigo-950';

  if (code === 0) return 'from-sky-400 via-blue-500 to-blue-600';

  if (code <= 2) return 'from-sky-300 via-blue-400 to-blue-500';

  if (code === 3) return 'from-gray-400 via-gray-500 to-gray-600';

  if (code >= 45 && code <= 48) return 'from-gray-300 via-gray-400 to-gray-500';

  if (code >= 51 && code <= 67) return 'from-gray-500 via-blue-600 to-blue-700';

  if (code >= 71 && code <= 77) return 'from-gray-200 via-blue-200 to-gray-300';

  if (code >= 80 && code <= 86) return 'from-gray-600 via-blue-700 to-blue-800';

  if (code >= 95) return 'from-gray-700 via-purple-800 to-gray-900';

  return 'from-blue-900 via-indigo-900 to-purple-900';
}
