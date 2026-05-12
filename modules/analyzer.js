// modules/analyzer.js — VERSIÓN 4.6.0-SEMANTICO-PURO
const { GoogleGenerativeAI } = require("@google/generative-ai");

const ANALYZER_VERSION = "4.6.0-SEMANTICO-PURO";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * CONTRATO DE SALIDA OBLIGATORIO:
 * {
 *   area: "Laboral"|"Familia"|"Accidentes"|"Herencias"|"Penal"|"Civil"|"General",
 *   conversation_phase: "initial"|"exploring"|"clarifying"|"closing",
 *   user_requested_lawyer: boolean,
 *   user_has_clarity: boolean,
 *   should_offer_videocall: boolean,
 *   should_interrupt_organizer: boolean,  // Solo cuando organizerState='awaiting_selection'
 *   user_time_preference: string|null,    // Ej: "jueves en la mañana"
 *   source: "gemini"|"fallback_degraded",
 *   version: string
 * }
 */
async function analyzeMessage(userMessage, sessionId, conversationHistory = [], organizerState = null) {
    // 1. DETECCIÓN SIMPLE DE EMAIL (sin análisis)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailRegex.test(userMessage.trim()) && userMessage.trim().length < 100) {
        return {
            area: "General",
            conversation_phase: "exploring",
            user_requested_lawyer: false,
            user_has_clarity: false,
            should_offer_videocall: false,
            should_interrupt_organizer: false,
            user_time_preference: null,
            source: "email_skip",
            version: ANALYZER_VERSION
        };
    }

    // 2. 🔥 NUEVO: DETECCIÓN POR PALABRAS CLAVE PARA ABOGADO/VIDEOLAMADA
    const lowerMessage = userMessage.toLowerCase();
    const lawyerKeywords = [
        'videollamada con abogado',
        'hablar con abogado', 
        'consultar con abogado',
        'necesito un abogado',
        'quiero un abogado',
        'agendar con abogado',
        'cita con abogado',
        'asesoría legal',
        'abogado'
    ];
    
    const hasExplicitLawyerRequest = lawyerKeywords.some(keyword => 
        lowerMessage.includes(keyword)
    );
    
    // Si el usuario pide explícitamente abogado, saltar análisis complejo
    if (hasExplicitLawyerRequest) {
        console.log("🎯 [ANALYZER] Detección por keyword: solicitud explícita de abogado");
        return {
            area: "General",
            conversation_phase: "closing",
            user_requested_lawyer: true,
            user_has_clarity: true,
            should_offer_videocall: true,
            should_interrupt_organizer: false,
            user_time_preference: null,
            source: "keyword_detection",
            version: ANALYZER_VERSION
        };
    }

    // 3. EVITAR ANÁLISIS EN FASE CLOSING (optimización)
    const lastPhase = conversationHistory.length > 0 ?
        conversationHistory[conversationHistory.length - 1]?.analysis?.conversation_phase : null;
    if (lastPhase === "closing" && organizerState !== 'awaiting_selection') {
        console.log("⏭️ [ANALYZER] Fase closing detectada, análisis simplificado");
        return {
            area: "General",
            conversation_phase: "closing",
            user_requested_lawyer: false,
            user_has_clarity: true,
            should_offer_videocall: true,
            should_interrupt_organizer: false,
            user_time_preference: null,
            source: "phase_skip",
            version: ANALYZER_VERSION
        };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const historyText = conversationHistory.slice(-5).map(e => `${e.role}: ${e.content}`).join("\n");

        // 4. PROMPT MEJORADO PARA DETECTAR SOLICITUD DE ABOGADO
        let systemPrompt = `ERES UN EXPERTO EN ANÁLISIS DE INTENCIÓN LEGAL.
Analiza el mensaje del usuario y determina:

1. ÁREA LEGAL: "Laboral", "Familia", "Accidentes", "Herencias", "Penal", "Civil", "General"
2. FASE DE CONVERSACIÓN: "initial", "exploring", "clarifying", "closing"
3. ¿El usuario ha solicitado EXPLÍCITAMENTE hablar con un abogado? (user_requested_lawyer)
   - Ejemplos: "quiero hablar con un abogado", "necesito un abogado", "videollamada con abogado"
4. ¿El usuario ha alcanzado claridad y está listo para acción? (user_has_clarity)`;

        // 5. DETECCIÓN DE INTERRUPCIÓN PARA ORGANIZADOR
        if (organizerState === 'awaiting_selection') {
            systemPrompt += `

CONTEXTO ESPECIAL: El sistema está esperando selección de horario (1-5).
Si el usuario pide algo diferente (ej: "quiero el jueves", "en la mañana", "otro día"),
añade al JSON:
"should_interrupt_organizer": true
"user_time_preference": "texto de lo que pide"`;
        }

        systemPrompt += `

Responde SOLO con JSON válido. No uses markdown.`;

        const prompt = `${systemPrompt}

HISTORIAL:
${historyText}

MENSAJE:
"${userMessage}"`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        // 5. MEJOR VALIDACIÓN JSON
        let analysis = {};
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            }
        } catch (jsonError) {
            console.warn(`⚠️ [ANALYZER] JSON inválido de Gemini: ${jsonError.message}`);
        }

        // 6. VALIDACIÓN Y ESTRUCTURA DE RESPUESTA - CON REFUERZO PARA ABOGADO
        const validatedAnalysis = {
            area: analysis.area || "General",
            conversation_phase: analysis.conversation_phase || "exploring",
            user_requested_lawyer: Boolean(analysis.user_requested_lawyer) || hasExplicitLawyerRequest,
            user_has_clarity: Boolean(analysis.user_has_clarity),
            should_offer_videocall: Boolean(analysis.user_requested_lawyer || hasExplicitLawyerRequest ||
                                           (analysis.conversation_phase === "closing" && analysis.user_has_clarity)),
            should_interrupt_organizer: Boolean(analysis.should_interrupt_organizer),
            user_time_preference: analysis.user_time_preference || null,
            source: "gemini",
            version: ANALYZER_VERSION
        };

        console.log(`📊 [ANALYZER] Resultado:`, {
            area: validatedAnalysis.area,
            phase: validatedAnalysis.conversation_phase,
            lawyerRequest: validatedAnalysis.user_requested_lawyer,
            shouldOfferVideocall: validatedAnalysis.should_offer_videocall,
            source: validatedAnalysis.source
        });

        return validatedAnalysis;

    } catch (error) {
        console.error("❌ [ANALYZER] Error Gemini:", error.message);
        return {
            area: "General",
            conversation_phase: "exploring",
            user_requested_lawyer: false,
            user_has_clarity: false,
            should_offer_videocall: false,
            should_interrupt_organizer: false,
            user_time_preference: null,
            source: "fallback_degraded",
            version: ANALYZER_VERSION
        };
    }
}

module.exports = { analyzeMessage, ANALYZER_VERSION };
