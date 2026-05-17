// modules/lex.js
// LEX – ASISTENTE LEGAL PURO + INVITACIÓN DIRECTA A WIDGET (Carril Gemini 1.5 Pro)

console.log("🗣️ [LEX] Asistente legal con invitación directa a widget (carril independiente Gemini 1.5 Pro)");

const PERSONALIDAD_LEX = `
Eres Lex, un asistente legal chileno.

COMPORTAMIENTO CRÍTICO:
1. Si el usuario SOLICITA EXPLÍCIPAMENTE hablar con un abogado (ej: "quiero una videollamada", "necesito un abogado"):
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
    // Apuntamos al modelo Pro v1beta para evadir el bloqueo diario de la serie 2.0 Flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 220
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts[0]) {
      throw new Error("Estructura de respuesta inesperada de la API de Gemini");
    }

    const respuesta = data.candidates[0].content.parts[0].text.trim();
    
    if (shouldInviteWidget && !respuesta.toLowerCase().includes('widget') && !respuesta.toLowerCase().includes('agendar')) {
      return `${respuesta}\n\nPuedes usar el widget de abajo para agendar una videollamada con un abogado especializado.`;
    }
    
    return respuesta;

  } catch (error) {
    console.error("❌ [LEX] Error controlado:", error.message);
    
    if (analisis.user_requested_lawyer || shouldInviteWidget) {
      return "Entiendo perfectamente que necesitas la asesoría de un profesional. Para tu comodidad, puedes utilizar directamente el widget de agendamiento que se encuentra aquí abajo para reservar tu videollamada.";
    }
    
    return "Hola. He recibido tu mensaje de forma correcta. Cuéntame un poco más acerca de tu situación para dejar los antecedentes listos mientras preparamos tu atención.";
  }
}

module.exports = { lexReply };

