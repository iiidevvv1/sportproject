export interface EndRow {
  id: number;
  game_id: number;
  number: number;
  score_home: number;
  score_away: number;
  hammer: string;
  status?: string;
}

/**
 * Determine which team has hammer for a given end number.
 * Rules:
 * - End 1: hammer_first_end team
 * - Subsequent ends: team that did NOT score in previous end
 * - Blank ends (0:0): hammer carries over
 */
export function getHammerForEnd(
  endNumber: number,
  hammerFirstEnd: string,
  endResults: EndRow[]
): string {
  if (endNumber === 1) return hammerFirstEnd;

  const prevEnd = endResults.find((e) => e.number === endNumber - 1);
  if (!prevEnd) return hammerFirstEnd;

  // Blank end - hammer stays with same team
  if (prevEnd.score_home === 0 && prevEnd.score_away === 0) {
    return getHammerForEnd(endNumber - 1, hammerFirstEnd, endResults);
  }

  // Team that scored loses hammer
  return prevEnd.score_home > prevEnd.score_away ? 'away' : 'home';
}
