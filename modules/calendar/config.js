/**
 * Calendar configuration centralizada
 *
 * ⚠️ Persistencia actual en memoria (Organizer FSM)
 *    Diseñado para migrar a DB en el futuro sin romper contratos.
 */

module.exports = {
  calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
  slotDurationMinutes: 60,
  timezone: "America/Santiago",
  apiTimeoutMs: 10000,
  retry: {
    enabled: false,
    maxRetries: 0
  }
};
