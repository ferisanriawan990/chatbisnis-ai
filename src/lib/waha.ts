import { decrypt } from './crypto';

import http from 'http';
import https from 'https';

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

  private request(path: string, options: RequestInit = {}): Promise<any> {
    const urlStr = `${this.baseUrl}${path}`;
    
    return new Promise((resolve, reject) => {
      const url = new URL(urlStr);
      const client = url.protocol === 'https:' ? https : http;
      
      const reqOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Api-Key': this.apiKey,
          ...(options.headers as Record<string, string> || {}),
        },
        timeout: 30000,
      };

      const req = client.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            let errorDetail = res.statusMessage || 'Unknown error';
            try {
              const errData = JSON.parse(data);
              errorDetail = errData.message || errData.error || errorDetail;
            } catch {
              // ignore
            }
            return reject(new Error(`WAHA API error ${res.statusCode}: ${errorDetail}`));
          }
          
          try {
            resolve(data ? JSON.parse(data) : { success: true });
          } catch {
            resolve({ success: true });
          }
        });
      });

      req.on('error', (err) => {
        reject(new Error(`Fetch failed: ${err.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('WAHA API timeout after 30 seconds'));
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
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
