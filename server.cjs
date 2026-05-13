const express = require("express");
const cors = require("cors");
const path = require("path");
const { processMessageUnified } = require("./modules/pipeline");
// Calendar module will be added later

const { createCalendarEvent, listEvents } = require("./modules/calendar/googleCalendar");


// const { createCalendarEvent } = require("./modules/calendar/googleCalendar");

const app = express();

/* ===============================
   CORS SEGURO - ACTUALIZADO
=============================== */
const allowedOrigins = [
    "https://abolegal.cl",
    "https://abolegal-lex.onrender.com", // Dominio actual de Render
    "https://ai-team-backend.onrender.com",
    "https://ai-team-frontend.onrender.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:10000"
];

app.use(
    cors({
        origin: function (origin, callback) {
            // Permitir si no hay origen (como apps móviles o curl) o si está en la lista
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.warn(`🚨 CORS bloqueado: ${origin}`);
                callback(new Error("Origen no permitido por CORS"));
            }
        },
        credentials: true,
    })
);


/* ===============================
   MIDDLEWARE
=============================== */
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ===============================
   HEALTH CHECK
=============================== */
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/* ===============================
   API CHAT
=============================== */
app.post("/api/chat", async (req, res) => {
    const start = Date.now();

    try {
        const { message, sessionId } = req.body;

        if (!message || !sessionId) {
            return res.status(400).json({ error: "Message and sessionId are required" });
        }

        const result = await processMessageUnified(sessionId, message, new Date().toLocaleDateString('es-CL'));
        const duration = Date.now() - start;
        console.log(
            `📊 [CHAT] session=${sessionId} time=${duration}ms chars=${message.length}`
        );

        res.json(result);

    } catch (error) {
        console.error("❌ SERVER ERROR", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

/* ===============================
   CALENDAR ENDPOINTS (SINCRONIZADOS)
=============================== */
app.post("/api/calendar/create-event", async (req, res) => {
    try {
        const { email, nombre, dia, hora, sessionId } = req.body;

        // Formateo quirúrgico: "Mié 13" -> 13
        const numDia = parseInt(dia.match(/\d+/)[0]);
        const [hh, mm] = hora.split(':');
        
        // Mayo 2026 (Mes 4 es Mayo en JS)
        const startDate = new Date(2026, 4, numDia, parseInt(hh), parseInt(mm));
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); 

        const slot = {
            start_iso: startDate.toISOString(),
            end_iso: endDate.toISOString()
        };

        console.log(`🚀 Agendando cita OAuth2 para: ${nombre} (${email})`);
        const result = await createCalendarEvent(slot, sessionId || email);

        res.json({ 
            success: true, 
            message: "Cita agendada en Google Calendar",
            eventId: result.eventId,
            meetLink: result.meetLink
        });
        
    } catch (error) {
        console.error("❌ CALENDAR ERROR", error.message);
        res.status(500).json({ error: "Error al conectar con Google Calendar" });
    }
});

/* ===============================
   FALLBACK ROUTE - SERVE INDEX.HTML
=============================== */
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ===============================
   START SERVER
=============================== */
const PORT = process.env.PORT || 10000;

const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.listen(PORT, () => {
    console.log(`🚀 ABOLEGAL LANDING ONLINE - PUERTO ${PORT}`);
    console.log(`🌐 Frontend: ${BASE_URL}`);
    console.log(`💬 Chat API: ${BASE_URL}/api/chat`);
    console.log(`📅 Calendar API: ${BASE_URL}/api/calendar/availability`);
});
