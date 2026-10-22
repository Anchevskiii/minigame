import { useState, useEffect, useCallback } from 'react';
import { soundFX } from '@/utils/audio';
import { loadSoundSetting, saveSoundSetting } from '@/utils/storage';

export function useSound() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => loadSoundSetting());

  useEffect(() => {
    soundFX.enabled = soundEnabled;
    saveSoundSetting(soundEnabled);
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  return {
    soundEnabled,
    setSoundEnabled,
    toggleSound
  };
}
