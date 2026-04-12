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
  // Top row (odd): 1,3,5,7,9,11,13,15 → pairs: [1,3], [5,7], [9,11], [13,15]
  // Bottom row (even): 2,4,6,8,10,12,14,16 → pairs: [2,4], [6,8], [10,12], [14,16]
  const topRowPairs = [[1, 3], [5, 7], [9, 11], [13, 15]];
  const bottomRowPairs = [[2, 4], [6, 8], [10, 12], [14, 16]];

  const renderStone = (shotNumber: number, color: StoneColor) => {
    // Only render if stone hasn't been played yet
    if (shotNumber < currentShotNumber) {
      return <div key={shotNumber} className="w-5 h-5" />;
    }

    const isCurrent = shotNumber === currentShotNumber;
    const isFuture = shotNumber > currentShotNumber;

    return (
      <div
        key={shotNumber}
        className={`
          w-5 h-5 rounded-full transition-all duration-300
          ${isCurrent && !isReview ? 'animate-pulse ring-3 ring-slate-900 scale-110' : ''}
          ${isCurrent && isReview ? 'ring-3 ring-slate-900' : ''}
          ${isFuture ? 'opacity-40' : ''}
        `}
        style={{
          backgroundColor: STONE_COLORS[color],
        }}
      />
    );
  };

  const renderRow = (pairs: number[][], color: StoneColor) => {
    return (
      <div className="flex items-center gap-2">
        {pairs.map((pair, pairIdx) => (
          <div key={pairIdx} className="flex items-center gap-1">
            {/* Pair of stones */}
            <div className="flex gap-1">
              {pair.map((shot) => renderStone(shot, color))}
            </div>

            {/* Vertical divider after each pair except the last */}
            {pairIdx < pairs.length - 1 && (
              <div className="w-px h-6 bg-slate-400" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-2 py-2 px-4">
      {/* Top row: team without hammer */}
      <div>{renderRow(topRowPairs, colorFirst)}</div>

      {/* Horizontal divider */}
      <div className="h-px w-48 bg-slate-400" />

      {/* Bottom row: team with hammer */}
      <div>{renderRow(bottomRowPairs, colorSecond)}</div>
    </div>
  );
}
