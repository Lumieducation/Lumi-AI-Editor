import { CONFIG } from 'src/config-global';

import type { CommandOption } from './types';

// Re-export provider config from the state layer
export { PROVIDERS, DEFAULT_PROVIDER } from 'src/state/lumi-editor/providers';

// ----------------------------------------------------------------------

export const metadata = { title: `Arbeitsblatt-Editor - ${CONFIG.appName}` };

export const drawerWidth = 450;

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
