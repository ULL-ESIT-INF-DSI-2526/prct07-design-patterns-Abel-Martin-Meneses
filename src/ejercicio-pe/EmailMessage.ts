/**
 * Tipo de dato que representa un mensaje de correo electrónico, con campos para el remitente, asunto, cuerpo, destinatarios y un indicador de si el contenido es HTML o no.
 */
export type EmailMessage = {
  from: string;
  subject: string;
  body: string;
  to: string[];
  isHtml: boolean;
};