/**
 * PixService: Gerador de payload oficial do Banco Central do Brasil (BR Code / EMV QRCPS-MPM)
 * Compatível com todos os bancos (Nubank, Itaú, Santander, Bradesco, Inter, Mercado Pago, etc.)
 */
export class PixService {
  private static crc16(payload: string): string {
    let crc = 0xffff;
    const polynomial = 0x1021;

    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let bit = 0; bit < 8; bit++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ polynomial) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }

    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  private static formatField(id: string, value: string): string {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  }

  /**
   * Gera a linha oficial do Pix "Copia e Cola" (BR Code)
   */
  public static generatePixCopyPaste(params: {
    pixKey: string;
    beneficiaryName: string;
    beneficiaryCity: string;
    amount: number;
    transactionId?: string;
    description?: string;
  }): {
    copyPaste: string;
    qrCodeUrl: string;
    txId: string;
    amount: number;
  } {
    const {
      pixKey,
      beneficiaryName = 'AUTOCHECK BRASIL',
      beneficiaryCity = 'SAO PAULO',
      amount,
      transactionId = 'AC' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      description = 'Consulta Veicular'
    } = params;

    // Normalização de caracteres para padrão EMV
    const cleanKey = pixKey.trim();
    const cleanName = beneficiaryName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 25).toUpperCase();
    const cleanCity = beneficiaryCity.normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 15).toUpperCase();
    const formattedAmount = amount.toFixed(2);
    const cleanTxId = transactionId.replace(/[^A-Za-z0-9]/g, '').substring(0, 25) || 'AUTOCHECK';

    // GUI Banco Central: br.gov.bcb.pix
    const gui = this.formatField('00', 'br.gov.bcb.pix');
    const keyField = this.formatField('01', cleanKey);
    const descField = description ? this.formatField('02', description.substring(0, 20)) : '';
    const merchantAccount = this.formatField('26', `${gui}${keyField}${descField}`);

    let payload =
      this.formatField('00', '01') + // Payload Format Indicator
      merchantAccount +
      this.formatField('52', '0000') + // Merchant Category Code
      this.formatField('53', '986') + // Transaction Currency (986 = BRL)
      this.formatField('54', formattedAmount) + // Transaction Amount
      this.formatField('58', 'BR') + // Country Code
      this.formatField('59', cleanName) + // Merchant Name
      this.formatField('60', cleanCity) + // Merchant City
      this.formatField('62', this.formatField('05', cleanTxId)); // Additional Data Field (TxID)

    // Adiciona o ID 63 com tamanho 04 antes de calcular o CRC16
    const payloadForCrc = payload + '6304';
    const crc = this.crc16(payloadForCrc);
    const finalCopyPaste = payloadForCrc + crc;

    // QR Code visual gerado via CDN de alta velocidade
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(finalCopyPaste)}&margin=10`;

    return {
      copyPaste: finalCopyPaste,
      qrCodeUrl,
      txId: cleanTxId,
      amount
    };
  }
}
