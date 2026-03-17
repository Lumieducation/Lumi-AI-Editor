import type { ProviderType, ProviderConfig } from './types';

// ----------------------------------------------------------------------

export const PROVIDERS: Record<ProviderType, ProviderConfig> = {
  openai: {
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    requiresModel: true,
  },
};

export const DEFAULT_PROVIDER: ProviderType = 'openai';
