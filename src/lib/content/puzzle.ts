// Browser-safe puzzle type (no Node imports): shared by the importer and the app.
export type Puzzle = {
  id: string;
  /** FEN before the opponent's first move. */
  fen: string;
  /** UCI moves; moves[0] is the opponent's move, then the solution alternates. */
  moves: string[];
  rating: number;
  themes: string[];
};
