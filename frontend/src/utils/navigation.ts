/**
 * Navigate back to the landing/marketing page.
 * Clears app setup and auth state, then reloads to show LandingPage.
 */
export function goToLanding(): void {
  localStorage.removeItem('pos-app-store')
  localStorage.removeItem('pos-auth-store')
  window.location.reload()
}
