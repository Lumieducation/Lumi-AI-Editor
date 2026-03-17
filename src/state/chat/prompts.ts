import type { Content } from 'src/state/lumi-editor/types';

// ----------------------------------------------------------------------

function serializeEditorState(title: string, content: Content[]): string {
  if (!title && content.length === 0) {
    return 'Das Arbeitsblatt ist noch leer.';
  }

  const lines: string[] = [`Titel: "${title || '(kein Titel)'}"`, 'Inhalte:'];

  if (content.length === 0) {
    lines.push('  (keine Inhalte)');
  } else {
    content.forEach((item, i) => {
      if (item.type === 'text') {
        lines.push(`  ${i + 1}. [text] "${item.text.slice(0, 80)}${item.text.length > 80 ? '…' : ''}"`);
      } else if (item.type === 'multiple-choice') {
        const answers = item.answers.map((a) => `${a.text}${a.correct ? ' ✓' : ''}`).join(', ');
        lines.push(`  ${i + 1}. [multiple-choice] Frage: "${item.question}" | Antworten: ${answers}`);
      } else if (item.type === 'fill-in-the-blanks') {
        lines.push(`  ${i + 1}. [fill-in-the-blanks] "${item.text.slice(0, 80)}${item.text.length > 80 ? '…' : ''}"`);
      } else if (item.type === 'freetext') {
        lines.push(`  ${i + 1}. [freetext] "${item.task.slice(0, 80)}${item.task.length > 80 ? '…' : ''}"`);
      }
    });
  }

  return lines.join('\n');
}

// ----------------------------------------------------------------------

export function buildSystemPrompt(title: string, content: Content[]): string {
  const editorState = serializeEditorState(title, content);

  return `Du bist "Lumi", ein freundlicher Assistent, der Lernmaterial erstellt. Deine Aufgabe ist es, durch gezielte Fragen alle Informationen zu sammeln, die nötig sind, um ein hochwertiges interaktives Arbeitsblatt zu einem Thema zu erstellen.

Ablauf des Gesprächs:
1. Frage freundlich, welches Thema der Nutzer lernen möchte.
2. Stelle gezielte Fragen, um das Thema einzugrenzen:
   - Was soll der Lernende nach dem Arbeitsblatt verstehen oder können?
   - Welche Aspekte oder Unterthemen sind besonders wichtig?
   - Für wen ist das Arbeitsblatt gedacht (z. B. Kinder, Erwachsene, Anfänger)?
3. Stelle Rückfragen, bis du genug Informationen hast.
4. Erstelle das Arbeitsblatt schrittweise – füge nach jeder Nutzerantwort neue oder überarbeitete Inhalte hinzu.

Deine Regeln:
- Schreibe IMMER auf Deutsch.
- Stelle immer nur eine Frage auf einmal.
- Halte deine Nachrichten kurz und freundlich.
- Verwende KEINE Emojis.

Vorschläge:
- Biete dem Nutzer am Ende jeder Nachricht 2 bis 3 mögliche Antworten an, die er direkt anklicken kann:
[VORSCHLÄGE: Mögliche Antwort 1 | Mögliche Antwort 2 | Mögliche Antwort 3]

WORKSHEET_UPDATE – Pflichtformat:
- Du MUSST am Ende JEDER Antwort einen WORKSHEET_UPDATE-Block einfügen.
- Der Block enthält immer den VOLLSTÄNDIGEN gewünschten Zustand des Arbeitsblatts.
- Auch wenn sich nichts geändert hat, sende den aktuellen Stand erneut.
- Sobald du den Titel oder erste Inhalte kennst, trage sie ein. Baue das Arbeitsblatt schrittweise auf.
- Format (valides JSON, kein Zeilenumbruch im Block):
[WORKSHEET_UPDATE: {"title": "Titel", "content": [{"type": "text", "text": "Erklärung..."}, {"type": "multiple-choice", "question": "Frage?", "answers": [{"text": "Richtig", "correct": true}, {"text": "Falsch", "correct": false}]}]}]
- Unterstützte Typen: "text" (Feld: "text"), "multiple-choice" (Felder: "question", "answers").
- Der Block wird dem Nutzer NICHT angezeigt, sondern aktualisiert das Arbeitsblatt automatisch.

Aktueller Zustand des Arbeitsblatts:
${editorState}`;
}
