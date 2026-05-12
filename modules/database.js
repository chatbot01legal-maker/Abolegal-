// database.js — CON PERSISTENCIA COMPLETA PARA BUSINESS INTELLIGENCE
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error("❌ No se encontró la variable de entorno MONGODB_URI");
    process.exit(1);
}

let client = null;
let db = null;
let isConnecting = false;

function normalizeSessionId(rawId) {
    if (!rawId) return "session_" + Date.now();
    if (Array.isArray(rawId)) return String(rawId[0]);
    if (typeof rawId === "object") return JSON.stringify(rawId);
    return String(rawId);
}

async function connect() {
    if (!client && !isConnecting) {
        isConnecting = true;
        try {
            client = new MongoClient(uri);
            await client.connect();
            console.log("🟢 [DB] Conectado a MongoDB");
            db = client.db();
            isConnecting = false;
            return db;
        } catch (error) {
            isConnecting = false;
            console.error("❌ [DB] Error de conexión:", error);
            throw error;
        }
    }
    while (isConnecting) { await new Promise(r => setTimeout(r, 100)); }
    return db;
}

// 📊 FUNCIÓN PRINCIPAL: Guardar sesión
async function saveSession(rawSessionId, data = {}) {
    try {
        const database = await connect();
        const sessionId = normalizeSessionId(rawSessionId);

        // 🔒 Usar $set para no borrar campos existentes
        const updateData = { ...data, updatedAt: new Date() };

        const result = await database.collection("sessions").updateOne(
            { _id: sessionId },
            { $set: updateData },
            { upsert: true }
        );

        console.log(`💾 [DB] Sesión guardada: ${sessionId} (${result.upsertedId ? 'nueva' : 'actualizada'})`);
        return true;

    } catch (error) {
        console.error(`❌ [DB] Error guardando sesión:`, error.message);
        return false;
    }
}

// 📊 FUNCIÓN NUEVA: Guardar mensaje individual con metadata completo
async function saveConversationMessage(rawSessionId, messageData = {}) {
    try {
        const database = await connect();
        const sessionId = normalizeSessionId(rawSessionId);

        // ✅ FIX CRÍTICO: Asegurar que content sea string antes de usar substring
        const content = String(messageData.content || "");
        const contentPreview = content.substring(0, 50);

        // Estructura completa para business intelligence
        const messageRecord = {
            sessionId: sessionId,
            timestamp: messageData.timestamp || new Date(),
            role: messageData.role || "unknown",
            content: content, // ✅ Ya convertido a string
            source: messageData.source || "unknown",
            organizerState: messageData.organizerState || null,
            analysis: messageData.analysis || null,
            booking: messageData.booking || null,
            isError: messageData.isError || false,
            metadata: {
                storedAt: new Date(),
                version: "1.0"
            }
        };

        // Insertar en colección de conversaciones
        const result = await database.collection("conversations").insertOne(messageRecord);

        console.log(`💬 [DB] Mensaje guardado: ${sessionId} (${messageData.role}: ${contentPreview}...)`);
        return { success: true, messageId: result.insertedId };

    } catch (error) {
        console.error(`❌ [DB] Error guardando mensaje:`, error.message);
        return { success: false, error: error.message };
    }
}

// 📊 Obtener sesión
async function getSession(rawSessionId) {
    try {
        const database = await connect();
        const sessionId = normalizeSessionId(rawSessionId);
        return await database.collection("sessions").findOne({ _id: sessionId });
    } catch (error) {
        console.error(`❌ [DB] Error obteniendo sesión:`, error.message);
        return null;
    }
}

// 📊 Obtener historial de conversación (últimos N mensajes)
async function getConversationHistory(rawSessionId, limit = 50) {
    try {
        const database = await connect();
        const sessionId = normalizeSessionId(rawSessionId);

        return await database.collection("conversations")
            .find({ sessionId: sessionId })
            .sort({ timestamp: 1 })
            .limit(limit)
            .toArray();

    } catch (error) {
        console.error(`❌ [DB] Error obteniendo historial:`, error.message);
        return [];
    }
}

// 📊 Guardar acción específica (para analytics)
async function saveAction(sessionId, actionType, actionData = {}) {
    try {
        const database = await connect();

        const actionRecord = {
            sessionId: normalizeSessionId(sessionId),
            actionType: actionType,
            timestamp: new Date(),
            ...actionData,
            metadata: {
                storedAt: new Date(),
                userAgent: actionData.userAgent || null,
                ip: actionData.ip || null
            }
        };

        await database.collection("actions").insertOne(actionRecord);
        console.log(`📈 [DB] Acción guardada: ${actionType} para ${sessionId}`);
        return true;

    } catch (error) {
        console.error(`❌ [DB] Error guardando acción:`, error.message);
        return false;
    }
}

// 📊 Métricas: contar conversiones por periodo
async function getConversionMetrics(startDate, endDate) {
    try {
        const database = await connect();

        const pipeline = [
            {
                $match: {
                    timestamp: { $gte: startDate, $lte: endDate },
                    role: "bot",
                    "booking.eventId": { $exists: true }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                        area: "$analysis.area"
                    },
                    totalBookings: { $sum: 1 },
                    uniqueSessions: { $addToSet: "$sessionId" }
                }
            },
            {
                $project: {
                    date: "$_id.date",
                    area: "$_id.area",
                    totalBookings: 1,
                    uniqueSessions: { $size: "$uniqueSessions" }
                }
            },
            { $sort: { date: -1, area: 1 } }
        ];

        return await database.collection("conversations").aggregate(pipeline).toArray();

    } catch (error) {
        console.error(`❌ [DB] Error obteniendo métricas:`, error.message);
        return [];
    }
}

module.exports = {
    connect,
    saveSession,
    getSession,
    saveConversationMessage,
    getConversationHistory,
    saveAction,
    getConversionMetrics,

    // Compatibilidad con código existente
    saveConversationHistory: async (rawSessionId, role, content) => {
        return await saveConversationMessage(rawSessionId, {
            role: role,
            content: content,
            timestamp: new Date()
        });
    },

    getHistory: async (id) => {
        const session = await getSession(id);
        return session?.conversationHistory || [];
    },

    isConnected: async () => {
        try {
            const d = await connect();
            await d.command({ ping: 1 });
            return true;
        } catch {
            return false;
        }
    }
};
