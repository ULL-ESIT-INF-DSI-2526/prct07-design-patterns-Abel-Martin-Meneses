import { EmailStatus } from "./EmailStatus.js";

/**
 * Tipo de dato que representa el resultado de enviar un mensaje de correo electrónico, incluyendo un ID único para el mensaje, su estado y los destinatarios a los que se envió.
 */
export type EmailResult = {
  messageId: string;
  status: EmailStatus;
  recipients: string[];
};