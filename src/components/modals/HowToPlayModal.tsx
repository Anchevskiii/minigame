import React from 'react';
import { HelpCircle, Target, Sparkles, BookOpen, KeyRound } from 'lucide-react';
import { Modal } from '@/components/common/Modal';

export interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="MISSION BRIEFING: PROTOCOLS"
      icon={<HelpCircle size={22} color="var(--text-primary)" />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.92rem' }}>
        <div className="classified-card">
          <h4>
            <Target size={14} style={{ display: 'inline', marginRight: 4 }} /> 1. THE OBJECTIVE
          </h4>
          <p style={{ color: 'var(--text-secondary)' }}>
            Each day at <strong>00:00 UTC</strong>, a new classified Wikipedia document is transmitted globally. Deduce the confidential subject of the article by guessing words to declassify its hidden contents.
          </p>
        </div>

        <div className="classified-card">
          <h4>
            <KeyRound size={14} style={{ display: 'inline', marginRight: 4 }} /> 2. SMART GUESSING & LEMMATIZATION
          </h4>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
            Common English syntax words (<em>the, is, an, of, in, on, to</em>) and punctuation are pre-revealed to establish the structural skeleton.
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            The engine automatically groups grammatical word roots: guessing <strong>"ACT"</strong> will also unveil <strong>"ACTS"</strong>, <strong>"ACTING"</strong>, and <strong>"ACTED"</strong>!
          </p>
        </div>

        <div className="classified-card">
          <h4>
            <BookOpen size={14} style={{ display: 'inline', marginRight: 4 }} /> 3. REDACTION BLOCKS
          </h4>
          <p style={{ color: 'var(--text-secondary)' }}>
            Black blocks <span style={{ background: '#111', color: '#111', padding: '1px 6px', borderRadius: 2 }}>██████</span> match the exact letter count of the redacted word. Hover or tap on any block to inspect its length.
          </p>
        </div>

        <div className="classified-card">
          <h4>
            <Sparkles size={14} style={{ display: 'inline', marginRight: 4 }} /> 4. VICTORY & SHARE
          </h4>
          <p style={{ color: 'var(--text-secondary)' }}>
            The file is completely solved once you successfully guess all keywords in the <strong>Article Title</strong>. Upon victory, the full document declassifies, and you can copy your spoiler-free transmission stats to share with friends!
          </p>
        </div>
      </div>
    </Modal>
  );
};
