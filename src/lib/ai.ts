interface GenerateConfig {
  systemPrompt: string;
  userMessage: string;
  provider: string;
  model: string;
  apiKey: string;
}

interface GenerateResult {
  reply: string;
  tokenUsage: number;
}

export class AIService {
  /**
   * Panggil LLM provider (Flaz Cloud / OpenAI-compatible endpoint)
   */
  static async generateReply(config: GenerateConfig): Promise<GenerateResult> {
    try {
      if (!config.apiKey) {
        throw new Error('API Key tidak ditemukan.');
      }

      // Default to standard OpenAI API format (Flaz Cloud is compatible)
      const url = 'https://api.flaz.cloud/v1/chat/completions'; 

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'claude-haiku-4-5',
          messages: [
            { role: 'system', content: config.systemPrompt },
            { role: 'user', content: config.userMessage },
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
        // Add timeout via AbortController if supported in edge/node, or just rely on platform defaults
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error');
        console.error('AI API Error:', res.status, errorText);
        throw new Error('Gagal menghubungi AI provider.');
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || '';
      const tokenUsage = data.usage?.total_tokens || 0;

      return { reply, tokenUsage };
    } catch (error) {
      console.error('AI Generation Error:', error);
      throw error;
    }
  }

  /**
   * Sanitasi input sederhana sebelum masuk AI prompt
   */
  static sanitizeInput(text: string): string {
    if (!text) return '';
    return text.replace(/<[^>]*>?/gm, '').trim(); // Remove HTML tags
  }
}
