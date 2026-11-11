import React, { useState } from 'react';
import { Lightbulb, ShieldAlert, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { soundFX } from '@/utils/audio';
import { Modal } from '@/components/common/Modal';

export const MAX_BASIC_HINTS = 3;

export interface HintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseFreeHint: () => void;
  onUseTitleHint: () => void;
  basicHintsUsed?: number;
  freeHintUsed: boolean;
  titleHintUsed: boolean;
  titleWordsRemaining: number;
  totalTitleWords?: number;
}

export const HintModal: React.FC<HintModalProps> = ({
  isOpen,
  onClose,
  onUseFreeHint,
  onUseTitleHint,
  basicHintsUsed = 0,
  freeHintUsed,
  titleHintUsed,
  titleWordsRemaining,
  totalTitleWords = 2
}) => {
  const [confirmingTitleHint, setConfirmingTitleHint] = useState(false);

  const usedBasicCount = basicHintsUsed > 0 ? basicHintsUsed : freeHintUsed ? MAX_BASIC_HINTS : 0;
  const remainingBasicHints = Math.max(0, MAX_BASIC_HINTS - usedBasicCount);
  const isBasicExhausted = remainingBasicHints <= 0;

  // US-04 AC #1: Glavni namig je na voljo le, če so v naslovu članka vsaj 2 besedi in je vsaj ena še neodprta
  const isTitleHintEligible =
    totalTitleWords >= 2 && titleWordsRemaining >= 1 && !titleHintUsed;

  const handleClose = () => {
    setConfirmingTitleHint(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="SISTEM POMOČI IN NAMIGOV"
      icon={<Lightbulb size={22} color="var(--accent-gold)" />}
    >
      {confirmingTitleHint ? (
        <div className="classified-card" style={{ borderColor: 'var(--accent-gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={22} color="var(--accent-gold)" />
            <h4 style={{ margin: 0, color: 'var(--accent-gold)' }}>
              OPOZORILO: POTRDITEV GLAVNEGA NAMIGA
            </h4>
          </div>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: 12 }}>
            Ali ste prepričani, da želite uporabiti <strong>glavni namig</strong>? Gre za večjo pomoč, ki neposredno razkrije eno naključno besedo v naslovu članka.
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 18 }}>
            Glavni namig lahko uporabite samo <strong>enkrat (1x)</strong> na posamezno igro, uporaba namiga pa bo zabeležena v statistiki te igre.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn-share"
              style={{
                flex: 1,
                marginTop: 0,
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)'
              }}
              onClick={() => {
                soundFX.playKeypress();
                setConfirmingTitleHint(false);
              }}
            >
              Prekliči
            </button>
            <button
              type="button"
              className="btn-share"
              style={{
                flex: 1,
                marginTop: 0,
                background: 'var(--accent-gold)',
                color: '#000000',
                fontWeight: 700
              }}
              onClick={() => {
                soundFX.playKeypress();
                setConfirmingTitleHint(false);
                onUseTitleHint();
                onClose();
              }}
            >
              Potrdi in razkrij besedo v naslovu
            </button>
          </div>
        </div>
      ) : (
        <div className="hint-options">
          {/* US-03: Osnovni namig (kontekstna beseda) — do 3 uporabe na igro */}
          <div className="classified-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h4 style={{ margin: 0 }}>1. OSNOVNI NAMIG (KONTEKSTNA BESEDA)</h4>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)'
                }}
              >
                Preostalo: {remainingBasicHints} / {MAX_BASIC_HINTS}
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
              Naključno razkrije eno pogosto besedo v besedilu članka, ki še ni bila uganjena. Pomaga pri prepoznavanju konteksta in področja teme.
            </p>
            {isBasicExhausted ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}
              >
                <CheckCircle size={16} /> Porabili ste vse {MAX_BASIC_HINTS} osnovne namige v tej igri.
              </div>
            ) : (
              <button
                type="button"
                className="btn-share"
                style={{
                  background: 'var(--text-primary)',
                  color: 'var(--bg-card)',
                  marginTop: 0
                }}
                onClick={() => {
                  soundFX.playKeypress();
                  onUseFreeHint();
                  onClose();
                }}
              >
                <Lightbulb size={16} /> UPORABI OSNOVNI NAMIG ({remainingBasicHints} PREOSTALO)
              </button>
            )}
          </div>

          {/* US-04: Glavni namig (beseda v naslovu) — največ 1x na igro, le če ima naslov >= 2 besedi */}
          <div className="classified-card" style={{ borderColor: 'var(--accent-gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h4 style={{ margin: 0, color: 'var(--accent-gold)' }}>
                2. GLAVNI NAMIG (BESEDA V NASLOVU)
              </h4>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)'
                }}
              >
                Preostalo: {titleHintUsed ? 0 : 1} / 1
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
              Razkrije natanko eno naključno besedo neposredno v naslovu članka. Na voljo največ enkrat na igro, če naslov vsebuje vsaj 2 besedi.
            </p>
            <div style={{ fontSize: '0.83rem', marginBottom: 14, color: 'var(--text-muted)' }}>
              Skupaj besed v naslovu: <strong>{totalTitleWords}</strong> • Še neodprtih besed v naslovu:{' '}
              <strong>{titleWordsRemaining}</strong>
            </div>

            {titleHintUsed ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}
              >
                <ShieldAlert size={16} /> Glavni namig ste v tej igri že uporabili (največ 1 na igro).
              </div>
            ) : totalTitleWords < 2 ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}
              >
                <HelpCircle size={16} /> Glavni namig ni na voljo (naslov članka ima manj kot 2 besedi).
              </div>
            ) : titleWordsRemaining === 0 ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}
              >
                <CheckCircle size={16} /> Vse besede v naslovu so že razkrite!
              </div>
            ) : (
              <button
                type="button"
                className="btn-share"
                disabled={!isTitleHintEligible}
                style={{
                  background: 'var(--accent-gold)',
                  color: '#000000',
                  marginTop: 0,
                  fontWeight: 700
                }}
                onClick={() => {
                  soundFX.playKeypress();
                  setConfirmingTitleHint(true);
                }}
              >
                <AlertTriangle size={18} /> RAZKRIJ BESEDO V NASLOVU (ZAHTEVA POTRDITEV)
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
