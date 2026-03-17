import type { ProviderType, ProviderConfig } from './types';

// ----------------------------------------------------------------------

export const PROVIDERS: Record<ProviderType, ProviderConfig> = {
  openai: {
    name: 'OpenAI',
    endpoint: '/api/openai/v1/chat/completions',
    requiresModel: true,
  },
};

export const DEFAULT_PROVIDER: ProviderType = 'openai';
