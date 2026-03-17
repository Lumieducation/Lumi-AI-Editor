import type { RootState, AppDispatch } from 'src/state';
import type { PreviewChapter, PreviewDocument } from './types';

import axios from 'axios';

import { ASSISTANT_SENDER_ID } from './thunks';
import { CHAT_PREVIEW_UPDATED } from './action-types';

// ----------------------------------------------------------------------

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

function renderMarkdown(doc: PreviewDocument): string {
  let md = `# ${doc.title}`;
  for (let i = 0; i < doc.chapters.length; i++) {
    const ch = doc.chapters[i];
    md += `\n\n## Kapitel ${i + 1}: ${ch.name}`;
    if (ch.explanation) md += `\n\n${ch.explanation}`;
    if (ch.questions) md += `\n\n${ch.questions}`;
  }
  return md;
}

async function callApi(systemPrompt: string, userContent: string): Promise<string> {
  const response = await axios.post(
    OPENAI_API_URL,
    {
      model: 'gpt-5.2',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
    }
  );
  return response.data.choices[0].message.content.trim();
}

// ----------------------------------------------------------------------

const TITLE_PROMPT = `Du analysierst ein Gespräch über ein geplantes Lernbuch.
Wurde im Gespräch ein konkretes Thema für das Lernbuch genannt?
Wenn ja, antworte NUR mit dem Buchtitel als kurzem deutschen Text (max. 5 Wörter). Keine Anführungszeichen, kein Markdown.
Wenn noch kein Thema erkennbar ist, antworte mit einem leeren String.`;

const CHAPTERS_PROMPT = `Du planst die Kapitelstruktur eines Lernbuchs.
Erstelle basierend auf dem Gespräch und dem Buchtitel 2 bis 4 passende Kapitelnamen auf Deutsch.
Falls der Nutzer eine bestimmte Anzahl oder konkrete Kapitel genannt hat, verwende diese.
Ansonsten leite sinnvolle Kapitel aus dem Thema und dem bisherigen Gespräch ab.
Antworte NUR mit einem JSON-Array der Kapitelnamen. Beispiel: ["Was ist Wetter?", "Regen und Sonne", "Jahreszeiten"]
Keine weiteren Erklärungen, nur das JSON-Array.`;

const EXPLANATION_PROMPT = `Du schreibst einen kurzen Einführungstext für ein Kapitel in einem Lernbuch für Menschen mit kognitiven Einschränkungen.
Sehr einfache, kurze Sätze. 3 bis 5 Sätze. Auf Deutsch.
Antworte NUR mit dem Fließtext, ohne Überschrift und ohne Markdown-Formatierung.`;

const QUESTIONS_PROMPT = `Du erstellst Übungsaufgaben für ein Kapitel in einem Lernbuch für Menschen mit kognitiven Einschränkungen.
Sehr einfache Sätze. Auf Deutsch.

Erstelle genau diese 3 Aufgaben in diesem Markdown-Format:

**Frage:** [Fragetext]
- [ ] [Falsche Antwort]
- [x] [Richtige Antwort]
- [ ] [Falsche Antwort]

**Wahr oder Falsch:** [Aussage als vollständiger Satz.]
→ [Wahr / Falsch]

**Lückentext:** [Satz mit ___Lückenwort___ darin.]

Antworte NUR mit diesen 3 Aufgaben im angegebenen Format.`;

// ----------------------------------------------------------------------

export const updatePreview =
  () =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<void> => {
    const { messages, previewDoc } = getState().chat;
    if (messages.length === 0) return;

    const conversation = messages
      .map((m) => `${m.senderId === ASSISTANT_SENDER_ID ? 'Lumi' : 'Nutzer'}: ${m.body}`)
      .join('\n');

    const dispatchDoc = (doc: PreviewDocument) =>
      dispatch({ type: CHAT_PREVIEW_UPDATED, payload: { markdown: renderMarkdown(doc), doc } });

    try {
      // Step 1: Title — only if not yet set
      if (!previewDoc?.title) {
        const title = await callApi(TITLE_PROMPT, conversation);
        if (!title) return;
        const newDoc: PreviewDocument = { title, chapters: [] };
        dispatchDoc(newDoc);
        return;
      }

      // Step 2: Chapter names — only if not yet set
      if (previewDoc.chapters.length === 0) {
        const raw = await callApi(
          CHAPTERS_PROMPT,
          `Gespräch:\n${conversation}\n\nBuchtitel: ${previewDoc.title}`
        );
        let names: string[];
        try {
          names = JSON.parse(raw);
          if (!Array.isArray(names) || names.length === 0) return;
        } catch {
          return;
        }
        const chapters: PreviewChapter[] = names.map((name) => ({
          name,
          explanation: '',
          questions: '',
        }));
        dispatchDoc({ ...previewDoc, chapters });
        return;
      }

      // Step 3: Explanation for the next chapter that is missing one
      const missingExplanationIdx = previewDoc.chapters.findIndex((ch) => !ch.explanation);
      if (missingExplanationIdx !== -1) {
        const ch = previewDoc.chapters[missingExplanationIdx];
        const explanation = await callApi(
          EXPLANATION_PROMPT,
          `Gespräch:\n${conversation}\n\nBuchtitel: ${previewDoc.title}\nKapitel: ${ch.name}`
        );
        const chapters = previewDoc.chapters.map((c, i) =>
          i === missingExplanationIdx ? { ...c, explanation } : c
        );
        dispatchDoc({ ...previewDoc, chapters });
        return;
      }

      // Step 4: Questions for the next chapter that is missing them
      const missingQuestionsIdx = previewDoc.chapters.findIndex((ch) => !ch.questions);
      if (missingQuestionsIdx !== -1) {
        const ch = previewDoc.chapters[missingQuestionsIdx];
        const questions = await callApi(
          QUESTIONS_PROMPT,
          `Gespräch:\n${conversation}\n\nBuchtitel: ${previewDoc.title}\nKapitel: ${ch.name}\nEinführungstext: ${ch.explanation}`
        );
        const chapters = previewDoc.chapters.map((c, i) =>
          i === missingQuestionsIdx ? { ...c, questions } : c
        );
        dispatchDoc({ ...previewDoc, chapters });
      }
    } catch (error) {
      console.error('Preview generation error:', error);
    }
  };
