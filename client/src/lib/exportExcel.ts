import * as XLSX from 'xlsx';
import type { Game, GameStats } from '../types';
import { buildExportRows } from './exportRows';

export async function exportGamesToExcel(entries: Array<{ game: Game; stats: GameStats }>): Promise<void> {
  const rows = buildExportRows(entries);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Статистика');

  worksheet['!cols'] = [
    { wch: 34 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 18 },
  ];

  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  XLSX.writeFile(workbook, `curling-stats-${stamp}.xlsx`);
}
