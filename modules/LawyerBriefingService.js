// modules/LawyerBriefingService.js - Genera informe para el abogado
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Session = require('./sessionModel'); // Ajusta la ruta según tu proyecto
const EmailService = require('./emailService'); // Ajusta la ruta

class LawyerBriefingService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('📋 LawyerBriefingService iniciado');
  }

  /**
   * Genera y envía un informe para el abogado
   * @param {string} sessionId - ID de la sesión a analizar
   * @param {Object} bookingDetails - Detalles de la cita agendada
   */
  async generateAndSendBriefing(sessionId, bookingDetails) {
    try {
      console.log(`📋 Generando informe para sesión: ${sessionId}`);

      // 1. Obtener historial de conversación
      const session = await Session.findOne({ sessionId });
      if (!session || !session.messages || session.messages.length === 0) {
        throw new Error(`No se encontraron mensajes para la sesión ${sessionId}`);
      }

      // 2. Formatear conversación para Gemini
      const conversationText = session.messages.map(msg => 
        `${msg.role === 'user' ? 'Usuario' : 'Lex'}: ${msg.content}`
      ).join('\n');

      // 3. Prompt para Gemini
      const prompt = `Eres un asistente legal experto. Analiza la siguiente conversación y genera un informe conciso para el abogado que atenderá la videollamada.

CONVERSACIÓN:
${conversationText}

INSTRUCCIONES PARA EL INFORME:
1. PROBLEMA LEGAL PRINCIPAL: Identifica en una línea el núcleo del problema (ej: "Despido injustificado", "Deuda comercial", "Divorcio").
2. DATOS CLAVE DEL CLIENTE: Lista en bullet points la información relevante obtenida (tiempo de trabajo, documentos faltantes, fechas, etc.).
3. CONTEXTO Y ESTADO EMOCIONAL: Describe brevemente cómo se presenta el cliente (ansioso, confundido, urgente, etc.).
4. PREPARACIÓN SUGERIDA PARA EL ABOGADO: Recomienda 2-3 puntos específicos en los que el abogado debe enfocarse o prepararse para la consulta.

Formato la respuesta en español, sé profesional pero directo.`;

      // 4. Generar informe con Gemini
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const briefingText = result.response.text();

      // 5. Enviar informe por correo al abogado
      const emailResult = await this.sendBriefingToLawyer(
        briefingText, 
        sessionId, 
        bookingDetails
      );

      return { success: true, briefing: briefingText, emailResult };

    } catch (error) {
      console.error('❌ Error en LawyerBriefingService:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envía el informe generado al abogado
   */
  async sendBriefingToLawyer(briefingText, sessionId, bookingDetails) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.LAWYER_EMAIL || 'nicolas.blanco@abolegal.cl',
      subject: `📋 Informe Pre-Consulta - Sesión ${sessionId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>📋 Informe de Preparación para Videoconsulta</h2>
          <p><strong>Sesión ID:</strong> ${sessionId}</p>
          <p><strong>Cliente:</strong> ${bookingDetails.userEmail || 'No especificado'}</p>
          <p><strong>Cita:</strong> ${bookingDetails.slot?.formatted || 'Fecha no disponible'}</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>🧠 Análisis de la Conversación:</h3>
            <pre style="white-space: pre-wrap; font-family: monospace;">${briefingText}</pre>
          </div>

          <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #ddd;">
            <p><small>Este informe fue generado automáticamente por el sistema de ABOLEGAL basado en la conversación con el asistente virtual "Lex".</small></p>
          </div>
        </body>
        </html>
      `,
      text: `Informe Pre-Consulta - Sesión ${sessionId}\n\nCliente: ${bookingDetails.userEmail}\nCita: ${bookingDetails.slot?.formatted}\n\n${briefingText}`
    };

    // Reutiliza el transporter de tu EmailService existente
    return await EmailService.transporter.sendMail(mailOptions);
  }
}

module.exports = new LawyerBriefingService();
