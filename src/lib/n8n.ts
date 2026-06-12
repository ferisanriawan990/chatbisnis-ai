import { validatePublicHttpsUrl } from './security';

export class N8NService {
  /**
   * Send a unified payload to a user's custom n8n webhook URL.
   */
  static async sendWebhook(n8nWebhookUrl: string, payload: {
    sessionName: string;
    customerPhone: string;
    customerName: string;
    messageIn: string;
    businessProfileId: string;
  }) {
    try {
      if (!validatePublicHttpsUrl(n8nWebhookUrl)) {
        throw new Error('URL n8n harus berupa URL HTTPS publik.');
      }

      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ChatBisnis-AI-Webhook'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`Failed to trigger n8n webhook: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('N8NService Error:', error);
      throw error;
    }
  }
}
