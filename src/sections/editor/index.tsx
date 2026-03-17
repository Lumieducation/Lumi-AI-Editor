import * as React from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

import { useMenus } from './hooks/use-menus';
import { metadata, drawerWidth } from './constants';
import { useDragDrop } from './hooks/use-drag-drop';
import { CommandMenu } from './components/command-menu';
import { ContentMenu } from './components/content-menu';
import { useFocusState } from './hooks/use-focus-state';
import { EditorHeader } from './components/editor-header';
import { EditorCanvas } from './components/editor-canvas';
import { AIChatHandle } from './components/ai-chat-handle';
import { AIChatDrawer } from './components/ai-chat-drawer';
import { TurnIntoMenu } from './components/turn-into-menu';
import { AITextDialog } from './components/ai-text-dialog';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { AIQuestionDialog } from './components/ai-question-dialog';
import { generateH5PPackage, downloadH5PPackage } from '../../utils/h5p-generator';
import { generateText, sendChatMessage, generateQuestion } from './store/editor-thunks';
import {
  selectTitle,
  selectContent,
  selectProvider,
  selectApiToken,
  selectHasContent,
  selectApiEndpoint,
  selectChatMessages,
  createContentHelper,
} from './store/editor-selectors';
import {
  setTitle,
  setContent,
  setProvider,
  setApiToken,
  updateContent,
  deleteContent,
  setApiEndpoint,
  addChatMessage,
  insertContentAt,
  duplicateContent,
} from './store/editor-slice';

import type { ContentType, CommandOption, CreationState } from './types';

// ----------------------------------------------------------------------

function EditorPage() {
  const dispatch = useAppDispatch();

  // Redux state (data only)
  const provider = useAppSelector(selectProvider);
  const apiEndpoint = useAppSelector(selectApiEndpoint);
  const apiToken = useAppSelector(selectApiToken);
  const title = useAppSelector(selectTitle);
  const content = useAppSelector(selectContent);
  const hasContent = useAppSelector(selectHasContent);
  const chatMessages = useAppSelector(selectChatMessages);

  // Local UI state - Chat
  const [chatDrawerOpen, setChatDrawerOpen] = React.useState(false);
  const [chatInput, setChatInput] = React.useState('');
  const [chatLoading, setChatLoading] = React.useState(false);
  const [creationState, setCreationState] = React.useState<CreationState>({
    step: 'idle',
    topic: '',
    audience: '',
  });
  const chatMessagesEndRef = React.useRef<HTMLDivElement>(null);

  // Local UI state - Snackbar
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Local UI state - Download
  const [downloadLoading, setDownloadLoading] = React.useState(false);

  // Local UI state - AI Dialogs
  const [aiQuestionDialog, setAiQuestionDialog] = React.useState({
    open: false,
    context: '',
    loading: false,
    targetContentId: null as string | null,
    mode: 'create' as 'create' | 'addBelow' | 'transform',
  });

  const [aiTextDialog, setAiTextDialog] = React.useState({
    open: false,
    context: '',
    loading: false,
    targetContentId: null as string | null,
    mode: 'create' as 'create' | 'addBelow' | 'transform',
  });

  // Use existing hooks for UI state
  const menus = useMenus();
  const focusState = useFocusState();
  const dragDrop = useDragDrop(content, (newContent) => dispatch(setContent(newContent)));

  // Auto-scroll chat when messages change
  React.useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Download handler
  const handleDownload = async () => {
    setDownloadLoading(true);
    try {
      setSnackbar({
        open: true,
        message: 'H5P-Paket wird vorbereitet...',
        severity: 'info',
      });

      const h5pBlob = await generateH5PPackage(title, content);
      const filename = title.trim() || 'interactive-book';
      downloadH5PPackage(h5pBlob, filename);

      setSnackbar({
        open: true,
        message: 'H5P-Paket erfolgreich heruntergeladen!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error generating H5P package:', error);
      setSnackbar({
        open: true,
        message: `Fehler beim Erstellen des H5P-Pakets: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        severity: 'error',
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  // AI Question Dialog handlers
  const handleGenerateQuestion = async () => {
    if (!apiToken.trim()) {
      setSnackbar({
        open: true,
        message: 'Bitte geben Sie einen API-Token ein',
        severity: 'error',
      });
      return;
    }

    setAiQuestionDialog((prev) => ({ ...prev, loading: true }));

    try {
      const result = await dispatch(
        generateQuestion({
          context: aiQuestionDialog.context,
          mode: aiQuestionDialog.mode,
          targetContentId: aiQuestionDialog.targetContentId,
        })
      ).unwrap();

      if (aiQuestionDialog.mode === 'create') {
        dispatch(setContent(content.length === 0 ? [result] : [result, ...content]));
      } else if (aiQuestionDialog.mode === 'addBelow' && aiQuestionDialog.targetContentId) {
        const targetIndex = content.findIndex((c) => c.id === aiQuestionDialog.targetContentId);
        dispatch(insertContentAt({ content: result, index: targetIndex + 1 }));
      } else if (aiQuestionDialog.mode === 'transform' && aiQuestionDialog.targetContentId) {
        // Update existing content preserving the ID
        dispatch(
          setContent(
            content.map((item) =>
              item.id === aiQuestionDialog.targetContentId
                ? { ...result, id: aiQuestionDialog.targetContentId }
                : item
            )
          )
        );
      }

      setSnackbar({
        open: true,
        message: aiQuestionDialog.mode === 'transform' ? 'Inhalt erfolgreich umgewandelt' : 'Frage erfolgreich generiert',
        severity: 'success',
      });
      setAiQuestionDialog({ open: false, context: '', loading: false, targetContentId: null, mode: 'create' });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Fehler beim Generieren der Frage',
        severity: 'error',
      });
      setAiQuestionDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  // AI Text Dialog handlers
  const handleGenerateText = async () => {
    if (!apiToken.trim()) {
      setSnackbar({
        open: true,
        message: 'Bitte geben Sie einen API-Token ein',
        severity: 'error',
      });
      return;
    }

    setAiTextDialog((prev) => ({ ...prev, loading: true }));

    try {
      const result = await dispatch(
        generateText({
          context: aiTextDialog.context,
          mode: aiTextDialog.mode,
          targetContentId: aiTextDialog.targetContentId,
        })
      ).unwrap();

      if (aiTextDialog.mode === 'create') {
        dispatch(setContent(content.length === 0 ? [result] : [result, ...content]));
      } else if (aiTextDialog.mode === 'addBelow' && aiTextDialog.targetContentId) {
        const targetIndex = content.findIndex((c) => c.id === aiTextDialog.targetContentId);
        dispatch(insertContentAt({ content: result, index: targetIndex + 1 }));
      } else if (aiTextDialog.mode === 'transform' && aiTextDialog.targetContentId) {
        // Update existing content preserving the ID
        dispatch(
          setContent(
            content.map((item) =>
              item.id === aiTextDialog.targetContentId
                ? { ...result, id: aiTextDialog.targetContentId }
                : item
            )
          )
        );
      }

      setSnackbar({
        open: true,
        message: aiTextDialog.mode === 'transform' ? 'Inhalt erfolgreich umgewandelt' : 'Text erfolgreich generiert',
        severity: 'success',
      });
      setAiTextDialog({ open: false, context: '', loading: false, targetContentId: null, mode: 'create' });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Fehler beim Generieren des Textes',
        severity: 'error',
      });
      setAiTextDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  // Chat handlers
  const startGuidedCreation = () => {
    if (!apiToken.trim()) {
      setSnackbar({ open: true, message: 'Bitte geben Sie Ihren API-Token ein', severity: 'error' });
      return;
    }

    dispatch(
      addChatMessage({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content:
          'Hallo! Ich helfe dir beim Erstellen eines Arbeitsblatts. Lass uns mit den Grundlagen beginnen.\n\nWelches Thema soll dein Arbeitsblatt behandeln?',
      })
    );
    setCreationState({
      step: 'asking_topic',
      topic: '',
      audience: '',
    });
    setChatDrawerOpen(true);
  };

  const handleSendChatMessage = async () => {
    if (!apiToken.trim() || !chatInput.trim()) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: chatInput,
    };

    const userInput = chatInput;
    dispatch(addChatMessage(userMessage));
    setChatInput('');
    setChatLoading(true);

    try {
      const result = await dispatch(
        sendChatMessage({ userInput, creationState })
      ).unwrap();

      dispatch(addChatMessage(result.assistantMessage));

      // Update creation state based on step
      if (creationState.step === 'asking_topic') {
        setCreationState((prev) => ({
          ...prev,
          step: 'asking_audience',
          topic: userInput,
        }));
      } else if (creationState.step === 'asking_audience') {
        setCreationState({
          step: 'done',
          topic: creationState.topic,
          audience: userInput,
        });
      }

      // Show snackbar for commands
      if (result.commands && result.commands.length > 0) {
        result.commands.forEach((cmd) => {
          if (cmd.action === 'add_text') {
            setSnackbar({ open: true, message: 'Textblock hinzugefügt', severity: 'success' });
          } else if (cmd.action === 'add_question') {
            setSnackbar({ open: true, message: 'Frage hinzugefügt', severity: 'success' });
          } else if (cmd.action === 'set_title') {
            setSnackbar({ open: true, message: 'Titel aktualisiert', severity: 'success' });
          }
        });
      }
    } catch (error) {
      const errorMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant' as const,
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
      };
      dispatch(addChatMessage(errorMessage));

      if (creationState.step === 'generating') {
        setCreationState((prev) => ({ ...prev, step: 'asking_audience' }));
      }
    } finally {
      setChatLoading(false);
    }
  };

  // Command menu handlers
  const handleCommandSelect = (option: CommandOption) => {
    if (menus.commandMenu.contentId === null) return;

    if (menus.commandMenu.mode === 'addBelow') {
      const newContent = createContentHelper(option.contentType);
      const currentIndex = content.findIndex((c) => c.id === menus.commandMenu.contentId);
      dispatch(insertContentAt({ content: newContent, index: currentIndex + 1 }));
    }

    menus.setCommandMenu({ anchor: null, contentId: null, mode: 'transform' });
  };

  const handleWelcomeContentCreate = (option: CommandOption) => {
    if (!title || title.trim() === '') return;
    const newContent = createContentHelper(option.contentType);
    dispatch(setContent([newContent]));
  };

  const handleTurnInto = (contentId: string, targetType: ContentType) => {
    const newContent = createContentHelper(targetType);
    dispatch(
      setContent(content.map((item) => (item.id === contentId ? { ...newContent, id: contentId } : item)))
    );
    menus.setContentMenu({ anchor: null, contentId: null });
    menus.setTurnIntoMenuAnchor(null);
  };

  const handleAITurnInto = (contentId: string, targetType: ContentType) => {
    // Find the current content to get its text for transformation
    const currentContent = content.find((c) => c.id === contentId);
    if (!currentContent) return;

    // Extract text from current content
    let contextText = '';
    if (currentContent.type === 'text') {
      contextText = currentContent.text;
    } else if (currentContent.type === 'multiple-choice') {
      contextText = `Frage: ${currentContent.question}\n\nAntworten:\n${currentContent.answers.map((a) => `- ${a.text}${a.correct ? ' (richtig)' : ''}`).join('\n')}`;
    }

    // Open the appropriate AI dialog in transform mode
    if (targetType === 'multiple-choice') {
      setAiQuestionDialog({
        open: true,
        context: contextText,
        loading: false,
        targetContentId: contentId,
        mode: 'transform',
      });
    } else if (targetType === 'text') {
      setAiTextDialog({
        open: true,
        context: contextText,
        loading: false,
        targetContentId: contentId,
        mode: 'transform',
      });
    }

    // Close menus
    menus.setContentMenu({ anchor: null, contentId: null });
    menus.setTurnIntoMenuAnchor(null);
  };

  return (
    <>
      <title>{metadata.title}</title>

      {/* Main Content Area */}
      <Box
        sx={{
          minHeight: '100vh',
          pr: chatDrawerOpen ? `${drawerWidth}px` : 0,
          transition: (theme) =>
            theme.transitions.create('padding-right', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }}
      >
        {/* Header */}
        <EditorHeader
          provider={provider}
          apiEndpoint={apiEndpoint}
          apiToken={apiToken}
          downloadLoading={downloadLoading}
          hasContent={hasContent}
          onProviderChange={(newProvider) => dispatch(setProvider(newProvider))}
          onEndpointChange={(endpoint) => dispatch(setApiEndpoint(endpoint))}
          onTokenChange={(token) => dispatch(setApiToken(token))}
          onDownload={handleDownload}
        />

        {/* Editor Canvas */}
        <EditorCanvas
          title={title}
          content={content}
          focusedTextId={focusState.focusedTextId}
          focusedMCQId={focusState.focusedMCQId}
          mcqTextValue={focusState.mcqTextValue}
          dropTargetId={dragDrop.dropTargetId}
          dropPosition={dragDrop.dropPosition}
          onTitleChange={(newTitle) => dispatch(setTitle(newTitle))}
          onContentUpdate={(id, updates) => dispatch(updateContent({ id, updates }))}
          onDeleteContent={(id) => dispatch(deleteContent(id))}
          onAddBelowClick={(e, contentId) => {
            menus.setCommandMenu({
              anchor: e.currentTarget,
              contentId,
              mode: 'addBelow',
            });
          }}
          onContentMenuClick={(e, contentId) => {
            menus.setContentMenu({
              anchor: e.currentTarget,
              contentId,
            });
          }}
          onDragStart={dragDrop.handleDragStart}
          onDragEnd={() => dragDrop.setDragId(null)}
          onDragOver={dragDrop.handleDragOver}
          onDrop={dragDrop.handleDrop}
          onTextFocus={focusState.setFocusedTextId}
          onTextBlur={() => focusState.setFocusedTextId(null)}
          onMCQFocus={(id, textValue) => {
            focusState.setFocusedMCQId(id);
            focusState.setMcqTextValue(textValue);
          }}
          onMCQBlur={() => {
            focusState.setFocusedMCQId(null);
          }}
          onMCQTextChange={focusState.setMcqTextValue}
          onStartGuidedCreation={startGuidedCreation}
          onWelcomeContentCreate={handleWelcomeContentCreate}
          onOpenAiQuestionDialog={() =>
            setAiQuestionDialog({ open: true, context: '', loading: false, targetContentId: null, mode: 'create' })
          }
          onOpenAiTextDialog={() =>
            setAiTextDialog({ open: true, context: '', loading: false, targetContentId: null, mode: 'create' })
          }
        />

        {/* AI Chat Handle */}
        {!chatDrawerOpen && <AIChatHandle onClick={() => setChatDrawerOpen(true)} />}
      </Box>

      {/* AI Chat Drawer */}
      <AIChatDrawer
        open={chatDrawerOpen}
        apiToken={apiToken}
        chatMessages={chatMessages}
        chatInput={chatInput}
        chatLoading={chatLoading}
        chatMessagesEndRef={chatMessagesEndRef}
        onClose={() => setChatDrawerOpen(false)}
        onChatInputChange={setChatInput}
        onSendMessage={handleSendChatMessage}
        onStartGuidedCreation={startGuidedCreation}
      />

      {/* Command Menu */}
      <CommandMenu
        menuState={menus.commandMenu}
        onClose={() => menus.setCommandMenu({ anchor: null, contentId: null, mode: 'transform' })}
        onSelect={handleCommandSelect}
        onAIButtonClick={(contentType, contentId) => {
          const mode = menus.commandMenu.mode === 'transform' ? 'transform' : 'addBelow';

          // Get existing content for transform mode
          let contextText = '';
          if (mode === 'transform' && contentId) {
            const currentContent = content.find((c) => c.id === contentId);
            if (currentContent) {
              if (currentContent.type === 'text') {
                contextText = currentContent.text;
              } else if (currentContent.type === 'multiple-choice') {
                contextText = `Frage: ${currentContent.question}\n\nAntworten:\n${currentContent.answers.map((a) => `- ${a.text}${a.correct ? ' (richtig)' : ''}`).join('\n')}`;
              }
            }
          }

          if (contentType === 'multiple-choice') {
            setAiQuestionDialog({
              open: true,
              context: contextText,
              loading: false,
              targetContentId: contentId,
              mode,
            });
          } else if (contentType === 'text') {
            setAiTextDialog({
              open: true,
              context: contextText,
              loading: false,
              targetContentId: contentId,
              mode,
            });
          }

          // Close the command menu
          menus.setCommandMenu({ anchor: null, contentId: null, mode: 'transform' });
        }}
      />

      {/* Content Menu */}
      <ContentMenu
        menuState={menus.contentMenu}
        onClose={() => menus.setContentMenu({ anchor: null, contentId: null })}
        onDuplicate={() => {
          if (menus.contentMenu.contentId) {
            dispatch(duplicateContent(menus.contentMenu.contentId));
          }
          menus.setContentMenu({ anchor: null, contentId: null });
        }}
        onTurnIntoHover={(e) => menus.setTurnIntoMenuAnchor(e.currentTarget)}
        onTurnIntoClick={(e) => menus.setTurnIntoMenuAnchor(e.currentTarget)}
      />

      {/* Turn Into Submenu */}
      <TurnIntoMenu
        anchorEl={menus.turnIntoMenuAnchor}
        onClose={() => menus.setTurnIntoMenuAnchor(null)}
        onMouseLeave={() => menus.setTurnIntoMenuAnchor(null)}
        onSelect={(contentType) => {
          if (menus.contentMenu.contentId) {
            handleTurnInto(menus.contentMenu.contentId, contentType);
          }
        }}
        onAITransform={(contentType) => {
          if (menus.contentMenu.contentId) {
            handleAITurnInto(menus.contentMenu.contentId, contentType);
          }
        }}
      />

      {/* AI Question Generation Dialog */}
      <AIQuestionDialog
        dialogState={aiQuestionDialog}
        apiToken={apiToken}
        onClose={() =>
          setAiQuestionDialog({ open: false, context: '', loading: false, targetContentId: null, mode: 'create' })
        }
        onContextChange={(context) => setAiQuestionDialog((prev) => ({ ...prev, context }))}
        onGenerate={handleGenerateQuestion}
      />

      {/* AI Text Generation Dialog */}
      <AITextDialog
        dialogState={aiTextDialog}
        apiToken={apiToken}
        onClose={() =>
          setAiTextDialog({ open: false, context: '', loading: false, targetContentId: null, mode: 'create' })
        }
        onContextChange={(context) => setAiTextDialog((prev) => ({ ...prev, context }))}
        onGenerate={handleGenerateText}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default function Page() {
  return <EditorPage />;
}
