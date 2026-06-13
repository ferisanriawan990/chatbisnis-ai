/**
 * Simple Rule-Based Sentiment Analysis.
 * In a more advanced setup, this could call an LLM or specific API,
 * but for latency and cost efficiency, we use static keyword matching to detect basic anger/disappointment.
 */

export type SentimentResult = 'positif' | 'netral' | 'negatif' | 'marah';

const NEGATIVE_WORDS = [
  'kecewa', 'buruk', 'jelek', 'lama banget', 'gak jelas', 'tidak jelas', 'gagal', 'rusak', 'rugi'
];

const ANGRY_WORDS = [
  'penipu', 'pembohong', 'bangsat', 'anjing', 'tolol', 'goblok', 'babi', 'brengsek', 'sialan',
  'kembalikan uang', 'refund sekarang', 'lapor polisi', 'viralkan'
];

const POSITIVE_WORDS = [
  'terima kasih', 'makasih', 'bagus', 'mantap', 'keren', 'puas', 'cepat', 'ok', 'oke'
];

export function analyzeSentiment(message: string): SentimentResult {
  const text = message.toLowerCase();

  // Check Angry first (highest priority)
  if (ANGRY_WORDS.some(word => text.includes(word))) {
    return 'marah';
  }

  // Check Negative
  if (NEGATIVE_WORDS.some(word => text.includes(word))) {
    return 'negatif';
  }

  // Check Positive
  if (POSITIVE_WORDS.some(word => text.includes(word))) {
    return 'positif';
  }

  return 'netral';
}
