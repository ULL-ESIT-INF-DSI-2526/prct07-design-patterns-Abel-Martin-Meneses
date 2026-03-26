import { EmailMessage } from "./EmailMessage.js";
import { EmailResult } from "./EmailResult.js";
import { EmailStatus } from "./EmailStatus.js";

/**
 * Interfaz que define los métodos para enviar mensajes de correo electrónico, enviar mensajes en bloque y obtener el estado de un mensaje previamente enviado. Esta interfaz es implementada por la clase SmtpAdapter para adaptar el LegacySmtpClient al sistema actual.
 */
export interface EmailService {
  send(message: EmailMessage): EmailResult
  sendBulk(messages: EmailMessage[]): EmailResult[]
  getStatus(messageId: string): EmailStatus
}