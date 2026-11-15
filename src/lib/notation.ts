// Maps English SAN piece letters to Spanish ones (N->C, B->A, Q->D, R->T, K->R).
// Pawns have no letter. The piece letter only appears at the start of a move
// and after "=" (promotion), so only those positions are translated.
const PIECE_LETTERS: Record<string, string> = {
  N: "C",
  B: "A",
  Q: "D",
  R: "T",
  K: "R",
};

export function toSpanishSan(san: string): string {
  return san
    .replace(/^[NBQRK]/, (letter) => PIECE_LETTERS[letter])
    .replace(/=([NBQRK])/g, (_match, letter: string) => `=${PIECE_LETTERS[letter]}`);
}

// startPly: 0-based ply index of the first move (0 = white, 1 = black).
export function formatMoveList(sans: string[], startPly = 0): string {
  const parts: string[] = [];
  let ply = startPly;
  sans.forEach((san, i) => {
    const moveNumber = Math.floor(ply / 2) + 1;
    const isWhite = ply % 2 === 0;
    const text = toSpanishSan(san);
    if (isWhite) {
      parts.push(`${moveNumber}. ${text}`);
    } else if (i === 0) {
      parts.push(`${moveNumber}... ${text}`);
    } else {
      parts.push(text);
    }
    ply += 1;
  });
  return parts.join(" ");
}
