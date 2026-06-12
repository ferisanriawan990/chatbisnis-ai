/* eslint-disable @typescript-eslint/no-explicit-any */
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
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => { chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)); });
        res.on('end', () => {
          const dataBuffer = Buffer.concat(chunks);
          const dataStr = dataBuffer.toString('utf8');

          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            let errorDetail = res.statusMessage || 'Unknown error';
            try {
              const errData = JSON.parse(dataStr);
              errorDetail = errData.message || errData.error || errorDetail;
            } catch {
              // ignore
            }
            return reject(new Error(`WAHA API error ${res.statusCode}: ${errorDetail}`));
          }
          
          try {
            const contentType = res.headers['content-type']?.toLowerCase();
            if (
              contentType && 
              (contentType.startsWith('image/') || 
               contentType.startsWith('audio/') || 
               contentType.startsWith('video/') || 
               contentType === 'application/pdf')
            ) {
              return resolve({ mimetype: contentType, data: dataBuffer.toString('base64') });
            }
            resolve(dataStr ? JSON.parse(dataStr) : { success: true });
          } catch {
            reject(new Error('Invalid JSON response'));
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

  private getEffectiveSession(name: string) {
    return (process.env.WAHA_CORE_MODE === 'false') ? name : 'default';
  }

  async testConnection() {
    try {
      await this.request('/api/sessions?all=true');
      return true;
    } catch {
      return false;
    }
  }

  async startSession(sessionName: string, wahaServerId?: string, webhookUrl?: string, webhookSecret?: string) {
    const payload: any = { name: this.getEffectiveSession(sessionName) };

    if (wahaServerId && webhookUrl && webhookSecret) {
      payload.config = {
        webhooks: [
          {
            url: webhookUrl,
            events: ["message"],
            hmac: null,
            retries: null,
            customHeaders: [
              { name: "x-webhook-secret", value: webhookSecret },
              { name: "x-waha-server-id", value: wahaServerId }
            ]
          }
        ]
      };
    }

    return this.request('/api/sessions/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async stopSession(sessionName: string) {
    return this.request('/api/sessions/stop', {
      method: 'POST',
      body: JSON.stringify({ name: this.getEffectiveSession(sessionName) }),
    });
  }

  async logoutSession(sessionName: string) {
    return this.request('/api/sessions/logout', {
      method: 'POST',
      body: JSON.stringify({ name: this.getEffectiveSession(sessionName) }),
    });
  }

  async getStatus(sessionName: string): Promise<WAHASessionStatus> {
    try {
      const data = await this.request(`/api/sessions/${this.getEffectiveSession(sessionName)}`);
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
      const data = await this.request(`/api/${this.getEffectiveSession(sessionName)}/auth/qr`);
      if (data?.mimetype && data?.data) {
        return `data:${data.mimetype};base64,${data.data}`;
      }
      return data?.value || data?.qr || null;
    } catch {
      return null;
    }
  }

  async downloadMediaBase64(sessionName: string, messageId: string): Promise<string | null> {
    try {
      const data = await this.request(`/api/${this.getEffectiveSession(sessionName)}/messages/${messageId}/download`);
      if (data?.mimetype && data?.data) {
        return `data:${data.mimetype};base64,${data.data}`;
      }
      return null;
    } catch (e) {
      console.error('Failed to download media from WAHA:', e);
      return null;
    }
  }

  async downloadMediaByUrl(urlStr: string): Promise<string | null> {
    try {
      const urlObj = new URL(urlStr);
      const pathname = urlObj.pathname + urlObj.search;
      const data = await this.request(pathname);
      if (data?.mimetype && data?.data) {
        return `data:${data.mimetype};base64,${data.data}`;
      }
      return null;
    } catch (e) {
      console.error('Failed to download media by URL:', e);
      return null;
    }
  }

  async sendMessage(sessionName: string, phone: string, text: string) {
    return this.request(`/api/sendText`, {
      method: 'POST',
      body: JSON.stringify({
        session: this.getEffectiveSession(sessionName),
        chatId: phone.includes('@') ? phone : `${phone}@c.us`,
        text,
      }),
    });
  }

  async sendImage(sessionName: string, phone: string, imageUrl: string, caption?: string) {
    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpeg';
    let mimetype = 'image/jpeg';
    if (ext === 'png') mimetype = 'image/png';
    else if (ext === 'webp') mimetype = 'image/webp';
    else if (ext === 'gif') mimetype = 'image/gif';

    return this.request(`/api/sendImage`, {
      method: 'POST',
      body: JSON.stringify({
        session: this.getEffectiveSession(sessionName),
        chatId: phone.includes('@') ? phone : `${phone}@c.us`,
        file: { 
          mimetype,
          filename: `image.${ext}`,
          url: imageUrl 
        },
        caption: caption || '',
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
