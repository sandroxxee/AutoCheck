import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

export class ApiBrasilMcpService {
  private static instance: ApiBrasilMcpService;
  private client: Client | null = null;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): ApiBrasilMcpService {
    if (!ApiBrasilMcpService.instance) {
      ApiBrasilMcpService.instance = new ApiBrasilMcpService();
    }
    return ApiBrasilMcpService.instance;
  }

  public async getClient(): Promise<Client> {
    if (this.client && this.isConnected) {
      return this.client;
    }

    const bearerToken = process.env.APIBRASIL_BEARER_TOKEN || process.env.APIBRASIL_TOKEN || '';
    const deviceToken = process.env.APIBRASIL_DEVICE_TOKEN || '';

    this.client = new Client(
      {
        name: 'autocheck-brasil-mcp-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    const transport = new SSEClientTransport(
      new URL('https://mcp.apibrasil.cloud/mcp'),
      {
        requestInit: {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'X-Device-Token': deviceToken,
          },
        },
      } as any
    );

    await this.client.connect(transport);
    this.isConnected = true;
    return this.client;
  }

  public async listAvailableTools(): Promise<any> {
    try {
      const client = await this.getClient();
      const tools = await client.listTools();
      return tools;
    } catch (err: any) {
      console.error('[MCP APIBrasil] Erro ao listar ferramentas:', err.message);
      throw err;
    }
  }

  public async callTool(name: string, args: Record<string, any>): Promise<any> {
    try {
      const client = await this.getClient();
      const result = await client.callTool({
        name,
        arguments: args,
      });
      return result;
    } catch (err: any) {
      console.error(`[MCP APIBrasil] Erro ao chamar ferramenta ${name}:`, err.message);
      throw err;
    }
  }
}
