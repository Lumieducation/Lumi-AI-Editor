import type { TextContent, MultipleChoiceContent, FillInTheBlanks } from './types';

type Content = TextContent | MultipleChoiceContent | FillInTheBlanks;

export interface ValidationResult {
  ok: boolean;
  messages: string[];
}

export function validateContent(content: Content): ValidationResult {
  switch (content.type) {
    case 'text':
      return validateText(content);
    case 'multiple-choice':
      return validateMultipleChoice(content);
    case 'fill-in-the-blanks':
      return validateFillInTheBlanks(content);
    default:
      return { ok: false, messages: ['Unknown content type'] };
  }
}

function validateText(content: TextContent): ValidationResult {
  const messages: string[] = [];
  if (!content.text || content.text.trim().length === 0) {
    messages.push('Text must contain non-empty content');
  }
  return { ok: messages.length === 0, messages };
}

function validateMultipleChoice(content: MultipleChoiceContent): ValidationResult {
  const messages: string[] = [];
  if (!content.question || content.question.trim().length === 0) {
    messages.push('Question must contain non-empty content');
  }
  if (!content.answers || content.answers.length < 2) {
    messages.push('Multiple choice must have at least 2 answers');
  }
  if (!content.answers?.some((a) => a.correct)) {
    messages.push('Multiple choice must have at least one correct answer');
  }
  content.answers?.forEach((answer, index) => {
    if (!answer.text || answer.text.trim().length === 0) {
      messages.push(`Answer ${index + 1} must have non-empty text`);
    }
  });
  return { ok: messages.length === 0, messages };
}

function validateFillInTheBlanks(content: FillInTheBlanks): ValidationResult {
  const messages: string[] = [];
  if (!content.text || content.text.trim().length === 0) {
    messages.push('Fill in the blanks must contain non-empty content');
  }
  if (!content.text?.includes('*')) {
    messages.push('Fill in the blanks must contain at least one blank marked with *');
  }
  return { ok: messages.length === 0, messages };
}
