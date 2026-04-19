import type { DisplayPlayerStats } from '../lib/statsCalc';

interface PlayerStatsCardProps {
  player: DisplayPlayerStats;
  positionLabel: string;
}

export default function PlayerStatsCard({ player, positionLabel }: PlayerStatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
      {/* Header row */}
      <div className="px-3 md:px-4 py-1 md:py-2 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-headline text-sm md:text-xl font-bold text-[#0d1c2e]">
          {positionLabel}
        </h3>
        <div className="text-right text-xs md:text-lg font-bold text-slate-600">
          {player.shotCount} / <span className="text-primary font-black">{player.avg}%</span>
        </div>
      </div>

      {/* Table grid */}
      <div className="grid grid-cols-2 divide-x divide-slate-200">
        {/* Draw column */}
        <div className="divide-y divide-slate-50">
          <div className="grid grid-cols-[1fr_1.5rem_2rem] items-center gap-1 px-2 md:px-4 py-1 md:py-1.5 bg-slate-50/50">
            <span className="text-xs md:text-base font-bold text-slate-700">Draw</span>
            <span className="text-xs md:text-sm text-slate-600 text-center tabular-nums font-medium">{player.drawCount}</span>
            <span className="text-xs md:text-base font-bold text-slate-700 text-right tabular-nums">{player.drawCount > 0 ? `${player.drawAvg}%` : '–'}</span>
          </div>
          <div className="grid grid-cols-[1fr_1.5rem_2rem] items-center gap-1 px-2 md:px-4 py-0.5 md:py-1">
            <span className="text-xs md:text-sm text-slate-600">In</span>
            <span className="text-xs md:text-sm text-slate-600 text-center tabular-nums font-medium">{player.drawInCount}</span>
            <span className="text-xs md:text-sm text-slate-600 text-right tabular-nums">{player.drawInCount > 0 ? `${player.inturnDrawAvg}%` : '–'}</span>
          </div>
          <div className="grid grid-cols-[1fr_1.5rem_2rem] items-center gap-1 px-2 md:px-4 py-0.5 md:py-1">
            <span className="text-xs md:text-sm text-slate-600">Out</span>
            <span className="text-xs md:text-sm text-slate-600 text-center tabular-nums font-medium">{player.drawOutCount}</span>
            <span className="text-xs md:text-sm text-slate-600 text-right tabular-nums">{player.drawOutCount > 0 ? `${player.outturnDrawAvg}%` : '–'}</span>
          </div>
        </div>
        {/* Take column */}
        <div className="divide-y divide-slate-50">
          <div className="grid grid-cols-[1fr_1.5rem_2rem] items-center gap-1 px-2 md:px-4 py-1 md:py-1.5 bg-slate-50/50">
            <span className="text-xs md:text-base font-bold text-slate-700">Take</span>
            <span className="text-xs md:text-sm text-slate-600 text-center tabular-nums font-medium">{player.takeoutCount}</span>
            <span className="text-xs md:text-base font-bold text-slate-700 text-right tabular-nums">{player.takeoutCount > 0 ? `${player.takeoutAvg}%` : '–'}</span>
          </div>
          <div className="grid grid-cols-[1fr_1.5rem_2rem] items-center gap-1 px-2 md:px-4 py-0.5 md:py-1">
            <span className="text-xs md:text-sm text-slate-600">In</span>
            <span className="text-xs md:text-sm text-slate-600 text-center tabular-nums font-medium">{player.takeoutInCount}</span>
            <span className="text-xs md:text-sm text-slate-600 text-right tabular-nums">{player.takeoutInCount > 0 ? `${player.inturnTakeoutAvg}%` : '–'}</span>
          </div>
          <div className="grid grid-cols-[1fr_1.5rem_2rem] items-center gap-1 px-2 md:px-4 py-0.5 md:py-1">
            <span className="text-xs md:text-sm text-slate-600">Out</span>
            <span className="text-xs md:text-sm text-slate-600 text-center tabular-nums font-medium">{player.takeoutOutCount}</span>
            <span className="text-xs md:text-sm text-slate-600 text-right tabular-nums">{player.takeoutOutCount > 0 ? `${player.outturnTakeoutAvg}%` : '–'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
