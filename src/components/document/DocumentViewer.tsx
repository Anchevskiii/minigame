import React, { memo } from 'react';
import type { Puzzle, Token } from '@/types/game';
import { DocumentToken } from '@/components/document/DocumentToken';
import { DossierMetaHeader } from '@/components/document/DossierMetaHeader';

export interface DocumentViewerProps {
  puzzle: Puzzle;
  revealedTokenIds: Set<number>;
  justRevealedTokenIds: Set<number>;
  activeHighlightedTokenIds: Set<number>;
  currentFocusTokenId: number | null;
  isWon: boolean;
  onTokenClick?: (token: Token) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = memo(({
  puzzle,
  revealedTokenIds,
  justRevealedTokenIds,
  activeHighlightedTokenIds = new Set(),
  currentFocusTokenId = null,
  isWon,
  onTokenClick
}) => {
  const renderToken = (token: Token) => {
    const isRevealed = isWon || Boolean(token.isStopWord) || revealedTokenIds.has(token.id);
    const isJustRevealed = justRevealedTokenIds.has(token.id);
    const isActiveHighlight = Boolean(activeHighlightedTokenIds?.has(token.id));
    const isCurrentFocus = currentFocusTokenId === token.id;

    return (
      <DocumentToken
        key={token.id}
        token={token}
        isRevealed={isRevealed}
        isJustRevealed={isJustRevealed}
        isActiveHighlight={isActiveHighlight}
        isCurrentFocus={isCurrentFocus}
        onTokenClick={onTokenClick}
      />
    );
  };

  return (
    <article className="dossier-sheet" id="dossier-container">
      {/* Watermark stamp */}
      <div className="classified-watermark">
        {isWon ? 'DECLASSIFIED IN FULL' : 'CONFIDENTIAL // DECLASSIFIED IN PART'}
      </div>

      <DossierMetaHeader
        puzzleNumber={puzzle.puzzleNumber}
        isWon={isWon}
        totalHiddenWords={puzzle.stats.hiddenWords}
        revealedWordsCount={revealedTokenIds.size}
      />

      {/* Title */}
      <h1 className="document-title" id="article-title">
        {puzzle.titleTokens.map(renderToken)}
      </h1>

      {/* Sections and Paragraphs */}
      {puzzle.sections.map((section, sIdx) => (
        <div key={sIdx} className="document-section">
          {section.heading && (
            <h2 className="document-heading">
              {section.heading.tokens.map(renderToken)}
            </h2>
          )}

          {section.paragraphs.map((p, pIdx) => (
            <p key={pIdx} className="document-paragraph">
              {p.tokens.map(renderToken)}
            </p>
          ))}
        </div>
      ))}
    </article>
  );
});

DocumentViewer.displayName = 'DocumentViewer';
