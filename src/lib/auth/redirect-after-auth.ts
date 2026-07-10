/** Volledige navigatie na login — betrouwbaarder dan router.push op mobiel/LAN. */
export function redirectAfterAuth(target: string) {
  const url = target.startsWith("/") ? target : `/${target}`;
  window.location.assign(url);
}
