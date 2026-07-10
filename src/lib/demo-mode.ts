/**
 * Demogegevens alleen in anonieme voorbeeldmodus — nooit voor echte accounts.
 */
export function showDemoData(isPreviewMode: boolean, isEmpty: boolean): boolean {
  return isPreviewMode && isEmpty;
}
