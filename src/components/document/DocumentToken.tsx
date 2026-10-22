import React, { memo } from 'react';
import type { Token } from '@/types/game';

interface DocumentTokenProps {
  token: Token;
  isRevealed: boolean;
  isJustRevealed: boolean;
  isActiveHighlight: boolean;
  isCurrentFocus: boolean;
  onTokenClick?: (token: Token) => void;
}

export const DocumentToken: React.FC<DocumentTokenProps> = memo(({
  token,
  isRevealed,
  isJustRevealed,
  isActiveHighlight,
  isCurrentFocus,
  onTokenClick
}) => {
  if (token.type === 'space') {
    return <span className="token token-space">{token.text}</span>;
  }

  if (token.type === 'punct') {
    return <span className="token token-punct">{token.text}</span>;
  }

  if (isRevealed) {
    const classNames = [
      'token',
      'token-revealed',
      isActiveHighlight ? 'token-active-highlight' : '',
      isCurrentFocus ? 'token-current-focus' : '',
      isJustRevealed ? 'token-just-revealed' : '',
      token.isTitle ? 'token-title-word' : ''
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <span
        id={`token-${token.id}`}
        className={classNames}
        data-canonical={token.canonical}
      >
        {token.text}
      </span>
    );
  }

  // Hidden / Redacted Token
  const blockChars = '█'.repeat(token.length || token.text.length);

  return (
    <span
      id={`token-${token.id}`}
      className="token token-redacted"
      title={`[ ${token.length || token.text.length} letters ]`}
      onClick={() => onTokenClick?.(token)}
      role="button"
      tabIndex={0}
      aria-label={`Redacted word, ${token.length} characters`}
    >
      {blockChars}
    </span>
  );
});

DocumentToken.displayName = 'DocumentToken';
