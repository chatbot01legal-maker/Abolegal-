const { google } = require("googleapis");

/**
 * Carga credenciales OAuth2 desde variables de entorno individuales.
 * CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, REDIRECT_URI
 */
function loadCredentials() {
  // Leer directamente de las variables individuales (como tu script de prueba)
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const refreshToken = process.env.REFRESH_TOKEN;
  const redirectUri = process.env.REDIRECT_URI;

  // Validar que todas las necesarias estén presentes
  if (!clientId || !clientSecret || !refreshToken) {
    console.error("❌ Faltan variables de entorno OAuth2 (CLIENT_ID, CLIENT_SECRET o REFRESH_TOKEN).");
    throw new Error("Faltan credenciales OAuth2");
  }

  console.log("✅ Credenciales OAuth2 cargadas desde variables individuales");

  // Devolver objeto con las credenciales en el formato esperado
  return {
    CLIENT_ID: clientId,
    CLIENT_SECRET: clientSecret,
    REFRESH_TOKEN: refreshToken,
    REDIRECT_URI: redirectUri || "https://developers.google.com/oauthplayground"
  };
}

// Inicializar una vez y reutilizar
let oauth2Client = null;
let calendarClient = null;

function getCalendarClient() {
  if (calendarClient) return calendarClient;

  const creds = loadCredentials();

  oauth2Client = new google.auth.OAuth2(
    creds.CLIENT_ID,
    creds.CLIENT_SECRET,
    creds.REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: creds.REFRESH_TOKEN
  });

  calendarClient = google.calendar({
    version: "v3",
    auth: oauth2Client
  });

  console.log("✅ Cliente de Google Calendar configurado (OAuth2)");
  return calendarClient;
}

/**
 * Lista eventos de Google Calendar en un rango de tiempo
 * @param {string} timeMin - Fecha mínima en ISO string
 * @param {string} timeMax - Fecha máxima en ISO string
 * @param {string} calendarId - ID del calendario (opcional)
 * @returns {Promise<Array>} Lista de eventos
 */
async function listEvents(timeMin, timeMax, calendarId = null) {
  try {
    const calendar = getCalendarClient();
    const calId = calendarId || process.env.GOOGLE_CALENDAR_ID || "primary";

    console.log(`📅 Listando eventos en calendario: ${calId}`);
    console.log(`⏰ Desde: ${timeMin} Hasta: ${timeMax}`);

    const response = await calendar.events.list({
      calendarId: calId,
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: process.env.CALENDAR_TIMEZONE || "America/Santiago"
    });

    console.log(`✅ Eventos encontrados: ${response.data.items?.length || 0}`);
    return response.data.items || [];
  } catch (error) {
    console.error("❌ Error en listEvents:");
    console.error("Mensaje:", error.message);
    if (error.response) {
      console.error("Código:", error.response.status);
      console.error("Detalles:", JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

/**
 * Crea un evento en Google Calendar
 * @param {Object} slot - { start_iso: string, end_iso: string }
 * @param {string} sessionId - ID de sesión del usuario
 * @returns {Promise<{eventId: string, meetLink: string, htmlLink: string}>}
 */
async function createCalendarEvent(slot, sessionId) {
  try {
    const calendar = getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
    
    // CORREGIDO: Usar nicolas.blanco@abolegal.cl como correo principal del abogado
    // Mantener chatbot.01.legal@gmail.com como respaldo para el sistema
    const abogadoEmail = process.env.LAWYER_EMAIL || "nicolas.blanco@abolegal.cl";
    const systemEmail = "chatbot.01.legal@gmail.com";

    console.log(`📅 Creando evento en calendario: ${calendarId}`);
    console.log(`📧 Invitando a: ${abogadoEmail} (abogado principal)`);
    console.log(`📧 Invitando a: ${systemEmail} (sistema)`);
    console.log(`🕐 Slot: ${slot.start_iso} -> ${slot.end_iso}`);

    const event = {
      summary: "Consulta Legal - Agendamiento Bot",
      description: `Consulta legal agendada a través del chatbot.\nSession ID: ${sessionId}\nCliente: ${sessionId}`,
      start: {
        dateTime: slot.start_iso,
        timeZone: process.env.CALENDAR_TIMEZONE || "America/Santiago"
      },
      end: {
        dateTime: slot.end_iso,
        timeZone: process.env.CALENDAR_TIMEZONE || "America/Santiago"
      },
      attendees: [
        { email: abogadoEmail, displayName: "Abogado ABOLEGAL" },
        { email: systemEmail, displayName: "Sistema ABOLEGAL" }
      ],
      conferenceData: {
        createRequest: {
          requestId: `meet-${sessionId}-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" }
        }
      },
      reminders: {
        useDefault: true
      }
    };

    const response = await calendar.events.insert({
      calendarId: calendarId,
      resource: event,
      sendUpdates: 'all',
      conferenceDataVersion: 1
    });

    console.log(`✅ Evento creado: ${response.data.id}`);
    console.log(`🔗 Meet: ${response.data.hangoutLink}`);

    return {
      eventId: response.data.id,
      meetLink: response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri || "https://meet.google.com/...",
      htmlLink: response.data.htmlLink
    };

  } catch (error) {
    console.error("❌ Error en createCalendarEvent:");
    console.error("Mensaje:", error.message);
    if (error.response) {
      console.error("Código:", error.response.status);
      console.error("Detalles:", JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

module.exports = { createCalendarEvent, listEvents };
