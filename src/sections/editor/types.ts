import type { IconifyName } from 'src/components/iconify/register-icons';

// ----------------------------------------------------------------------

// Provider configuration
export type ProviderType = 'openai';

export type ProviderConfig = {
  name: string;
  endpoint: string;
  requiresModel: boolean;
};

// Chat types
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type OpenAIChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// Content types
export type ContentType = 'text' | 'multiple-choice';

export type TextContent = {
  id: string;
  type: 'text';
  text: string;
};

export type MultipleChoiceContent = {
  id: string;
  type: 'multiple-choice';
  question: string;
  answers: Array<{ text: string; correct: boolean }>;
};

export type Content = TextContent | MultipleChoiceContent;

export type CommandOption = {
  id: string;
  label: string;
  description: string;
  contentType: ContentType;
  icon: IconifyName;
};

// State types
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

// Worksheet command types
export type WorksheetCommand = {
  action: string;
  text?: string;
  question?: string;
  answers?: Array<{ text: string; correct: boolean }>;
  title?: string;
};
