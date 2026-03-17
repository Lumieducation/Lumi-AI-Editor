export interface ChatMessage {
  id: string;
  body: string;
  senderId: string;
  contentType: string;
  createdAt: number;
  attachments: unknown[];
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
