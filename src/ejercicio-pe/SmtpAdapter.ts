import { LegacySmtpClient } from "./LegacySmtpLegacy.js";
import { EmailMessage } from "./EmailMessage.js";
import { EmailResult } from "./EmailResult.js";
import { EmailService } from "./EmailService.js";
import { EmailStatus } from "./EmailStatus.js";

/**
 * Clase Adapter que implementa la interfaz EmailService y adapta el LegacySmtpClient para que pueda ser utilizado en el sistema actual.
 */
export class SmtpAdapter implements EmailService {
  private messageCounter: number = 0;
  private messageHistory: EmailResult[] = [];
  constructor(private legacyClient: LegacySmtpClient, private host: string, private port: number,) {
    this.legacyClient.connect(this.host, this.port);
  }

  /**
   * Cierra la conexión con el servidor SMTP.
   */
  public close(): void {
    this.legacyClient.disconnect();
  }

  /**
   * Mapea el código de estado de Legacy a un estado de EmailStatus.
   * @param code - Es el código de Legacy que será procesado
   * @returns devuelve el estado correspondiente del enum EmailStatus
   */
  private mapLegacyCodeToStatus(code: number): EmailStatus {
    switch (code) {
      case 0:
        return EmailStatus.ENVIADO;
      case 1:
        return EmailStatus.ERROR;
      case 2:
        return EmailStatus.PENDIENTE;
      default:
        return EmailStatus.ERROR;
    }
  }

  /**
   * Método que envía un mensaje de correo electrónico utilizando el cliente SMTP legacy. Genera un ID único para cada mensaje y almacena el resultado en un historial.
   * @param message - es el mensaje a enviar
   * @returns devuelve el resultado de enviar el mensaje
   */
  public send(message: EmailMessage): EmailResult {
    const timestamp = Date.now();
    this.messageCounter++;
    const messageId = `MSG-${timestamp}-${this.messageCounter}`;

    const legacyToString = message.to.join(";");
    let status: EmailStatus;

    try {
      const legacyResultCode = this.legacyClient.sendRaw(
        message.from,
        legacyToString,
        message.subject,
        message.body,
        message.isHtml,
      );
      status = this.mapLegacyCodeToStatus(legacyResultCode);
    } catch (error) {
      status = EmailStatus.ERROR;
      console.error(error);
    }

    const result: EmailResult = {
      messageId,
      status,
      recipients: message.to,
    };

    this.messageHistory.push(result);

    return result;
  }

  /**
   * Método que envía múltiples mensajes de correo electrónico utilizando el método send. Devuelve un array con los resultados de cada envío.
   * @param messages - es el array de mensajes a enviar
   * @returns devuelve un array con los resultados de cada envío, incluyendo el ID del mensaje y su estado. Si ocurre un error en el envío de algún mensaje, se captura y se muestra en la consola, pero el proceso continúa para los demás mensajes.
   */
  public sendBulk(messages: EmailMessage[]): EmailResult[] {
    const results: EmailResult[] = [];
    for (const message of messages) {
      try {
        const result = this.send(message);
        results.push(result);
      } catch (error) {
        console.error(`[Adapter] Error en envío masivo:`, error);
        const timestamp = Date.now()
        const result: EmailResult = {messageId: `MSG-${timestamp}-${this.messageCounter}`, status: EmailStatus.ERROR, recipients: []};
        results.push(result);
      }
    }
    return results;
  }

  /**
   * Método que obtiene el estado de un mensaje previamente enviado utilizando su ID. Busca el resultado en el historial de mensajes y devuelve su estado. Si el ID no se encuentra, devuelve un estado de ERROR.
   * @param messageId - es el ID del mensaje cuyo estado se desea obtener
   * @returns devuelve el estado del mensaje correspondiente al ID proporcionado. Si el ID no se encuentra en el historial, devuelve EmailStatus.ERROR y muestra un mensaje en la consola indicando que el mensaje no fue encontrado.
   */
  public getStatus(messageId: string): EmailStatus {
    const result = this.messageHistory.find((result) => result.messageId === messageId)
    if (result) {
      return result.status;
    }
    console.log(`[Adapter] Mensaje con ID ${messageId} no encontrado.`);
    return EmailStatus.ERROR;
  }

  /**
   * Método adicional que permite filtrar el historial de mensajes por su estado. Devuelve un array con los resultados que coinciden con el estado proporcionado.
   * @param status - es el estado por el cual se desea filtrar los mensajes
   * @returns devuelve un array con los resultados que coinciden con el estado proporcionado
   */
  public filter(status: EmailStatus): EmailResult[] {
    return this.messageHistory.filter((result) => result.status === status);
  }
}
