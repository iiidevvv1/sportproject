import { describe, it, expect } from 'vitest';
import { getShotInfo } from '../../src/lib/shotOrder';

describe('getShotInfo', () => {
  it('shot 1: team without hammer, Lead, stone 1', () => {
    const info = getShotInfo(1, 'home');
    expect(info).toEqual({ team: 'away', playerNumber: 1, positionName: 'Лид', stoneOfPlayer: 1 });
  });

  it('shot 2: team with hammer, Lead, stone 1', () => {
    const info = getShotInfo(2, 'home');
    expect(info).toEqual({ team: 'home', playerNumber: 1, positionName: 'Лид', stoneOfPlayer: 1 });
  });

  it('shot 3: team without hammer, Lead, stone 2', () => {
    const info = getShotInfo(3, 'home');
    expect(info).toEqual({ team: 'away', playerNumber: 1, positionName: 'Лид', stoneOfPlayer: 2 });
  });

  it('shot 4: team with hammer, Lead, stone 2', () => {
    const info = getShotInfo(4, 'home');
    expect(info).toEqual({ team: 'home', playerNumber: 1, positionName: 'Лид', stoneOfPlayer: 2 });
  });

  it('shot 5: team without hammer, Second, stone 1', () => {
    const info = getShotInfo(5, 'home');
    expect(info).toEqual({ team: 'away', playerNumber: 2, positionName: 'Второй', stoneOfPlayer: 1 });
  });

  it('shot 13: team without hammer, Skip, stone 1', () => {
    const info = getShotInfo(13, 'home');
    expect(info).toEqual({ team: 'away', playerNumber: 4, positionName: 'Скип', stoneOfPlayer: 1 });
  });

  it('shot 16: team with hammer, Skip, stone 2', () => {
    const info = getShotInfo(16, 'home');
    expect(info).toEqual({ team: 'home', playerNumber: 4, positionName: 'Скип', stoneOfPlayer: 2 });
  });

  it('works when away has hammer', () => {
    const info = getShotInfo(1, 'away');
    expect(info).toEqual({ team: 'home', playerNumber: 1, positionName: 'Лид', stoneOfPlayer: 1 });
  });
});
