interface GenerateConfig {
  systemPrompt: string;
  userMessage: string;
  imageUrl?: string;
  chatHistory?: { role: string; content: string }[];
  provider: string;
  model: string;
  apiKey: string;
  maxTokens?: number;
}

interface GenerateResult {
  reply: string;
  tokenUsage: number;
}

export class AIServiceError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export interface AICredentialValidationResult {
  ok: boolean;
  status?: number;
  error?: string;
}

export class AIService {
  /**
   * Panggil LLM provider (Flaz Cloud / OpenAI-compatible endpoint)
   */
  static async generateReply(config: GenerateConfig): Promise<GenerateResult> {
    try {
      if (!config.apiKey) {
        throw new AIServiceError('API Key tidak ditemukan.');
      }

      const baseUrl = process.env.AI_BASE_URL || 'https://ai.flaz.id/v1';
      const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

      const signal = AbortSignal.timeout(30000); // 30s timeout

      console.log('--- AI_SERVICE_CALL ---');
      console.log('Using Model:', config.model || 'gpt-4o-mini');
      console.log('Using Provider:', config.provider);

      const res = await fetch(url, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: config.systemPrompt },
            ...(config.chatHistory || []),
            { 
              role: 'user', 
              content: config.imageUrl 
                ? [
                    { type: 'text', text: config.userMessage || 'Tolong jelaskan gambar ini berdasarkan konteks bisnis kita.' },
                    { type: 'image_url', image_url: { url: config.imageUrl } }
                  ]
                : config.userMessage 
            },
          ],
          max_tokens: config.maxTokens || 1500,
          temperature: 0.7,
        }),
        // Add timeout via AbortController if supported in edge/node, or just rely on platform defaults
      });

      if (!res.ok) {
        console.error('AI API Error Status:', res.status);
        throw new AIServiceError(`AI provider mengembalikan status ${res.status}.`, res.status);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || '';
      const tokenUsage = data.usage?.total_tokens || 0;

      if (typeof reply !== 'string' || reply.trim() === '') {
        throw new AIServiceError('AI provider mengembalikan respons kosong.', 502);
      }

      return { reply, tokenUsage };
    } catch (error: unknown) {
      if (error instanceof AIServiceError) throw error;

      if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
        console.error('AI Generation Timeout (30s limit)');
        throw new AIServiceError('Waktu respon AI habis (timeout).');
      }
      const message = error instanceof Error ? error.message : 'Kesalahan internal sistem AI.';
      console.error('AI Generation Error:', message);
      throw new AIServiceError(message);
    }
  }

  static isRetryableError(error: unknown): boolean {
    if (!(error instanceof AIServiceError)) return false;
    if (!error.status) return true;
    return error.status === 401
      || error.status === 403
      || error.status === 408
      || error.status === 429
      || error.status >= 500;
  }

  static async validateCredential(apiKey: string, model: string): Promise<AICredentialValidationResult> {
    try {
      await this.generateReply({
        systemPrompt: 'Balas singkat sesuai instruksi.',
        userMessage: 'Balas hanya dengan kata OK.',
        provider: 'Flaz Cloud',
        model,
        apiKey,
        maxTokens: 8,
      });
      return { ok: true };
    } catch (error) {
      if (error instanceof AIServiceError) {
        return {
          ok: false,
          status: error.status,
          error: error.status
            ? `Credential atau model ditolak AI provider (HTTP ${error.status}).`
            : error.message,
        };
      }
      return { ok: false, error: 'Gagal memvalidasi credential AI.' };
    }
  }

  static sanitizeInput(text: string): string {
    if (!text) return '';
    let cleaned = text.slice(0, 2000); // Batas aman pesan masuk
    cleaned = cleaned.replace(/<[^>]*>?/gm, ''); // Hapus HTML
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Hapus control chars
    cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n'); // Normalize whitespace
    cleaned = cleaned.replace(/ {4,}/g, '   ');
    cleaned = cleaned.replace(/(.)\1{20,}/g, '$1$1$1$1$1'); // Block spam text
    return cleaned.trim();
  }
}
