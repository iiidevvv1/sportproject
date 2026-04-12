import { STONE_COLORS, type StoneColor } from '../types';

interface StoneTrackerProps {
  /** Current shot number being evaluated (1-based) */
  currentShotNumber: number;
  /** Color of the team WITHOUT hammer (top row, odd shots) */
  colorFirst: StoneColor;
  /** Color of the team WITH hammer (bottom row, even shots) */
  colorSecond: StoneColor;
  /** Whether we're in review mode (highlight current stone) */
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

  // Always show only stones from currentShotNumber onwards (filtered from DOM)
  const renderRow = (allShots: number[], color: StoneColor) => {
    // Filter: only render stones >= currentShotNumber
    const visibleShots = allShots.filter((s) => s >= currentShotNumber);

    // Map each visible shot to fixed grid position
    // Position 0 = shot 1 or 2
    // Position 1 = shot 3 or 4
    // Position 2 = shot 5 or 6
    // etc.
    const gridPositions = visibleShots.map((shotNumber) => {
      const isOdd = shotNumber % 2 === 1;
      const position = isOdd ? (shotNumber - 1) / 2 : (shotNumber - 2) / 2;
      return { shotNumber, position };
    });

    // Render 8 fixed grid cells (one for each position in this row)
    const cells = [];
    for (let pos = 0; pos < 8; pos++) {
      const stone = gridPositions.find((s) => s.position === pos);
      const shotNumber = stone?.shotNumber;
      const isCurrent = shotNumber === currentShotNumber;
      const isCompleted = shotNumber !== undefined && shotNumber < currentShotNumber;

      cells.push(
        <div key={pos} className="relative flex items-center justify-center w-5 h-5">
          {shotNumber !== undefined && (
            <div
              className={`
                w-5 h-5 rounded-full transition-all duration-300
                ${isCurrent ? 'animate-pulse ring-3 ring-slate-900 scale-110' : ''}
                ${isReview && isCompleted ? 'opacity-60' : 'opacity-100'}
              `}
              style={{
                backgroundColor: STONE_COLORS[color],
              }}
            />
          )}
          {/* Vertical divider after positions 1, 3, 5 (between pairs) */}
          {(pos === 1 || pos === 3 || pos === 5) && (
            <div className="absolute -right-3 w-px h-6 bg-slate-400" />
          )}
        </div>,
      );
    }

    return cells;
  };

  return (
    <div className="flex flex-col items-center gap-3 py-2 px-4">
      {/* Top row: team without hammer */}
      <div className="flex items-center gap-1">
        {renderRow(topRowShots, colorFirst)}
      </div>

      {/* Horizontal divider line — fixed width for 8 stones */}
      <div className="h-px bg-slate-400" style={{ width: 'calc(8 * 20px + 7 * 4px)' }} />

      {/* Bottom row: team with hammer */}
      <div className="flex items-center gap-1">
        {renderRow(bottomRowShots, colorSecond)}
      </div>
    </div>
  );
}
