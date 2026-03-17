import * as React from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import InputBase from '@mui/material/InputBase';
import Typography from '@mui/material/Typography';

import { ContentItem } from './content-item';
import { WelcomeState } from './welcome-state';
import { MCQContentRenderer } from './mcq-content';
import { TextContentRenderer } from './text-content';
import { ContentSkeleton } from './content-skeleton';
import { mcqToText, textToMcq } from '../utils/mcq-parser';
import { ContentOptionsGrid } from './content-options-grid';

import type { Content, CommandOption, GeneratingSkeleton } from '../types';

// ----------------------------------------------------------------------

type EditorCanvasProps = {
  title: string;
  content: Content[];
  generatingSkeletons: GeneratingSkeleton[];
  focusedTextId: string | null;
  focusedMCQId: string | null;
  mcqTextValue: string;
  dropTargetId: string | null;
  dropPosition: 'before' | 'after';
  onTitleChange: (title: string) => void;
  onContentUpdate: (contentId: string, updates: Partial<Content>) => void;
  onDeleteContent: (contentId: string) => void;
  onAddBelowClick: (e: React.MouseEvent<HTMLButtonElement>, contentId: string) => void;
  onContentMenuClick: (e: React.MouseEvent<HTMLButtonElement>, contentId: string) => void;
  onDragStart: (e: React.DragEvent<HTMLButtonElement>, id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onTextFocus: (id: string) => void;
  onTextBlur: () => void;
  onMCQFocus: (id: string, textValue: string) => void;
  onMCQBlur: (textValue: string) => void;
  onMCQTextChange: (textValue: string) => void;
  onStartGuidedCreation: () => void;
  onWelcomeContentCreate: (option: CommandOption) => void;
  onOpenAiQuestionDialog: () => void;
  onOpenAiTextDialog: () => void;
};

export function EditorCanvas({
  title,
  content,
  generatingSkeletons,
  focusedTextId,
  focusedMCQId,
  mcqTextValue,
  dropTargetId,
  dropPosition,
  onTitleChange,
  onContentUpdate,
  onDeleteContent,
  onAddBelowClick,
  onContentMenuClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onTextFocus,
  onTextBlur,
  onMCQFocus,
  onMCQBlur,
  onMCQTextChange,
  onStartGuidedCreation,
  onWelcomeContentCreate,
  onOpenAiQuestionDialog,
  onOpenAiTextDialog,
}: EditorCanvasProps) {
  const renderContentItem = (item: Content) => {
    switch (item.type) {
      case 'text': {
        return (
          <TextContentRenderer
            item={item}
            isFocused={focusedTextId === item.id}
            onFocus={() => onTextFocus(item.id)}
            onBlur={onTextBlur}
            onChange={(text) => onContentUpdate(item.id, { text })}
          />
        );
      }

      case 'multiple-choice': {
        return (
          <MCQContentRenderer
            item={item}
            isFocused={focusedMCQId === item.id}
            mcqTextValue={mcqTextValue}
            onFocus={(currentValue) => {
              onMCQFocus(item.id, currentValue || mcqToText(item));
            }}
            onBlur={(textValue) => {
              if (textValue.trim()) {
                const updates = textToMcq(textValue);
                onContentUpdate(item.id, updates);
              }
              onMCQBlur(textValue);
            }}
            onChange={onMCQTextChange}
            onAnswerToggle={(answerIndex, newCorrectValue) => {
              const newAnswers = [...(item.answers || [])];
              newAnswers[answerIndex] = { ...newAnswers[answerIndex], correct: newCorrectValue };
              onContentUpdate(item.id, { answers: newAnswers });
            }}
          />
        );
      }

      default:
        return <Typography>Nicht unterstützter Inhaltstyp</Typography>;
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Paper
        sx={{
          margin: 'auto',
          padding: 2.5,
          width: '100%',
          maxWidth: '1000px',
        }}
        elevation={5}
      >
        <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
          <Stack spacing={3}>
            {/* Title Section */}
            <InputBase
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Titel"
              fullWidth
              sx={{
                backgroundColor: 'transparent',
                '& input': {
                  fontSize: 36,
                  fontWeight: 700,
                  lineHeight: 1.2,
                },
              }}
            />

            {/* Content Area */}
            <Stack spacing={2}>
              {content.length === 0 && generatingSkeletons.length === 0 ? (
                !title || title.trim() === '' ? (
                  <WelcomeState onStartGuidedCreation={onStartGuidedCreation} />
                ) : (
                  <ContentOptionsGrid
                    onCreateContent={onWelcomeContentCreate}
                    onOpenAiDialog={(contentType) => {
                      if (contentType === 'multiple-choice') {
                        onOpenAiQuestionDialog();
                      } else {
                        onOpenAiTextDialog();
                      }
                    }}
                  />
                )
              ) : (
                <>
                  {/* 'create' skeletons go at the top */}
                  {generatingSkeletons
                    .filter((s) => s.mode === 'create')
                    .map((s) => (
                      <ContentSkeleton key={s.id} type={s.type} />
                    ))}

                  {content.map((item) => {
                    const isActive = focusedTextId === item.id || focusedMCQId === item.id;
                    const isDropTarget = dropTargetId === item.id;
                    const transformSkeleton = generatingSkeletons.find(
                      (s) => s.mode === 'transform' && s.targetContentId === item.id
                    );

                    return (
                      <React.Fragment key={item.id}>
                        {transformSkeleton ? (
                          <ContentSkeleton type={transformSkeleton.type} />
                        ) : (
                          <ContentItem
                            item={item}
                            isActive={isActive}
                            isDropTarget={isDropTarget}
                            dropPosition={dropPosition}
                            onDelete={() => onDeleteContent(item.id)}
                            onAddBelow={(e) => onAddBelowClick(e, item.id)}
                            onMenuOpen={(e) => onContentMenuClick(e, item.id)}
                            onDragStart={(e) => onDragStart(e, item.id)}
                            onDragEnd={onDragEnd}
                            onDragOver={(e) => onDragOver(e, item.id)}
                            onDrop={(e) => onDrop(e, item.id)}
                          >
                            {renderContentItem(item)}
                          </ContentItem>
                        )}

                        {/* 'addBelow' skeletons go after their target */}
                        {generatingSkeletons
                          .filter((s) => s.mode === 'addBelow' && s.targetContentId === item.id)
                          .map((s) => (
                            <ContentSkeleton key={s.id} type={s.type} />
                          ))}
                      </React.Fragment>
                    );
                  })}
                </>
              )}
            </Stack>
          </Stack>
        </Container>
      </Paper>
    </Box>
  );
}
