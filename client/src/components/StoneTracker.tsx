import { STONE_COLORS, type StoneColor } from '../types';

interface StoneTrackerProps {
  /** Current shot number being evaluated (1-based) */
  currentShotNumber: number;
  /** Color of the team WITHOUT hammer (top row, odd shots) */
  colorFirst: StoneColor;
  /** Color of the team WITH hammer (bottom row, even shots) */
  colorSecond: StoneColor;
  /** Whether we're in review mode (show all evaluated stones, highlight current) */
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

  const renderRow = (shots: number[], color: StoneColor) => {
    // Filter: only show stones from currentShotNumber onwards (except in review mode)
    const visibleShots = isReview
      ? shots // Show all in review mode
      : shots.filter((s) => s >= currentShotNumber); // Show only current and future

    // Group into pairs: [shot1, shot2], [shot3, shot4], etc.
    const pairs = [];
    for (let i = 0; i < visibleShots.length; i += 2) {
      pairs.push([visibleShots[i], visibleShots[i + 1]].filter((s) => s !== undefined));
    }

    return (
      <div className="flex items-center gap-6">
        {pairs.map((pair, pairIdx) => (
          <div key={pairIdx} className="flex items-center gap-1.5">
            {pair.map((shotNumber) => {
              const isCurrent = shotNumber === currentShotNumber;
              const isCompleted = shotNumber < currentShotNumber;

              return (
                <div
                  key={shotNumber}
                  className={`
                    w-5 h-5 rounded-full transition-all duration-300
                    ${isCurrent ? 'animate-pulse ring-3 ring-slate-900 ring-offset-0 scale-110' : ''}
                    ${isReview && isCompleted ? 'opacity-60' : 'opacity-100'}
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
    <div className="flex flex-col items-center gap-3 py-2 px-4 w-full">
      {/* Top row: team without hammer */}
      <div className="w-full flex justify-center">
        {renderRow(topRowShots, colorFirst)}
      </div>

      {/* Horizontal divider line */}
      <div className="w-80 h-px bg-slate-400" />

      {/* Bottom row: team with hammer */}
      <div className="w-full flex justify-center">
        {renderRow(bottomRowShots, colorSecond)}
      </div>
    </div>
  );
}
