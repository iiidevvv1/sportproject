import { STONE_COLORS, type StoneColor } from '../types';

interface StoneTrackerProps {
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
  currentShotNumber,
  colorFirst,
  colorSecond,
  isReview = false,
}: StoneTrackerProps) {
  const STONE_SIZE = 20; // px

  // Show only stones from currentShotNumber to 16
  // Top row (odd): 1,3,5,7,9,11,13,15
  // Bottom row (even): 2,4,6,8,10,12,14,16
  const topRowShots = [1, 3, 5, 7, 9, 11, 13, 15];
  const bottomRowShots = [2, 4, 6, 8, 10, 12, 14, 16];

  const renderRow = (shots: number[], color: StoneColor) => {
    return shots.map((shotNumber, idx) => {
      const isVisible = shotNumber >= currentShotNumber;
      const isCurrent = shotNumber === currentShotNumber;
      const isCompleted = shotNumber < currentShotNumber;

      // In review mode: show all stones that have been evaluated
      // In normal mode: only show stones from current onwards
      const shouldRender = isReview || isVisible;

      if (!shouldRender) return null;

      return (
        <div
          key={shotNumber}
          className="relative flex items-center justify-center"
          style={{ width: STONE_SIZE, height: STONE_SIZE }}
        >
          <div
            className={`
              w-5 h-5 rounded-full transition-all duration-300
              ${isCurrent ? 'animate-pulse ring-3 ring-slate-900 scale-110' : ''}
              ${isCompleted && isReview ? 'opacity-60' : ''}
            `}
            style={{
              backgroundColor: STONE_COLORS[color],
              visibility: isCurrent || (isReview && isCompleted) || isVisible ? 'visible' : 'hidden',
            }}
          />
          {/* Divider line after position 2, 4, 6 (between pairs) */}
          {idx === 1 || idx === 3 || idx === 5 ? (
            <div
              className="absolute -right-1.5 w-px bg-slate-400"
              style={{ height: 40, top: '50%', transform: 'translateY(-50%)' }}
            />
          ) : null}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col items-center gap-0 py-2 px-4">
      {/* Grid container with horizontal divider */}
      <div className="relative flex flex-col items-center">
        {/* Top row: team without hammer */}
        <div className="flex items-center gap-1">
          {renderRow(topRowShots, colorFirst)}
        </div>

        {/* Horizontal divider line */}
        <div className="h-px w-80 bg-slate-400 my-1.5" />

        {/* Bottom row: team with hammer */}
        <div className="flex items-center gap-1">
          {renderRow(bottomRowShots, colorSecond)}
        </div>
      </div>
    </div>
  );
}
