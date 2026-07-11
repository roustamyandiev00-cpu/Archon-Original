export const PWA_DISMISS_KEY = "archonpro-a2hs-dismissed";

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    // Safari iOS
    ("standalone" in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
}

export function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIos = isIosDevice();
  const isOtherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIos && !isOtherBrowser;
}

export function canShowAddToHomeScreenPrompt(): boolean {
  if (typeof window === "undefined") return false;
  if (isStandaloneDisplay()) return false;
  if (!isIosDevice()) return false;
  try {
    return localStorage.getItem(PWA_DISMISS_KEY) !== "1";
  } catch {
    return true;
  }
}

export function dismissAddToHomeScreenPrompt(): void {
  try {
    localStorage.setItem(PWA_DISMISS_KEY, "1");
  } catch {
    // ignore storage errors
  }
}
