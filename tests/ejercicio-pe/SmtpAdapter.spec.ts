import { describe, test, expect, beforeEach, vi } from "vitest";
import { SmtpAdapter } from "../../src/ejercicio-pe/SmtpAdapter";
import { LegacySmtpClient } from "../../src/ejercicio-pe/LegacySmtpLegacy";
import { EmailMessage } from "../../src/ejercicio-pe/EmailMessage";
import { EmailStatus } from "../../src/ejercicio-pe/EmailStatus";

describe("SmtpAdapter", () => {
  let legacyClient: LegacySmtpClient;
  let emailService: SmtpAdapter; 
  let msg1: EmailMessage;
  let msg2: EmailMessage;

  beforeEach(() => {
    legacyClient = new LegacySmtpClient();
    emailService = new SmtpAdapter(legacyClient, "smtp.empresa.com", 587);

    msg1 = {
      from: "admin@empresa.com",
      to: ["cliente1@test.com", "cliente2@test.com"],
      subject: "Actualización de servicio",
      body: "<p>Hola</p>",
      isHtml: true,
    };

    msg2 = {
      from: "admin@empresa.com",
      to: ["cliente3@test.com"],
      subject: "Aviso importante",
      body: "Por favor revise su cuenta.",
      isHtml: false,
    };
  });

  test("Debería enviar un mensaje correctamente", () => {
    vi.spyOn(legacyClient, 'sendRaw').mockReturnValue(0);

    const result = emailService.send(msg1);

    expect(result.messageId).toMatch(/^MSG-\d+-1$/);
    expect(result.recipients).toEqual(["cliente1@test.com", "cliente2@test.com"]);
    expect(result.status).toBe(EmailStatus.ENVIADO);
  });

  test("Debería enviar múltiples mensajes en bloque (sendBulk) manejando diferentes resultados", () => {
    vi.spyOn(legacyClient, 'sendRaw').mockReturnValueOnce(0).mockReturnValueOnce(1);

    const results = emailService.sendBulk([msg1, msg2]);

    expect(results.length).toBe(2);
    
    expect(results[0].messageId).toMatch(/^MSG-\d+-1$/);
    expect(results[0].status).toBe(EmailStatus.ENVIADO);

    expect(results[1].messageId).toMatch(/^MSG-\d+-2$/);
    expect(results[1].status).toBe(EmailStatus.ERROR);
  });

  test("Debería obtener el estado de un mensaje previamente enviado", () => {
    vi.spyOn(legacyClient, 'sendRaw').mockReturnValue(2);

    const result = emailService.send(msg1);
    const id = result.messageId;

    const status = emailService.getStatus(id);
    expect(status).toBe(EmailStatus.PENDIENTE);
  });

  test("Debería devolver estado ERROR si se solicita el estado de un ID inexistente", () => {
    const status = emailService.getStatus("MSG-INVENTADO-999");
    expect(status).toBe(EmailStatus.ERROR);
  });

  test("Debería filtrar el historial de mensajes por su estado", () => {
    vi.spyOn(legacyClient, 'sendRaw').mockReturnValueOnce(0).mockReturnValueOnce(1);

    emailService.send(msg1);
    emailService.send(msg2);

    const enviados = emailService.filter(EmailStatus.ENVIADO);
    const fallidos = emailService.filter(EmailStatus.ERROR);

    expect(enviados.length).toBe(1);
    expect(enviados[0].recipients).toEqual(["cliente1@test.com", "cliente2@test.com"]);

    expect(fallidos.length).toBe(1);
    expect(fallidos[0].recipients).toEqual(["cliente3@test.com"]);
  });

  test("Debería cerrar la conexión con el cliente legacy correctamente", () => {
    const spyDisconnect = vi.spyOn(legacyClient, 'disconnect');
    
    emailService.close();

    expect(spyDisconnect).toHaveBeenCalled();
  });

  test("Debería devolver estado ERROR si se intenta enviar un correo estando desconectado", () => {
    emailService.close();

    const result = emailService.send(msg1);

    expect(result.status).toBe(EmailStatus.ERROR);
    expect(result.recipients).toEqual(msg1.to);
  });

  test("Debería entrar en el caso default del switch y devolver ERROR para un código desconocido", () => {
    vi.spyOn(legacyClient, 'sendRaw').mockReturnValue(99);

    const result = emailService.send(msg1);

    expect(result.status).toBe(EmailStatus.ERROR);
  });
});