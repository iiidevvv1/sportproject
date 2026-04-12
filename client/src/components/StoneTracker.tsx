import { STONE_COLORS, type StoneColor } from '../types';

interface StoneTrackerProps {
  /** Current shot number being evaluated (1-based) */
  currentShotNumber: number;
  /** Color of the team WITHOUT hammer (top row, odd shots) */
  colorFirst: StoneColor;
  /** Color of the team WITH hammer (bottom row, even shots) */
  colorSecond: StoneColor;
  /** Whether we're in review mode */
  isReview?: boolean;
}

export default function StoneTracker({
  currentShotNumber,
  colorFirst,
  colorSecond,
  isReview = false,
}: StoneTrackerProps) {
  // Top row (odd): 1,3,5,7,9,11,13,15
  // Bottom row (even): 2,4,6,8,10,12,14,16
  const topRowShots = [1, 3, 5, 7, 9, 11, 13, 15];
  const bottomRowShots = [2, 4, 6, 8, 10, 12, 14, 16];

  const renderRow = (allShots: number[], color: StoneColor) => {
    return (
      <div className="flex items-center justify-center relative">
        {/* Fixed grid: 8 stones + 3 dividers between pairs */}
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(8, 20px)' }}>
          {allShots.map((shotNumber) => {
            if (shotNumber === undefined) return null;

            // Only render stones that haven't been played yet
            if (shotNumber < currentShotNumber) {
              return <div key={shotNumber} />;
            }

            const isCurrent = shotNumber === currentShotNumber;
            const isFuture = shotNumber > currentShotNumber;

            return (
              <div
                key={shotNumber}
                className={`
                  w-5 h-5 rounded-full transition-all duration-300 relative
                  ${isCurrent && !isReview ? 'animate-pulse ring-3 ring-slate-900 scale-110' : ''}
                  ${isCurrent && isReview ? 'ring-3 ring-slate-900' : ''}
                  ${isFuture ? 'opacity-40' : ''}
                `}
                style={{
                  backgroundColor: STONE_COLORS[color],
                }}
              />
            );
          })}
        </div>

        {/* Fixed vertical dividers at absolute positions */}
        <div className="absolute top-0 bottom-0 flex items-center" style={{ left: '50px' }}>
          <div className="w-px h-6 bg-slate-400" />
        </div>
        <div className="absolute top-0 bottom-0 flex items-center" style={{ left: '78px' }}>
          <div className="w-px h-6 bg-slate-400" />
        </div>
        <div className="absolute top-0 bottom-0 flex items-center" style={{ left: '106px' }}>
          <div className="w-px h-6 bg-slate-400" />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-3 py-2 px-4">
      {/* Top row: team without hammer */}
      <div>{renderRow(topRowShots, colorFirst)}</div>

      {/* Horizontal divider line */}
      <div className="h-px bg-slate-400 w-full" />

      {/* Bottom row: team with hammer */}
      <div>{renderRow(bottomRowShots, colorSecond)}</div>
    </div>
  );
}
