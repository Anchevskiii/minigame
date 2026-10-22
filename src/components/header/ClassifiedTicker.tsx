import React from 'react';
import { useDailyCountdown } from '@/hooks/useDailyCountdown';

export const ClassifiedTicker: React.FC = () => {
  const timeUntilReset = useDailyCountdown();

  return (
    <div className="classified-ticker-bar">
      <span>TOP SECRET // LEVEL 4 CLEARANCE REQUIRED // RESTRICTED ACCESS</span>
      <span>NEXT DECLASSIFICATION: {timeUntilReset} UTC</span>
    </div>
  );
};
