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
    // Divide into 4 pairs: [0,1], [2,3], [4,5], [6,7]
    const pairs = [];
    for (let i = 0; i < 8; i += 2) {
      pairs.push([allShots[i], allShots[i + 1]]);
    }

    return (
      <div className="flex items-center gap-6">
        {pairs.map((pair, pairIdx) => (
          <div key={pairIdx} className="flex items-center gap-1">
            {pair.map((shotNumber) => {
              if (shotNumber === undefined) return null;
              const isCurrent = shotNumber === currentShotNumber;
              const isCompleted = shotNumber < currentShotNumber;
              const isFuture = shotNumber > currentShotNumber;

              return (
                <div
                  key={shotNumber}
                  className={`
                    w-5 h-5 rounded-full transition-all duration-300
                    ${isCurrent && !isReview ? 'animate-pulse ring-3 ring-slate-900 scale-110' : ''}
                    ${isCurrent && isReview ? 'ring-3 ring-slate-900' : ''}
                    ${isFuture ? 'opacity-40' : ''}
                    ${isReview && isCompleted ? 'opacity-60' : ''}
                  `}
                  style={{
                    backgroundColor: STONE_COLORS[color],
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-3 py-2 px-4">
      {/* Top row: team without hammer */}
      <div>{renderRow(topRowShots, colorFirst)}</div>

      {/* Horizontal divider line */}
      <div className="h-px bg-slate-400" style={{ width: 'calc(4 * 20px + 3 * 4px + 3 * 24px)' }} />

      {/* Bottom row: team with hammer */}
      <div>{renderRow(bottomRowShots, colorSecond)}</div>
    </div>
  );
}
