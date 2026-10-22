import React from 'react';

interface DossierMetaHeaderProps {
  puzzleNumber: number;
  isWon: boolean;
  totalHiddenWords: number;
  revealedWordsCount: number;
}

export const DossierMetaHeader: React.FC<DossierMetaHeaderProps> = ({
  puzzleNumber,
  isWon,
  totalHiddenWords,
  revealedWordsCount
}) => {
  const remainingCount = Math.max(0, totalHiddenWords - revealedWordsCount);

  return (
    <div className="dossier-meta-header">
      <div>
        <span>FILE IDENTIFIER: </span>
        <strong>WIKI-DOC-{puzzleNumber.toString().padStart(4, '0')}</strong>
      </div>
      <div>
        <span>SOURCE: </span>
        <strong>ENGLISH WIKIPEDIA RESTRICTED ARCHIVE</strong>
      </div>
      <div>
        <span>REDACTION STATUS: </span>
        <strong>
          {isWon ? '100% UNVEILED' : `${remainingCount} WORDS REMAINING`}
        </strong>
      </div>
    </div>
  );
};
