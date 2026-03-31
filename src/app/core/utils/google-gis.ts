/** Charge dynamiquement le script Google Identity Services. */
let gisLoadPromise: Promise<void> | null = null;

export function loadGoogleGis(): Promise<void> {
  if (gisLoadPromise) return gisLoadPromise;

  gisLoadPromise = new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") {
      gisLoadPromise = null;
      reject(new Error("SSR: document not available"));
      return;
    }

    if (typeof google !== "undefined" && google.accounts?.id) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisLoadPromise = null;
      reject(new Error("Failed to load Google Identity Services"));
    };
    document.head.appendChild(script);
  });

  return gisLoadPromise;
}
