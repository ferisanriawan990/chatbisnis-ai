import { decrypt } from './crypto';

export interface WAHAConfig {
  baseUrl: string;
  apiKey: string;
}

export type WAHASessionStatus = 'disconnected' | 'starting' | 'qr' | 'connected' | 'failed';

export class WAHAService {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: WAHAConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private async request(path: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey,
        ...options.headers,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      throw new Error(`WAHA API error ${res.status}: ${text}`);
    }

    return res.json();
  }

  async startSession(sessionName: string) {
    return this.request('/api/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ name: sessionName }),
    });
  }

  async stopSession(sessionName: string) {
    return this.request('/api/sessions/stop', {
      method: 'POST',
      body: JSON.stringify({ name: sessionName }),
    });
  }

  async getStatus(sessionName: string): Promise<WAHASessionStatus> {
    try {
      const data = await this.request(`/api/sessions/${sessionName}`);
      const status = data?.status?.toLowerCase() || 'disconnected';

      if (status === 'working' || status === 'connected' || status === 'authenticated') return 'connected';
      if (status === 'scan_qr' || status === 'scan_qr_code' || status === 'qr') return 'qr';
      if (status === 'starting') return 'starting';
      if (status === 'failed' || status === 'error') return 'failed';
      return 'disconnected';
    } catch {
      return 'disconnected';
    }
  }

  async getQR(sessionName: string): Promise<string | null> {
    try {
      const data = await this.request(`/api/${sessionName}/auth/qr`);
      return data?.value || data?.qr || null;
    } catch {
      return null;
    }
  }

  async sendMessage(sessionName: string, phone: string, text: string) {
    return this.request(`/api/sendText`, {
      method: 'POST',
      body: JSON.stringify({
        session: sessionName,
        chatId: phone.includes('@') ? phone : `${phone}@c.us`,
        text,
      }),
    });
  }

  /**
   * Create a WAHAService instance from encrypted credentials stored in DB.
   */
  static fromEncrypted(baseUrl: string, encryptedApiKey: string): WAHAService {
    return new WAHAService({
      baseUrl,
      apiKey: decrypt(encryptedApiKey),
    });
  }
}
