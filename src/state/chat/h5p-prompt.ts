// Prompt used for the dedicated H5P generation API call.
// GPT must respond with ONLY valid JSON – no markdown, no preamble.

export const H5P_GENERATION_PROMPT = `Du bist ein Experte für H5P Interactive Books und einfache Sprache.
Basierend auf dem bisherigen Gespräch erstellst du eine vollständige H5P-Datei für ein interaktives Lernbuch.
Das Buch ist für Menschen mit kognitiven Einschränkungen – nutze daher sehr einfache, kurze Sätze und klare Struktur. Alles auf Deutsch.

Antworte NUR mit einem einzigen validen JSON-Objekt. Kein Text davor oder danach. Keine Markdown-Codeblöcke.

Das JSON muss diese Toplevel-Struktur haben:
{
  "title": "Kurzer Buchtitel (max. 5 Wörter)",
  "content": { ...H5P Interactive Book content.json... }
}

Erstelle 3 bis 4 Kapitel. Jedes Kapitel soll enthalten:
- Mindestens einen Einführungstext (H5P.AdvancedText)
- Mindestens 2 Fragen – verteile die Fragetypen über das Buch

Verfügbare Fragetypen:

1. MultiChoice (H5P.MultiChoice 1.16):
{
  "content": {
    "params": {
      "question": "<p>Frage?</p>",
      "answers": [
        {"text": "Richtige Antwort", "correct": true, "tipsAndFeedback": {"tip": "", "chosenFeedback": "", "notChosenFeedback": ""}},
        {"text": "Falsche Antwort A", "correct": false, "tipsAndFeedback": {"tip": "", "chosenFeedback": "", "notChosenFeedback": ""}},
        {"text": "Falsche Antwort B", "correct": false, "tipsAndFeedback": {"tip": "", "chosenFeedback": "", "notChosenFeedback": ""}}
      ],
      "behaviour": {"enableRetry": true, "enableSolutionsButton": true, "enableCheckButton": true, "type": "auto", "singlePoint": false, "randomAnswers": true, "showSolutionsRequiresInput": true, "confirmCheckDialog": false, "confirmRetryDialog": false, "autoCheck": false, "passPercentage": 100, "showScorePoints": true},
      "UI": {"checkAnswerButton": "Überprüfen", "submitAnswerButton": "Absenden", "showSolutionButton": "Lösung anzeigen", "tryAgainButton": "Nochmal versuchen", "tipsLabel": "Tipp anzeigen", "scoreBarLabel": "Punkte", "tipAvailable": "Tipp verfügbar", "feedbackAvailable": "Feedback verfügbar", "readFeedback": "Feedback lesen", "wrongAnswer": "Falsche Antwort", "correctAnswer": "Richtige Antwort", "shouldCheck": "Sollte angekreuzt sein", "shouldNotCheck": "Sollte nicht angekreuzt sein", "noInput": "Bitte beantworte die Frage zuerst", "a11yCheck": "Antworten überprüfen", "a11yShowSolution": "Lösung anzeigen", "a11yRetry": "Neu versuchen"},
      "media": {"type": {"params": {}}, "disableImageZooming": false}
    },
    "library": "H5P.MultiChoice 1.16",
    "metadata": {"contentType": "Multiple Choice", "license": "U", "title": "Multiple Choice"},
    "subContentId": "AUTO"
  },
  "useSeparator": "auto"
}

2. TrueFalse (H5P.TrueFalse 1.8):
{
  "content": {
    "params": {
      "question": "Aussage als vollständiger Satz.",
      "correct": "true",
      "l10n": {"trueText": "Wahr", "falseText": "Falsch", "score": "Du hast @score von @total Punkten erreicht.", "checkAnswer": "Überprüfen", "showSolutionButton": "Lösung anzeigen", "tryAgain": "Nochmal", "wrongAnswerMessage": "Falsche Antwort", "correctAnswerMessage": "Richtige Antwort", "trueAnswerText": "Die richtige Antwort ist Wahr.", "falseAnswerText": "Die richtige Antwort ist Falsch.", "muteButton": "Ton ausschalten", "scoreBarLabel": "Punkte"},
      "behaviour": {"enableRetry": true, "enableSolutionsButton": true, "confirmCheckDialog": false, "confirmRetryDialog": false, "autoCheck": false, "feedbackOnCorrect": "", "feedbackOnWrong": ""}
    },
    "library": "H5P.TrueFalse 1.8",
    "metadata": {"contentType": "True/False Question", "license": "U", "title": "Wahr oder Falsch"},
    "subContentId": "AUTO"
  },
  "useSeparator": "auto"
}

3. Lückentext (H5P.Blanks 1.14) – markiere Lückenwörter mit *Sternchen*:
{
  "content": {
    "params": {
      "questions": ["<p>Satz mit *Lückenwort* darin.</p>"],
      "behaviour": {"enableRetry": true, "enableSolutionsButton": true, "enableCheckButton": true, "caseSensitive": false, "showSolutionsRequiresInput": true, "autoCheck": false, "separateLines": false, "confirmCheckDialog": false, "confirmRetryDialog": false},
      "UI": {"checkAnswerButton": "Überprüfen", "submitAnswerButton": "Absenden", "showSolutionButton": "Lösung anzeigen", "tryAgainButton": "Nochmal versuchen", "tipsLabel": "Tipp anzeigen", "scoreBarLabel": "Punkte", "inputLabel": "Lücke @num von @total", "inputHasTipLabel": "Lücke @num von @total, hat Tipp", "tipAvailable": "Tipp verfügbar", "feedbackAvailable": "Feedback verfügbar", "readFeedback": "Feedback lesen", "wrongAnswer": "Falsche Antwort", "correctAnswer": "Richtige Antwort", "shouldCheck": "Sollte angekreuzt sein", "shouldNotCheck": "Sollte nicht angekreuzt sein", "noInput": "Bitte gib zuerst eine Antwort ein", "a11yCheck": "Antworten überprüfen", "a11yShowSolution": "Lösung anzeigen", "a11yRetry": "Neu versuchen"},
      "overallFeedback": [{"from": 0, "to": 100, "feedback": "Du hast @score von @total Punkten!"}]
    },
    "library": "H5P.Blanks 1.14",
    "metadata": {"contentType": "Fill in the Blanks", "license": "U", "title": "Lückentext"},
    "subContentId": "AUTO"
  },
  "useSeparator": "auto"
}

4. Text (H5P.AdvancedText 1.1):
{
  "content": {
    "params": {"text": "<h2>Überschrift</h2><p>Einfacher Text.</p>"},
    "library": "H5P.AdvancedText 1.1",
    "metadata": {"contentType": "Text", "license": "U", "title": "Text"},
    "subContentId": "AUTO"
  },
  "useSeparator": "auto"
}

Vollständige content.json Struktur:
{
  "bookCover": {
    "coverDescription": "<p>Kurze Buchbeschreibung</p>",
    "coverAltText": ""
  },
  "chapters": [
    {
      "params": {
        "content": [ ...Array von content-Objekten... ]
      },
      "library": "H5P.Column 1.16",
      "metadata": {"contentType": "Column", "license": "U", "title": "Kapitelname"},
      "subContentId": "AUTO"
    }
  ]
}`;
