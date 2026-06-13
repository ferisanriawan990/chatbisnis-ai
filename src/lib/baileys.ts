export type BaileysSessionStatus =
  | 'disconnected'
  | 'starting'
  | 'qr'
  | 'connected'
  | 'failed';

interface GatewayResponse<T> {
  success: boolean;
  requestId?: string;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
}

interface GatewaySessionInfo {
  sessionId: string;
  status: string;
  phoneNumber: string | null;
  lastConnectedAt: string | null;
  lastDisconnectedAt: string | null;
  lastError: string | null;
  qrAvailable: boolean;
}

export class BaileysApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'BaileysApiError';
  }
}

export class BaileysService {
  private constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  static fromEnv() {
    const baseUrl = process.env.BAILEYS_BASE_URL?.trim().replace(/\/$/, '');
    const apiKey = process.env.BAILEYS_API_KEY?.trim();

    if (!baseUrl || !apiKey) {
      throw new Error('BAILEYS_BASE_URL dan BAILEYS_API_KEY belum dikonfigurasi');
    }

    return new BaileysService(baseUrl, apiKey);
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
          ...options.headers,
        },
        cache: 'no-store',
        signal: controller.signal,
      });
      const body = await response.json().catch(() => null) as GatewayResponse<T> | null;

      if (!response.ok || !body?.success) {
        throw new BaileysApiError(
          response.status,
          body?.error?.code || 'GATEWAY_REQUEST_FAILED',
          body?.error?.message || `Baileys Gateway merespons HTTP ${response.status}`,
          body?.requestId,
        );
      }

      return body.data as T;
    } catch (error) {
      if (error instanceof BaileysApiError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Baileys Gateway tidak merespons dalam 15 detik');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async testConnection() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  async startSession(sessionId: string) {
    return this.request<GatewaySessionInfo>(`/sessions/${encodeURIComponent(sessionId)}/start`, {
      method: 'POST',
    });
  }

  async getStatus(sessionId: string): Promise<GatewaySessionInfo & { normalizedStatus: BaileysSessionStatus }> {
    const info = await this.request<GatewaySessionInfo>(`/sessions/${encodeURIComponent(sessionId)}/status`);
    return { ...info, normalizedStatus: this.normalizeStatus(info.status) };
  }

  async getQR(sessionId: string) {
    return this.request<{ qr: string | null; qrDataUrl: string | null; updatedAt: string | null }>(
      `/sessions/${encodeURIComponent(sessionId)}/qr`,
    );
  }

  async logoutSession(sessionId: string) {
    return this.request<{ message: string }>(`/sessions/${encodeURIComponent(sessionId)}/logout`, {
      method: 'POST',
    });
  }

  async sendMessage(sessionId: string, to: string, text: string, idempotencyKey?: string) {
    return this.request<{ messageId?: string; timestamp: number; idempotentReplay: boolean }>(
      '/messages/send-text',
      {
        method: 'POST',
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
        body: JSON.stringify({ sessionId, to, text }),
      },
    );
  }

  async sendImage(
    sessionId: string,
    to: string,
    imageUrl: string,
    caption?: string,
    idempotencyKey?: string,
  ) {
    return this.request<{ messageId?: string; timestamp: number; idempotentReplay: boolean }>(
      '/messages/send-image',
      {
        method: 'POST',
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
        body: JSON.stringify({ sessionId, to, imageUrl, caption }),
      },
    );
  }

  private normalizeStatus(status: string): BaileysSessionStatus {
    if (status === 'connected') return 'connected';
    if (status === 'qr') return 'qr';
    if (status === 'starting' || status === 'reconnecting') return 'starting';
    if (status === 'error') return 'failed';
    return 'disconnected';
  }
}
