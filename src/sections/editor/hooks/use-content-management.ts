import * as React from 'react';

import type { Content, ContentType } from '../types';

// ----------------------------------------------------------------------

export function useContentManagement() {
  const [content, setContent] = React.useState<Content[]>([]);

  const handleContentUpdate = (contentId: string, updates: Partial<Content>) => {
    setContent((prev) =>
      prev.map((item) => (item.id === contentId ? ({ ...item, ...updates } as Content) : item))
    );
  };

  const handleDeleteContent = (contentId: string) => {
    setContent((prev) => prev.filter((item) => item.id !== contentId));
  };

  const handleDuplicateContent = (contentId: string) => {
    const item = content.find((c) => c.id === contentId);
    if (item) {
      const currentIndex = content.findIndex((c) => c.id === contentId);
      const duplicatedContent = { ...item, id: `content-${Date.now()}` };
      const newContent = [...content];
      newContent.splice(currentIndex + 1, 0, duplicatedContent);
      setContent(newContent);
    }
  };

  const createContent = (type: ContentType): Content => {
    const id = `content-${Date.now()}`;
    switch (type) {
      case 'text':
        return { id, type: 'text', text: '' };
      case 'multiple-choice':
        return {
          id,
          type: 'multiple-choice',
          question: '',
          answers: [
            { text: '', correct: false },
            { text: '', correct: false },
          ],
        };
      default:
        return { id, type: 'text', text: '' };
    }
  };

  return {
    content,
    setContent,
    handleContentUpdate,
    handleDeleteContent,
    handleDuplicateContent,
    createContent,
  };
}
