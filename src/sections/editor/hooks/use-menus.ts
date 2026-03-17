import * as React from 'react';

import type { CommandMenuState, ContentMenuState } from '../types';

// ----------------------------------------------------------------------

export function useMenus() {
  const [commandMenu, setCommandMenu] = React.useState<CommandMenuState>({
    anchor: null,
    contentId: null,
    mode: 'transform',
  });

  const [contentMenu, setContentMenu] = React.useState<ContentMenuState>({
    anchor: null,
    contentId: null,
  });

  const [turnIntoMenuAnchor, setTurnIntoMenuAnchor] = React.useState<HTMLElement | null>(null);

  return {
    commandMenu,
    setCommandMenu,
    contentMenu,
    setContentMenu,
    turnIntoMenuAnchor,
    setTurnIntoMenuAnchor,
  };
}
