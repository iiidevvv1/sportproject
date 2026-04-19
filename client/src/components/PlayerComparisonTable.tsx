import { Star, Shield, Sigma } from 'lucide-react';
import type { DisplayTeamStats } from '../lib/statsCalc';

const POSITION_LABELS = ['ЛИД', '2-Й', '3-Й', 'СКИП'];

interface PlayerComparisonTableProps {
  home: DisplayTeamStats;
  away: DisplayTeamStats;
  homeColor: string;
  awayColor: string;
}

export default function PlayerComparisonTable({ home, away, homeColor, awayColor }: PlayerComparisonTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[360px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-2 py-4 text-[11px] font-bold uppercase tracking-tight text-slate-500 w-[16%]">Поз</th>
              <th className="px-1 py-4 text-[11px] font-bold uppercase tracking-tight text-center w-[14%] text-primary">
                <div className="flex items-center justify-center space-x-1">
                  <Star size={16} style={{ color: homeColor, fill: homeColor }} />
                  <span>%</span>
                </div>
              </th>
              <th className="px-1 py-4 text-[11px] font-bold uppercase tracking-tight text-center w-[14%] text-primary">D</th>
              <th className="px-1 py-4 text-[11px] font-bold uppercase tracking-tight text-center w-[14%] text-primary">T</th>
              <th className="px-1 py-4 text-[11px] font-bold uppercase tracking-tight text-center w-[14%] text-primary bg-primary/5">
                <div className="flex items-center justify-center space-x-1">
                  <Shield size={16} style={{ color: awayColor, fill: awayColor }} />
                  <span>%</span>
                </div>
              </th>
              <th className="px-1 py-4 text-[11px] font-bold uppercase tracking-tight text-center w-[14%] text-primary bg-primary/5">D</th>
              <th className="px-1 py-4 text-[11px] font-bold uppercase tracking-tight text-center w-[14%] text-primary bg-primary/5">T</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {home.players.map((player, idx) => {
              const awayPlayer = away.players[idx];
              return (
                <tr key={player.position} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-2 py-4 font-semibold text-xs border-r border-slate-50 text-slate-600">
                    {POSITION_LABELS[idx]}
                  </td>
                  <td className="px-1 py-4 text-center font-headline font-bold text-sm text-slate-900">
                    {player.avg}%
                  </td>
                  <td className="px-1 py-4 text-center text-xs text-slate-600">{player.drawAvg}%</td>
                  <td className="px-1 py-4 text-center text-xs text-slate-600">{player.takeoutAvg}%</td>
                  <td
                    className="px-1 py-4 text-center font-headline font-bold text-sm text-slate-900"
                    style={{ backgroundColor: `${awayColor}10` }}
                  >
                    {awayPlayer?.avg ?? 0}%
                  </td>
                  <td
                    className="px-1 py-4 text-center text-xs text-slate-600"
                    style={{ backgroundColor: `${awayColor}10` }}
                  >
                    {awayPlayer?.drawAvg ?? 0}%
                  </td>
                  <td
                    className="px-1 py-4 text-center text-xs text-slate-600"
                    style={{ backgroundColor: `${awayColor}10` }}
                  >
                    {awayPlayer?.takeoutAvg ?? 0}%
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-primary/10 border-t border-primary/20 font-bold">
              <td className="px-2 py-4 text-center border-r border-primary/10">
                <Sigma size={20} strokeWidth={3} className="mx-auto text-primary" />
              </td>
              <td className="px-1 py-4 text-center text-sm text-slate-900">{home.avg}%</td>
              <td
                className="px-1 py-4 text-[10px] text-slate-500 italic text-center"
                colSpan={2}
              >
                Бросков: {home.shotCount}
              </td>
              <td className="px-1 py-4 text-center text-sm text-slate-900">{away.avg}%</td>
              <td
                className="px-1 py-4 text-[10px] text-slate-500 italic text-center"
                colSpan={2}
              >
                Бросков: {away.shotCount}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
