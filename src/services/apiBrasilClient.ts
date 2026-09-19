/**
 * Cliente HTTP puro para as APIs da APIBrasil
 * 
 * ATENÇÃO: Como o construtor exato, métodos e tipagens do SDK npm 'apigratis-sdk-nodejs'
 * não estão totalmente detalhados no README acessível, optamos por implementar um cliente
 * robusto em HTTP puro (utilizando fetch nativo com AbortController) conforme exigido na especificação
 * de segurança e resiliência.
 */

export interface ApiBrasilOptions {
  cpf: string;
  homolog?: boolean;
}

export interface ApiBrasilErrorResponse {
  error: boolean;
  status: number;
  message: string;
}

export class ApiBrasilClient {
  private static readonly BASE_URL = process.env.APIBRASIL_BASE_URL || 'https://gateway.apibrasil.io/api/v2';
  private static readonly TIMEOUT_MS = 10000; // 10 segundos de timeout para evitar travamento de processo

  private static getHeaders(includeDeviceToken = false): Record<string, string> {
    const token = process.env.APIBRASIL_TOKEN;
    if (!token) {
      throw new Error('Erro de Configuração: Variável de ambiente APIBRASIL_TOKEN não definida.');
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (includeDeviceToken) {
      const deviceToken = process.env.APIBRASIL_DEVICE_TOKEN;
      if (deviceToken) {
        headers['DeviceToken'] = deviceToken;
      }
    }

    return headers;
  }

  /**
   * Consulta de CPF na APIBrasil com tratamento estrito de erros HTTP (401, 402, 422)
   * e controle de timeout por AbortController.
   */
  public static async consultarCpf(options: ApiBrasilOptions): Promise<any> {
    const url = `${this.BASE_URL}/dados/cpf`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(false), // O endpoint de dados por CPF consome crédito (não exige DeviceToken)
        body: JSON.stringify({
          cpf: options.cpf,
          homolog: options.homolog ?? true
        }),
        signal: controller.signal
      });

      // Tratamento estrito de erros HTTP solicitados na especificação
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Erro desconhecido na resposta' }));
        
        switch (response.status) {
          case 401:
            throw new Error('Erro 401: Token de autenticação da APIBrasil inválido, expirado ou ausente.');
          case 402:
            throw new Error('Erro 402: Créditos insuficientes na conta APIBrasil para realizar esta consulta.');
          case 422:
            throw new Error(`Erro 422: Corpo da requisição inválido ou parâmetros incorretos. Detalhes: ${JSON.stringify(errorBody)}`);
          default:
            throw new Error(`Erro HTTP ${response.status}: ${errorBody.message || response.statusText}`);
        }
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Timeout: A requisição para a APIBrasil excedeu o limite de ${this.TIMEOUT_MS / 1000}s.`);
      }
      // Garante estritamente que tokens nunca vazem em logs ou mensagens de erro
      const sanitizedMessage = error.message ? error.message.replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, 'Bearer [REDACTED]') : 'Erro desconhecido';
      throw new Error(sanitizedMessage);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * EXEMPLO DE USO COM A CHAMADA DE HOMOLOGAÇÃO
 * 
 * Para executar este exemplo, defina as variáveis de ambiente:
 * export APIBRASIL_TOKEN="seu_token_aqui"
 * 
 * Uso:
 * async function runTest() {
 *   try {
 *     const resultado = await ApiBrasilClient.consultarCpf({
 *       cpf: '00000000000',
 *       homolog: true
 *     });
 *     console.log('Sucesso na consulta de homologação:', resultado);
 *   } catch (err: any) {
 *     console.error('Falha na consulta:', err.message);
 *   }
 * }
 */
