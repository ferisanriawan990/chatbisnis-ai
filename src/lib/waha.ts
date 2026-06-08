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
    
    // 30 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Api-Key': this.apiKey,
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        // Safe error message to avoid leaking secrets from API response
        let errorDetail = 'Unknown error';
        try {
          const errData = await res.json();
          errorDetail = errData.message || errData.error || res.statusText;
        } catch {
          errorDetail = res.statusText;
        }
        throw new Error(`WAHA API error ${res.status}: ${errorDetail}`);
      }

      return res.json();
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if ((error as { name?: string }).name === 'AbortError') {
        throw new Error('WAHA API timeout after 30 seconds');
      }
      throw error;
    }
  }

  async testConnection() {
    try {
      await this.request('/api/sessions?all=true');
      return true;
    } catch {
      return false;
    }
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
      if (data?.mimetype && data?.data) {
        return `data:${data.mimetype};base64,${data.data}`;
      }
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
