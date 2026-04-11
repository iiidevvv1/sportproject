import { STONE_COLORS, type StoneColor } from '../types';

interface StoneTrackerProps {
  /** Total shots per end (always 16) */
  totalShots: number;
  /** Current shot number being evaluated (1-based) */
  currentShotNumber: number;
  /** Color of the team WITHOUT hammer (top row, odd shots) */
  colorFirst: StoneColor;
  /** Color of the team WITH hammer (bottom row, even shots) */
  colorSecond: StoneColor;
  /** Whether we're in review mode (show all stones, highlight current) */
  isReview?: boolean;
}

export default function StoneTracker({
  totalShots,
  currentShotNumber,
  colorFirst,
  colorSecond,
  isReview = false,
}: StoneTrackerProps) {
  const stonesPerTeam = totalShots / 2; // 8

  // Top row = team without hammer (odd shots: 1,3,5,7,9,11,13,15)
  // Bottom row = team with hammer (even shots: 2,4,6,8,10,12,14,16)
  const renderRow = (color: StoneColor, isTopRow: boolean) => {
    const stones = [];
    for (let i = 0; i < stonesPerTeam; i++) {
      // Map stone index to actual shot number
      // Top row (odd): i=0→shot1, i=1→shot3, i=2→shot5...
      // Bottom row (even): i=0→shot2, i=1→shot4, i=2→shot6...
      const shotNumber = isTopRow ? i * 2 + 1 : i * 2 + 2;

      const isCompleted = shotNumber < currentShotNumber;
      const isCurrent = shotNumber === currentShotNumber;
      const isFuture = shotNumber > currentShotNumber;

      // In review mode: show all stones, highlight current
      // In normal mode: completed stones disappear
      const isHidden = !isReview && isCompleted;

      // Add gap between pairs (every 2 stones = 1 player's pair)
      const needsGap = i > 0 && i % 2 === 0;

      stones.push(
        <div
          key={shotNumber}
          className={`${needsGap ? 'ml-2.5' : ''}`}
        >
          <div
            className={`
              w-5 h-5 rounded-full transition-all duration-300
              ${isHidden ? 'opacity-0 scale-75' : ''}
              ${isCurrent ? 'animate-pulse ring-2 ring-slate-300 ring-offset-1 scale-110' : ''}
              ${isFuture ? 'opacity-40' : ''}
              ${isReview && isCompleted ? 'opacity-60' : ''}
              ${isReview && isCurrent ? 'opacity-100 animate-pulse ring-2 ring-slate-300 ring-offset-1 scale-110' : ''}
            `}
            style={{
              backgroundColor: isHidden ? 'transparent' : STONE_COLORS[color],
            }}
          />
        </div>,
      );
    }
    return stones;
  };

  return (
    <div className="flex flex-col items-center gap-1.5 py-2 px-4">
      {/* Top row: team without hammer */}
      <div className="flex items-center gap-1">
        {renderRow(colorFirst, true)}
      </div>
      {/* Bottom row: team with hammer */}
      <div className="flex items-center gap-1">
        {renderRow(colorSecond, false)}
      </div>
    </div>
  );
}
