import type { ChatbotSetting } from '@prisma/client';
import { decrypt } from './crypto';
import { prisma } from './prisma';

export const SUPPORTED_AI_MODELS = [
  'gpt-4o-mini',
  'gpt-4o',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
  'claude-3-5-sonnet-20240620',
  'llama-3.1-70b-instruct',
] as const;

export type SupportedAIModel = (typeof SUPPORTED_AI_MODELS)[number];

export interface AICredentialCandidate {
  apiKey: string;
  provider: 'Flaz Cloud';
  model: string;
  source: 'global' | 'environment' | 'custom';
}

type ChatbotAICredentialFields = Pick<ChatbotSetting, 'aiModel'>;

export async function getConfiguredGlobalAIModel(): Promise<string> {
  const credential = await prisma.secretCredential.findUnique({
    where: { key: 'GLOBAL_AI_MODEL' },
  });

  if (!credential?.isActive) return 'gemini-2.5-flash-lite';

  try {
    const model = decrypt(credential.encryptedValue);
    return (SUPPORTED_AI_MODELS as readonly string[]).includes(model) ? model : 'gemini-2.5-flash-lite';
  } catch (error) {
    console.error('Failed to decrypt global AI model:', error);
    return 'gemini-2.5-flash-lite';
  }
}

export async function getAICredentialCandidates(
  chatbotSetting?: ChatbotAICredentialFields | null,
): Promise<AICredentialCandidate[]> {
  const credentials: AICredentialCandidate[] = [];
  const globalCredentials = await prisma.secretCredential.findMany({
    where: { key: { in: ['FLAZ_API_KEY_GLOBAL', 'GLOBAL_AI_MODEL'] } },
  });
  const globalKey = globalCredentials.find((credential) => credential.key === 'FLAZ_API_KEY_GLOBAL');
  const globalModelCredential = globalCredentials.find((credential) => credential.key === 'GLOBAL_AI_MODEL');

  let globalModel = 'gemini-2.5-flash-lite';
  if (globalModelCredential?.isActive) {
    try {
      const configuredModel = decrypt(globalModelCredential.encryptedValue);
      if ((SUPPORTED_AI_MODELS as readonly string[]).includes(configuredModel)) {
        globalModel = configuredModel;
      }
    } catch (error) {
      console.error('Failed to decrypt global AI model:', error);
    }
  }

  if (globalKey?.isActive) {
    try {
      credentials.push({
        apiKey: decrypt(globalKey.encryptedValue),
        provider: 'Flaz Cloud',
        model: globalModel,
        source: 'global',
      });
    } catch (error) {
      console.error('Failed to decrypt global AI credential:', error);
    }
  }

  const environmentApiKey = process.env.AI_API_KEY?.trim();
  if (environmentApiKey && !credentials.some((credential) => credential.apiKey === environmentApiKey)) {
    credentials.push({
      apiKey: environmentApiKey,
      provider: 'Flaz Cloud',
      model: globalModel,
      source: 'environment',
    });
  }



  return credentials;
}
