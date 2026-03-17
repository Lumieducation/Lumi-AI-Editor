import type { Content } from '../types';

// ----------------------------------------------------------------------

/**
 * Converts a multiple-choice question to text format
 * Format: first line is question, subsequent lines are answers (correct answers prefixed with *)
 */
export function mcqToText(item: Content): string {
  if (item.type !== 'multiple-choice') return '';
  const lines = [item.question || ''];
  (item.answers || []).forEach((answer) => {
    const prefix = answer.correct ? '*' : '';
    lines.push(`${prefix}${answer.text}`);
  });
  return lines.join('\n');
}

/**
 * Parses text format into multiple-choice question structure
 * Format: first line is question, subsequent lines are answers (correct answers prefixed with *)
 */
export function textToMcq(
  textValue: string
): { question: string; answers: Array<{ text: string; correct: boolean }> } {
  const lines = textValue.split('\n').filter((line) => line.trim());
  const question = lines[0] || '';
  const answers = lines.slice(1).map((line) => {
    const correct = line.startsWith('*');
    const text = correct ? line.slice(1) : line;
    return { text, correct };
  });
  while (answers.length < 2) {
    answers.push({ text: '', correct: false });
  }
  return { question, answers };
}
