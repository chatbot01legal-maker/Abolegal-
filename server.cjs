const express = require("express");
const cors = require("cors");
const path = require("path");
const { processMessageUnified } = require("./modules/pipeline");
const { createCalendarEvent, listEvents } = require("./modules/calendar/googleCalendar");

const app = express();

/* ===============================
   CORS SEGURO - ACTUALIZADO
=============================== */
const allowedOrigins = [
    "https://abolegal.cl",
    "https://abolegal-lex.onrender.com",
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

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

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
        console.log(`📊 [CHAT] session=${sessionId} time=${Date.now() - start}ms`);
        res.json(result);

    } catch (error) {
        console.error("❌ SERVER ERROR", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

/* ===============================
   CALENDAR ENDPOINTS
=============================== */
app.post("/api/calendar/create-event", async (req, res) => {
    try {
        const { email, nombre, dia, hora, sessionId, comentarios } = req.body;
        const numDia = parseInt(dia.match(/\d+/)[0]);
        const [hh, mm] = hora.split(':');
        
        const fechaBase = `2026-05-${String(numDia).padStart(2, '0')}`;
        const slot = {
            start_iso: `${fechaBase}T${hora}:00`,
            end_iso: `${fechaBase}T${String(parseInt(hh) + 1).padStart(2, '0')}:${mm}:00`
        };

        console.log(`🚀 Agendando cita: ${nombre} (${email})`);
        const result = await createCalendarEvent(slot, sessionId || email, email, nombre, comentarios);
        
        res.json({ success: true, eventId: result.eventId, meetLink: result.meetLink });
    } catch (error) {
        console.error("❌ BOOKING ERROR", error.message);
        res.status(500).json({ error: "Error al agendar" });
    }
});

/* ===============================
   DISPONIBILIDAD (SSOT - Lógica de Timezone)
=============================== */
app.get("/api/calendar/availability", async (req, res) => {
    try {
        const { date } = req.query; // Formato: 2026-05-13
        const timeMin = `${date}T00:00:00Z`;
        const timeMax = `${date}T23:59:59Z`;

        const events = await listEvents(timeMin, timeMax);
        const slots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
        
        // 1. Obtener la hora EXACTA en Chile
        const formatterHour = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Santiago', hour: 'numeric', hourCycle: 'h23' });
        const nowChile = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }));
        
        const todayChile = `${nowChile.getFullYear()}-${String(nowChile.getMonth() + 1).padStart(2, '0')}-${String(nowChile.getDate()).padStart(2, '0')}`;
        const currentHourChile = parseInt(formatterHour.format(new Date()));

        // 2. Procesar eventos ocupados convirtiéndolos a la hora de Chile
        const occupied = events.map(event => {
            const start = new Date(event.start.dateTime || event.start.date);
            const h = formatterHour.format(start);
            return `${String(h).padStart(2, '0')}:00`;
        });

        // 3. Filtrar
        const availableSlots = slots.filter(slot => {
            if (occupied.includes(slot)) return false; // Ya agendado
            
            if (date === todayChile) {
                const slotHour = parseInt(slot.split(":")[0]);
                if (slotHour <= currentHourChile) return false; // Ya pasó la hora en Chile
            }
            return true;
        });

        res.json({ availableSlots });
        
    } catch (error) {
        console.error("❌ AVAILABILITY ERROR", error);
        res.status(500).json({ error: "Error al obtener disponibilidad" });
    }
});

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ===============================
   CONTACTO
=============================== */
app.post("/api/contact", async (req, res) => {

    try {

        console.log("━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📨 CONTACT REQUEST");

        const { name, email, message } = req.body;

        console.log("📦 BODY:", {
            name,
            email,
            message
        });

        if (!name || !email || !message) {

            console.error("❌ FALTAN CAMPOS");

            return res.status(400).json({
                error: "Faltan campos"
            });
        }

        console.log("✅ CONTACTO RECIBIDO");

        // Aquí después podrás:
        // - enviar email
        // - guardar en DB
        // - mandar a Telegram
        // etc

        res.json({
            success: true,
            message: "Mensaje recibido correctamente"
        });

    } catch (error) {

        console.error("❌ CONTACT ERROR", error);

        res.status(500).json({
            error: "Error interno servidor"
        });
    }

});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 ABOLEGAL LANDING ONLINE - PUERTO ${PORT}`);
});
