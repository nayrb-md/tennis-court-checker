// ============================================================================
// Filled in from Bryan's saved HTML capture (logged-in session, calendar
// popup open). Login goes through Keycloak SSO (sso.miraflores.gob.pe,
// realm "ciudadanos") rather than a form on the app itself. Username and
// password still use #username / #password; the submit button is a custom
// theme control (button[name="login"]), not Keycloak's default #kc-login.
// ============================================================================

module.exports = {
  // Base app URL. If not logged in, this redirects to Keycloak automatically.
  LOGIN_URL: 'https://apps.miraflores.gob.pe/alquiler-de-cancha/',

  // Confirmed from the saved page's own nav link.
  BOOKING_URL: 'https://apps.miraflores.gob.pe/alquiler-de-cancha/reserva-tu-cancha',

  SELECTORS: {
    // Keycloak's default login form field IDs.
    usernameInput: '#username',
    passwordInput: '#password',
    loginButton: 'button[name="login"]',

    // Visible date field on Paso 1. Wait until flatpickr has bound
    // (input.flatpickr-input) before clicking, or the popup never mounts.
    dateFieldToOpenCalendar: 'input[placeholder="Elige una fecha..."]',
    dateFieldWhenReady: 'input.flatpickr-input',

    // No separate cement/hard-court filter click was found in the capture —
    // the calendar shown was already scoped to a court type selected in a
    // prior step. Leave null unless you find a filter click is needed.
    cementCourtFilter: null,

    // Each day cell in the open flatpickr calendar.
    dayCell: '.flatpickr-day',

    // Confirmed real classes from flatpickr:
    //   disponible    = green, bookable
    //   ocupada       = red, fully booked
    //   no-disponible = grey, not open for booking yet (or in the past)
    availableClass: 'disponible',
    fullClass: 'ocupada',
    disabledClass: 'no-disponible',
  },
};
