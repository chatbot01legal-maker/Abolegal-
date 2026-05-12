const analyzer = require("./analyzer");
const { lexReply } = require("./lex");
const db = require("./database");

/* ===============================
   PIPELINE PRINCIPAL
   Asistente Legal Puro (sin agenda)
=============================== */

async function processMessageUnified(sessionId, message) {
  if (!sessionId || !message) {
    throw new Error("sessionId y message son obligatorios");
  }

  // 1. Obtener o crear sesión
  let session = await db.getSession(sessionId);

  if (!session) {
    session = {
      _id: sessionId,
      conversationHistory: [],
      metadata: {
        createdAt: new Date(),
        messageCount: 0,
      },
    };
  }

  const conversationHistory = session.conversationHistory || [];

  // 2. Análisis contextual
  const analisis = await analyzer.analyzeMessage(
    message,
    sessionId,
    conversationHistory
  );

  // 3. Generación de respuesta (Lex SOLO genera, no persiste)
  const reply = await lexReply(
    message,
    sessionId,
    analisis,
    conversationHistory
  );

  // 4. Persistencia CENTRALIZADA
  session.conversationHistory.push(
    { role: "user", content: message },
    { role: "assistant", content: reply }
  );

  session.metadata.messageCount += 1;
  session.metadata.updatedAt = new Date();

  await db.saveSession(sessionId, session);

  // 5. Respuesta compatible con server.cjs / frontend - ✅ MODIFICADO
  return {
    reply,
    source: "lex",
    sessionId,
    timestamp: new Date().toISOString(),
    context: {
      turno: session.metadata.messageCount,
      area: analisis.area,                    // ✅ Solo campo útil para UI
      phase: analisis.conversation_phase,     // ✅ Solo campo útil para UI
      widgetRelevant: analisis.should_offer_videocall  // ✅ Flag para widget UI (opcional)
    }
    // ❌ NO se incluye 'analysis' completo
  };
}

module.exports = {
  processMessageUnified,
};
