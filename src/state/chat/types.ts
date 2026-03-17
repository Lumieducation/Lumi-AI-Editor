export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
}

export interface PreviewChapter {
  name: string;
  explanation: string;
  questions: string;
}

export interface PreviewDocument {
  title: string;
  chapters: PreviewChapter[];
}
