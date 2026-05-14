const nodemailer = require('nodemailer');

/**
 * Sanitización básica de HTML
 */
function escapeHtml(str = '') {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.EMAIL_PORT) || 465,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      connectionTimeout: 60000, // ⏱️ CRÍTICO: restaurado
      logger: true,
    });

    console.log('📧 EmailService configurado');
  }

  /**
   * Verifica conexión SMTP
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ [EMAIL] Conexión SMTP verificada');
      return true;
    } catch (error) {
      console.error('❌ [EMAIL] Error verificación SMTP:', error.message);
      return false;
    }
  }

  /**
   * Envía correos de confirmación
   * Retorna estado detallado para el organizador
   */
  async sendBookingConfirmation(booking = {}) {
    console.log('🔍 [EMAIL-DIAG] Llamado con:', {
      userEmail: booking.userEmail,
      lawyerEmail: booking.lawyerEmail,
      hasLawyerBriefing: !!booking.lawyerBriefing,
    });

    const results = {
      client: false,
      lawyer: false,
      errors: [],
    };

    const {
      userEmail,
      lawyerEmail,
      slot = {},
      meetLink = '',
      eventId = '',
      lawyerBriefing = {},
    } = booking;

    const fromAddress =
      process.env.EMAIL_FROM || process.env.EMAIL_USER;

    const formattedDate = slot.start_iso
      ? new Date(slot.start_iso).toLocaleDateString('es-CL', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Fecha no disponible';

    const formattedTime = slot.start_iso
      ? new Date(slot.start_iso).toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Hora no disponible';

    /**
     * =========================
     * EMAIL CLIENTE (HTML)
     * =========================
     */
    if (userEmail) {
      const clientHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: Arial, sans-serif; background:#f5f5f5; padding:20px; }
.container { max-width:600px; margin:auto; background:#fff; padding:24px; border-radius:8px; }
h1 { color:#1a365d; }
.button { background:#2d74da; color:white; padding:12px 24px; text-decoration:none; border-radius:5px; display:inline-block; }
.footer { margin-top:24px; font-size:12px; color:#666; }
</style>
</head>
<body>
<div class="container">
  <h1>Entrevista Abolegal</h1>
  <p>Tu entrevista legal ha sido confirmada.</p>

  <p><strong>📅 Fecha:</strong> ${escapeHtml(formattedDate)}</p>
  <p><strong>⏰ Hora:</strong> ${escapeHtml(formattedTime)}</p>

  <p>
    <a class="button" href="${escapeHtml(meetLink)}">Acceder a la videollamada</a>
  </p>

  <p>ID de reserva: ${escapeHtml(eventId || 'N/A')}</p>

  <div class="footer">
    ABOLEGAL · Estudio Jurídico
  </div>
</div>
</body>
</html>
      `;

      try {
        await this.transporter.sendMail({
          from: fromAddress,
          to: userEmail,
          subject: 'Entrevista Abolegal', // 🎯 EXACTO
          html: clientHtml,
        });
        results.client = true;
        console.log('📧 [EMAIL] Cliente notificado');
      } catch (err) {
        console.error('❌ [EMAIL] Error cliente:', err.message);
        results.errors.push({ target: 'client', error: err.message });
      }
    }

    /**
     * =========================
     * EMAIL ABOGADO (TEXTO)
     * =========================
     */
    if (lawyerEmail) {
      const {
        summary = 'Sin resumen.',
        keyPoints = [],
        clientContext = 'No especificado.',
        preparationTips = [],
      } = lawyerBriefing;

      const lawyerText = `
ENTREVISTA ABOLEGAL AGENDADA

Fecha: ${formattedDate}
Hora: ${formattedTime}
Meet: ${meetLink}

RESUMEN:
${summary}

PUNTOS CLAVE:
${keyPoints.length ? keyPoints.map(p => `- ${p}`).join('\n') : 'N/A'}

CONTEXTO EMOCIONAL:
${clientContext}

RECOMENDACIONES:
${preparationTips.length ? preparationTips.map(p => `- ${p}`).join('\n') : 'N/A'}
      `.trim();

  /**
   * Envía correos desde el formulario de contacto general
   */
  async sendGeneralContact({ name, email, message }) {
    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const toAddress = 'contacto@abolegal.cl'; // Correo donde el estudio recibe consultas

    const mailOptions = {
      from: fromAddress,
      to: toAddress,
      replyTo: email, // Permite responder directamente al cliente
      subject: `Nueva consulta web: ${name}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${message}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #1a365d;">Nueva consulta desde el sitio web</h2>
          <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
          <p><strong>Correo:</strong> ${escapeHtml(email)}</p>
          <hr style="border: 0; border-top: 1px solid #eee;">
          <p><strong>Mensaje:</strong></p>
          <p style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 5px;">${escapeHtml(message)}</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('📧 [EMAIL] Mensaje de contacto enviado al estudio');
      return true;
    } catch (error) {
      console.error('❌ [EMAIL] Error en sendGeneralContact:', error.message);
      throw error;
    }
  }
      
      
      try {
        await this.transporter.sendMail({
          from: fromAddress,
          to: lawyerEmail,
          subject: 'Entrevista Abolegal', // 🎯 EXACTO
          text: lawyerText,
        });
        results.lawyer = true;
        console.log('📧 [EMAIL] Abogado notificado');
      } catch (err) {
        console.error('❌ [EMAIL] Error abogado:', err.message);
        results.errors.push({ target: 'lawyer', error: err.message });
      }
    }

    return results;
  }
}

module.exports = new EmailService();
