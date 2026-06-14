interface GenerateConfig {
  systemPrompt: string;
  userMessage: string;
  imageUrl?: string;
  chatHistory?: { role: string; content: string }[];
  provider: string;
  model: string;
  apiKey: string;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' } | { type: 'text' };
  tools?: any[];
}

interface GenerateResult {
  reply: string;
  tokenUsage: number;
  toolCalls?: any[];
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
  static async transcribeAudio(apiKey: string, base64Audio: string, mimeType: string): Promise<string> {
    try {
      if (!apiKey) throw new AIServiceError('API Key tidak ditemukan.');
      const baseUrl = process.env.AI_BASE_URL || 'https://ai.flaz.id/v1';
      const url = `${baseUrl.replace(/\/$/, '')}/audio/transcriptions`;

      let cleanBase64 = base64Audio;
      if (cleanBase64.includes('base64,')) {
        cleanBase64 = cleanBase64.split('base64,')[1];
      }

      const buffer = Buffer.from(cleanBase64, 'base64');
      const cleanMimeType = mimeType.split(';')[0];
      const extension = cleanMimeType.includes('ogg') ? 'ogg' : 'mp3';
      
      let fileToAppend;
      if (typeof File !== 'undefined') {
        fileToAppend = new File([buffer], `audio.${extension}`, { type: cleanMimeType });
      } else {
        fileToAppend = new Blob([buffer], { type: cleanMimeType });
      }

      const formData = new FormData();
      formData.append('file', fileToAppend as any, `audio.${extension}`);
      formData.append('model', 'whisper-1');

      const signal = AbortSignal.timeout(30000);
      const res = await fetch(url, {
        method: 'POST',
        signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!res.ok) throw new AIServiceError(`Gagal mentranskripsi suara (HTTP ${res.status})`, res.status);

      const data = await res.json();
      return data.text || '';
    } catch (error: any) {
      console.error('Transcription Error:', error);
      throw new AIServiceError('Gagal memproses pesan suara.');
    }
  }

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
      console.log('Using Model:', config.model || 'gemini-2.5-flash-lite');
      console.log('Using Provider:', config.provider);

      const res = await fetch(url, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gemini-2.5-flash-lite',
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
          temperature: 0.2, // Lowered from 0.7 to 0.2 to prevent hallucinations and make the AI strictly follow the rules
          response_format: config.responseFormat,
          ...(config.tools && config.tools.length > 0 ? { tools: config.tools } : {})
        }),
        // Add timeout via AbortController if supported in edge/node, or just rely on platform defaults
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('AI Error Response:', errText);
        let errorReason = res.statusText;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error && parsed.error.message) errorReason = parsed.error.message;
        } catch { /* ignore */ }
        throw new AIServiceError(`HTTP ${res.status}: ${errorReason}`, res.status);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || '';
      const toolCalls = data.choices?.[0]?.message?.tool_calls;
      const tokenUsage = data.usage?.total_tokens || 0;

      if ((typeof reply !== 'string' || reply.trim() === '') && (!toolCalls || toolCalls.length === 0)) {
        throw new AIServiceError('AI provider mengembalikan respons kosong.', 502);
      }

      return { reply, tokenUsage, toolCalls };
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
        maxTokens: 50,
      });
      return { ok: true };
    } catch (error) {
      if (error instanceof AIServiceError) {
        return {
          ok: false,
          status: error.status,
          error: error.message,
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
