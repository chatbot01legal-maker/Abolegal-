// modules/lex.js
// LEX – ASISTENTE LEGAL PURO + INVITACIÓN DIRECTA A WIDGET

const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log("🗣️ [LEX] Asistente legal con invitación directa a widget");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  generationConfig: {
    temperature: 0.6,
    maxOutputTokens: 220
  }
});

const PERSONALIDAD_LEX = `
Eres Lex, un asistente legal chileno.

COMPORTAMIENTO CRÍTICO:
1. Si el usuario SOLICITA EXPLÍCITAMENTE hablar con un abogado (ej: "quiero una videollamada", "necesito un abogado"):
   - NO hagas más preguntas
   - Invita DIRECTAMENTE al widget de agendamiento
   - Ejemplo: "Entiendo. Puedes usar el widget de abajo para agendar una videollamada con un abogado."

2. Si el mensaje es emocional o inicial (ej: "me separé"):
   - Primero contención emocional breve
   - Luego 1-2 preguntas para entender contexto
   - NO des información legal extensa de inmediato

3. Solo da información legal cuando:
   - El usuario la pide explícitamente
   - O ya tienes suficiente contexto

TONO:
- Cercano y empático
- Respuestas breves (máx 3 párrafos cortos)
- Español chileno claro
`;

async function lexReply(
  mensaje,
  sessionId,
  analisis = {},
  conversationHistory = []
) {
  console.log(`🧠 [LEX] Sesión ${sessionId.substring(0, 8)}…`);
  console.log(`   📊 Análisis: lawyer=${analisis.user_requested_lawyer}, widget=${analisis.should_offer_videocall}`);

  /* =====================================================
     CONTEXTO LEGAL
  ===================================================== */
  let contextoLegal = '';
  if (analisis.area && analisis.area !== 'general') {
    contextoLegal = `[Área legal: ${analisis.area}. Responde solo sobre este área.]`;
  }

  /* =====================================================
     DETECCIÓN DE MOMENTO PARA INVITAR WIDGET - MEJORADO
  ===================================================== */
  const shouldInviteWidget = 
    analisis.user_requested_lawyer === true ||
    analisis.conversation_phase === 'closing' ||
    analisis.should_offer_videocall === true;

  let invitacionWidget = '';
  if (shouldInviteWidget) {
    // 🔥 INVITACIÓN DIRECTA Y CLARA
    invitacionWidget = `
IMPORTANTE: El usuario ha solicitado hablar con un abogado o está listo para acción.

RESPONDE DIRECTAMENTE con:
1. Confirmación breve de que entendiste
2. Instrucción clara para usar el widget
3. NO hagas más preguntas
4. Ejemplo: "Entiendo que quieres hablar con un abogado. Puedes usar el widget de abajo para agendar una videollamada."

NO preguntes sobre el tema ni pidas más detalles.
`;
  }

  /* =====================================================
     HISTORIAL
  ===================================================== */
  const historialTexto = conversationHistory
    .slice(-6)
    .map(m => `${m.role === 'user' ? 'USUARIO' : 'LEX'}: ${m.content}`)
    .join('\n');

  const prompt = `
${PERSONALIDAD_LEX}
${contextoLegal}

${invitacionWidget}

HISTORIAL:
${historialTexto || "Inicio de la conversación"}

MENSAJE DEL USUARIO:
"${mensaje}"

INSTRUCCIONES FINALES:
- Respuesta máxima: 3 párrafos cortos
- Si el usuario pide abogado: invita al widget directamente
- Si es emocional: contención primero, luego preguntas
- No des listas ni enumeraciones largas
- No prometas resultados
`;

  try {
    const resultado = await model.generateContent(prompt);
    const respuesta = resultado.response.text().trim();
    
    // 🔥 REFUERZO: Si debería invitar pero no lo menciona, añadirlo
    if (shouldInviteWidget && !respuesta.toLowerCase().includes('widget') && !respuesta.toLowerCase().includes('agendar')) {
      return `${respuesta}\n\nPuedes usar el widget de abajo para agendar una videollamada con un abogado especializado.`;
    }
    
    return respuesta;

  } catch (error) {
    console.error("❌ [LEX] Error:", error.message);
    
    // Fallback inteligente
    if (analisis.user_requested_lawyer) {
      return "Entiendo que quieres hablar con un abogado. Puedes usar el widget de agendamiento que aparece más abajo para reservar una videollamada.";
    }
    
    return "Entiendo. Si quieres, cuéntame un poco más para poder orientarte mejor.";
  }
}

module.exports = { lexReply };
