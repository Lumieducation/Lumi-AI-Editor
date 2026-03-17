import type { Content, TextContent, WorksheetCommand, MultipleChoiceContent } from '../types';

// ----------------------------------------------------------------------

/**
 * Builds a text description of the current worksheet for AI context
 */
export function buildWorksheetContext(title: string, content: Content[]): string {
  const contentDescriptions = content.map((item, index) => {
    switch (item.type) {
      case 'text':
        return `${index + 1}. [Text Block]: "${item.text}"`;
      case 'multiple-choice': {
        const answers = item.answers
          .map((a) => `  - ${a.text}${a.correct ? ' (correct)' : ''}`)
          .join('\n');
        return `${index + 1}. [Multiple Choice Question]: "${item.question}"\n${answers}`;
      }
      default:
        return `${index + 1}. [Unknown content type]`;
    }
  });

  return `Worksheet Title: "${title}"

Current Content:
${contentDescriptions.length > 0 ? contentDescriptions.join('\n\n') : '(No content yet)'}`;
}

/**
 * Executes a worksheet command from the AI (add text, add question, set title)
 */
export function executeWorksheetCommand(
  command: WorksheetCommand,
  callbacks: {
    onAddText: (content: TextContent) => void;
    onAddQuestion: (content: MultipleChoiceContent) => void;
    onSetTitle: (title: string) => void;
    onShowSnackbar: (message: string, severity: 'success' | 'error' | 'info') => void;
  }
): void {
  switch (command.action) {
    case 'add_text':
      if (command.text) {
        const newTextContent: TextContent = {
          id: `content-${Date.now()}`,
          type: 'text',
          text: command.text,
        };
        callbacks.onAddText(newTextContent);
        callbacks.onShowSnackbar('Textblock hinzugefügt', 'success');
      }
      break;
    case 'add_question':
      if (command.question && command.answers) {
        const newQuestionContent: MultipleChoiceContent = {
          id: `content-${Date.now()}`,
          type: 'multiple-choice',
          question: command.question,
          answers: command.answers,
        };
        callbacks.onAddQuestion(newQuestionContent);
        callbacks.onShowSnackbar('Frage hinzugefügt', 'success');
      }
      break;
    case 'set_title':
      if (command.title) {
        callbacks.onSetTitle(command.title);
        callbacks.onShowSnackbar('Titel aktualisiert', 'success');
      }
      break;
    default:
      console.log('Unknown command:', command.action);
  }
}
