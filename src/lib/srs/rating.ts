// Glicko-1 single-game update of the player's estimated rating against a puzzle.
// No time-based RD growth in v1.

const Q = Math.LN10 / 400;
const PUZZLE_RD = 80;
const MIN_RD = 50;

const g = (rd: number) => 1 / Math.sqrt(1 + (3 * Q * Q * rd * rd) / (Math.PI * Math.PI));

export function updateRating(
  player: { r: number; rd: number },
  puzzleRating: number,
  solved: boolean,
): { r: number; rd: number } {
  const gj = g(PUZZLE_RD);
  const expected = 1 / (1 + Math.pow(10, (-gj * (player.r - puzzleRating)) / 400));
  const dSquared = 1 / (Q * Q * gj * gj * expected * (1 - expected));
  const precision = 1 / (player.rd * player.rd) + 1 / dSquared;
  return {
    r: player.r + (Q / precision) * gj * ((solved ? 1 : 0) - expected),
    rd: Math.max(MIN_RD, Math.sqrt(1 / precision)),
  };
}
