import * as XLSX from 'xlsx';
import type { GameWithDetails } from '../types';
import { buildExportRows } from './exportRows';

export async function exportGamesToExcel(games: GameWithDetails[]): Promise<void> {
  const rows = buildExportRows(games);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Броски');

  worksheet['!cols'] = [
    { wch: 28 },
    { wch: 14 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 8 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 12 },
  ];

  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  XLSX.writeFile(workbook, `curling-shots-${stamp}.xlsx`);
}
