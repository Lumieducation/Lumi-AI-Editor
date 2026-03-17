import { CONFIG } from 'src/config-global';

import type { ProviderType, CommandOption, ProviderConfig } from './types';

// ----------------------------------------------------------------------

export const metadata = { title: `Arbeitsblatt-Editor - ${CONFIG.appName}` };

export const drawerWidth = 450;

export const PROVIDERS: Record<ProviderType, ProviderConfig> = {
    openai: {
      name: 'OpenAI',
      endpoint: '/api/openai/v1/chat/completions',
      requiresModel: true,
    }
};

export const DEFAULT_PROVIDER: ProviderType = 'openai';

export const commandOptions: CommandOption[] = [
  {
    id: 'text',
    label: 'Text',
    description: 'Textblock hinzufügen',
    contentType: 'text',
    icon: 'solar:file-text-bold',
  },
  {
    id: 'multiple-choice',
    label: 'Frage',
    description: 'Frage erstellen',
    contentType: 'multiple-choice',
    icon: 'solar:check-circle-bold',
  },
];
