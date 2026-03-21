import type { TeamSide, PlayerPosition } from '../types';
import { POSITION_NAMES } from '../types';

export interface ShotInfo {
  team: TeamSide;
  playerNumber: PlayerPosition;
  positionName: string;
  stoneOfPlayer: 1 | 2;
}

/**
 * Given a shot number (1-16) and which team has the hammer this end,
 * returns who throws and which player/stone it is.
 *
 * Pattern: shots alternate teams. Odd shots = team WITHOUT hammer, even = WITH hammer.
 * Every 4 shots change player: 1-4 Lead, 5-8 Second, 9-12 Third, 13-16 Skip.
 * Within each player's 4 shots: shots 1,2 are stone 1; shots 3,4 are stone 2.
 */
export function getShotInfo(shotNumber: number, hammerTeam: TeamSide): ShotInfo {
  const isOdd = shotNumber % 2 === 1;
  const team: TeamSide = isOdd
    ? (hammerTeam === 'home' ? 'away' : 'home')
    : hammerTeam;

  const playerNumber = Math.ceil(shotNumber / 4) as PlayerPosition;
  const positionName = POSITION_NAMES[playerNumber];

  // Within each group of 4: positions 1,2 are stone 1; positions 3,4 are stone 2
  const posInGroup = (shotNumber - 1) % 4;
  const stoneOfPlayer: 1 | 2 = posInGroup < 2 ? 1 : 2;

  return { team, playerNumber, positionName, stoneOfPlayer };
}

/**
 * Determine which team has the hammer in a given end.
 * The team that scored in the previous end loses the hammer.
 * If blank (0-0), the hammer stays with the same team.
 */
export function getHammerForEnd(
  endNumber: number,
  hammerFirstEnd: TeamSide,
  endResults: Array<{ number: number; score_home: number; score_away: number }>,
): TeamSide {
  if (endNumber === 1) return hammerFirstEnd;

  // Find previous end result
  const prevEnd = endResults.find((e) => e.number === endNumber - 1);
  if (!prevEnd) return hammerFirstEnd; // fallback if no data yet

  if (prevEnd.score_home > 0) {
    // Home scored => away gets hammer
    return 'away';
  } else if (prevEnd.score_away > 0) {
    // Away scored => home gets hammer
    return 'home';
  } else {
    // Blank end: hammer stays (recurse to previous)
    return getHammerForEnd(endNumber - 1, hammerFirstEnd, endResults);
  }
}
