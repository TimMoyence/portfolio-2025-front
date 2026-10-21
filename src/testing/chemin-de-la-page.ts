export async function aLaPage<T>(chemin: string, action: () => T | Promise<T>): Promise<T> {
  const origine = `${location.pathname}${location.search}`;
  history.replaceState(history.state, '', chemin);
  try {
    return await action();
  } finally {
    history.replaceState(history.state, '', origine);
  }
}
