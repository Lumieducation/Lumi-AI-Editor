import type { ContentType } from 'src/state/lumi-editor';
import type { IconifyName } from 'src/components/iconify/register-icons';

// Re-export shared types from the state layer so editor components can import from one place
export type { ChatMessage } from 'src/state/chat/types';

export type {
  ID,
  Content,
  Freetext,
  ContentType,
  TextContent,
  ProviderType,
  ProviderConfig,
  LumiEditorState,
  FillInTheBlanks,
  MultipleChoiceContent,
} from 'src/state/lumi-editor';

// ----------------------------------------------------------------------
// Editor-only types (UI state that does not belong in Redux)

export type OpenAIChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type CommandOption = {
  id: string;
  label: string;
  description: string;
  contentType: ContentType;
  icon: IconifyName;
};

export type CreationState = {
  step: 'idle' | 'asking_topic' | 'asking_audience' | 'generating' | 'done';
  topic: string;
  audience: string;
};

export type AiDialogState = {
  open: boolean;
  context: string;
  loading: boolean;
  targetContentId: string | null;
  mode: 'create' | 'addBelow' | 'transform';
};

export type CommandMenuState = {
  anchor: HTMLElement | null;
  contentId: string | null;
  mode: 'transform' | 'addBelow';
};

export type ContentMenuState = {
  anchor: HTMLElement | null;
  contentId: string | null;
};

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
};

export type DropPosition = 'before' | 'after';

export type WorksheetCommand = {
  action: string;
  text?: string;
  question?: string;
  answers?: Array<{ text: string; correct: boolean }>;
  title?: string;
};
