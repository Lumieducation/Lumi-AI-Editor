import * as React from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

import { useSelector, useDispatch } from 'src/state';
import { sendMessage } from 'src/state/chat/thunks';
import { selectChatMessages, selectChatLoading } from 'src/state/chat/selectors';
import {
  selectTitle,
  selectProvider,
  selectApiToken,
  selectHasContent,
  selectApiEndpoint,
  selectOrderedContent,
  createContentHelper,
  providerChanged,
  apiTokenChanged,
  apiEndpointChanged,
  worksheetTitleChanged,
  worksheetContentsSet,
  worksheetContentAdded,
  worksheetContentUpdated,
  worksheetContentDeleted,
  worksheetContentDuplicated,
} from 'src/state/lumi-editor';
import {
  generateText,
  generateQuestion,
} from 'src/state/lumi-editor/lumiEditorThunks';

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
import { generateH5PPackage, downloadH5PPackage } from '../../utils/h5p-generator';

import type { ContentType, CommandOption, GeneratingSkeleton } from './types';

// ----------------------------------------------------------------------

function EditorPage() {
  const dispatch = useDispatch();

  // Redux state (data only)
  const provider = useSelector(selectProvider);
  const apiEndpoint = useSelector(selectApiEndpoint);
  const apiToken = useSelector(selectApiToken);
  const title = useSelector(selectTitle);
  const content = useSelector(selectOrderedContent);
  const hasContent = useSelector(selectHasContent);
  const chatMessages = useSelector(selectChatMessages);

  // Local UI state - Chat
  const [chatDrawerOpen, setChatDrawerOpen] = React.useState(false);
  const [chatInput, setChatInput] = React.useState('');
  const chatLoading = useSelector(selectChatLoading);
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

  // Local UI state - Generating skeletons
  const [generatingSkeletons, setGeneratingSkeletons] = React.useState<GeneratingSkeleton[]>([]);

  // Hooks for transient UI state
  const menus = useMenus();
  const focusState = useFocusState();
  const dragDrop = useDragDrop(content, (newContent) =>
    dispatch(worksheetContentsSet(newContent))
  );

  // Auto-scroll chat
  React.useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Download handler
  const handleDownload = async () => {
    setDownloadLoading(true);
    try {
      setSnackbar({ open: true, message: 'H5P-Paket wird vorbereitet...', severity: 'info' });
      const h5pBlob = await generateH5PPackage(title, content);
      downloadH5PPackage(h5pBlob, title.trim() || 'interactive-book');
      setSnackbar({ open: true, message: 'H5P-Paket erfolgreich heruntergeladen!', severity: 'success' });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Fehler beim Erstellen des H5P-Pakets: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        severity: 'error',
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  // AI generation helpers
  const handleGenerateQuestion = async (
    mode: 'create' | 'addBelow' | 'transform',
    targetContentId: string | null
  ) => {
    if (!apiToken.trim()) {
      setSnackbar({ open: true, message: 'Bitte geben Sie einen API-Token ein', severity: 'error' });
      return;
    }
    const skeletonId = `skeleton-${Date.now()}`;
    setGeneratingSkeletons((prev) => [
      ...prev,
      { id: skeletonId, type: 'multiple-choice', mode, targetContentId },
    ]);
    try {
      const result = await dispatch(generateQuestion({ mode, targetContentId })).unwrap();

      if (mode === 'create') {
        dispatch(worksheetContentAdded({ content: result, index: 0 }));
      } else if (mode === 'addBelow' && targetContentId) {
        const targetIndex = content.findIndex((c) => c.id === targetContentId);
        dispatch(worksheetContentAdded({ content: result, index: targetIndex + 1 }));
      } else if (mode === 'transform' && targetContentId) {
        dispatch(
          worksheetContentsSet(
            content.map((item) =>
              item.id === targetContentId ? { ...result, id: targetContentId } : item
            )
          )
        );
      }
      setSnackbar({
        open: true,
        message: mode === 'transform' ? 'Inhalt erfolgreich umgewandelt' : 'Frage erfolgreich generiert',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Fehler beim Generieren der Frage',
        severity: 'error',
      });
    } finally {
      setGeneratingSkeletons((prev) => prev.filter((s) => s.id !== skeletonId));
    }
  };

  const handleGenerateText = async (
    mode: 'create' | 'addBelow' | 'transform',
    targetContentId: string | null
  ) => {
    if (!apiToken.trim()) {
      setSnackbar({ open: true, message: 'Bitte geben Sie einen API-Token ein', severity: 'error' });
      return;
    }
    const skeletonId = `skeleton-${Date.now()}`;
    setGeneratingSkeletons((prev) => [
      ...prev,
      { id: skeletonId, type: 'text', mode, targetContentId },
    ]);
    try {
      const result = await dispatch(generateText({ mode, targetContentId })).unwrap();

      if (mode === 'create') {
        dispatch(worksheetContentAdded({ content: result, index: 0 }));
      } else if (mode === 'addBelow' && targetContentId) {
        const targetIndex = content.findIndex((c) => c.id === targetContentId);
        dispatch(worksheetContentAdded({ content: result, index: targetIndex + 1 }));
      } else if (mode === 'transform' && targetContentId) {
        dispatch(
          worksheetContentsSet(
            content.map((item) =>
              item.id === targetContentId ? { ...result, id: targetContentId } : item
            )
          )
        );
      }
      setSnackbar({
        open: true,
        message: mode === 'transform' ? 'Inhalt erfolgreich umgewandelt' : 'Text erfolgreich generiert',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Fehler beim Generieren des Textes',
        severity: 'error',
      });
    } finally {
      setGeneratingSkeletons((prev) => prev.filter((s) => s.id !== skeletonId));
    }
  };

  // Chat handlers
  const startGuidedCreation = () => {
    if (!apiToken.trim()) {
      setSnackbar({ open: true, message: 'Bitte geben Sie Ihren API-Token ein', severity: 'error' });
      return;
    }
    setChatDrawerOpen(true);
    dispatch(sendMessage('Hilf mir bitte ein Arbeitsblatt zu erstellen.', 'user'));
  };

  const handleSendChatMessage = () => {
    if (!apiToken.trim() || !chatInput.trim()) return;
    const userInput = chatInput;
    setChatInput('');
    dispatch(sendMessage(userInput, 'user'));
  };

  // Command menu handlers
  const handleCommandSelect = (option: CommandOption) => {
    if (menus.commandMenu.contentId === null) return;
    if (menus.commandMenu.mode === 'addBelow') {
      const newContent = createContentHelper(option.contentType);
      const currentIndex = content.findIndex((c) => c.id === menus.commandMenu.contentId);
      dispatch(worksheetContentAdded({ content: newContent, index: currentIndex + 1 }));
    }
    menus.setCommandMenu({ anchor: null, contentId: null, mode: 'transform' });
  };

  const handleWelcomeContentCreate = (option: CommandOption) => {
    if (!title || title.trim() === '') return;
    const newContent = createContentHelper(option.contentType);
    dispatch(worksheetContentsSet([newContent]));
  };

  const handleTurnInto = (contentId: string, targetType: ContentType) => {
    const newContent = createContentHelper(targetType);
    dispatch(
      worksheetContentsSet(
        content.map((item) => (item.id === contentId ? { ...newContent, id: contentId } : item))
      )
    );
    menus.setContentMenu({ anchor: null, contentId: null });
    menus.setTurnIntoMenuAnchor(null);
  };

  const handleAITurnInto = (contentId: string, targetType: ContentType) => {
    if (targetType === 'multiple-choice') {
      handleGenerateQuestion('transform', contentId);
    } else if (targetType === 'text') {
      handleGenerateText('transform', contentId);
    }
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
          onProviderChange={(newProvider) => dispatch(providerChanged(newProvider))}
          onEndpointChange={(endpoint) => dispatch(apiEndpointChanged(endpoint))}
          onTokenChange={(token) => dispatch(apiTokenChanged(token))}
          onDownload={handleDownload}
        />

        {/* Editor Canvas */}
        <EditorCanvas
          title={title}
          content={content}
          generatingSkeletons={generatingSkeletons}
          focusedTextId={focusState.focusedTextId}
          focusedMCQId={focusState.focusedMCQId}
          mcqTextValue={focusState.mcqTextValue}
          dropTargetId={dragDrop.dropTargetId}
          dropPosition={dragDrop.dropPosition}
          onTitleChange={(newTitle) => dispatch(worksheetTitleChanged(newTitle))}
          onContentUpdate={(id, updates) => dispatch(worksheetContentUpdated({ id, updates }))}
          onDeleteContent={(id) => dispatch(worksheetContentDeleted(id))}
          onAddBelowClick={(e, contentId) =>
            menus.setCommandMenu({ anchor: e.currentTarget, contentId, mode: 'addBelow' })
          }
          onContentMenuClick={(e, contentId) =>
            menus.setContentMenu({ anchor: e.currentTarget, contentId })
          }
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
          onMCQBlur={() => focusState.setFocusedMCQId(null)}
          onMCQTextChange={focusState.setMcqTextValue}
          onStartGuidedCreation={startGuidedCreation}
          onWelcomeContentCreate={handleWelcomeContentCreate}
          onOpenAiQuestionDialog={() => handleGenerateQuestion('create', null)}
          onOpenAiTextDialog={() => handleGenerateText('create', null)}
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
        onSuggestionClick={(text) => {
          dispatch(sendMessage(text, 'user'));
        }}
      />

      {/* Command Menu */}
      <CommandMenu
        menuState={menus.commandMenu}
        onClose={() => menus.setCommandMenu({ anchor: null, contentId: null, mode: 'transform' })}
        onSelect={handleCommandSelect}
        onAIButtonClick={(contentType, contentId) => {
          const mode = menus.commandMenu.mode === 'transform' ? 'transform' : 'addBelow';
          if (contentType === 'multiple-choice') {
            handleGenerateQuestion(mode, contentId);
          } else if (contentType === 'text') {
            handleGenerateText(mode, contentId);
          }
          menus.setCommandMenu({ anchor: null, contentId: null, mode: 'transform' });
        }}
      />

      {/* Content Menu */}
      <ContentMenu
        menuState={menus.contentMenu}
        onClose={() => menus.setContentMenu({ anchor: null, contentId: null })}
        onDuplicate={() => {
          if (menus.contentMenu.contentId) {
            dispatch(worksheetContentDuplicated(menus.contentMenu.contentId));
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
          if (menus.contentMenu.contentId) handleTurnInto(menus.contentMenu.contentId, contentType);
        }}
        onAITransform={(contentType) => {
          if (menus.contentMenu.contentId) handleAITurnInto(menus.contentMenu.contentId, contentType);
        }}
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
